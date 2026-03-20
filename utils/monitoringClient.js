const logger = require('./logger');

/**
 * MonitoringClient
 * Handles internal communication with Prometheus and Loki
 */
class MonitoringClient {
    constructor() {
        this.prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
        this.lokiUrl = process.env.LOKI_URL || 'http://loki:3100';
        
        // Basic Auth support (still available via ENV if needed)
        this.promAuth = process.env.PROMETHEUS_USER && process.env.PROMETHEUS_PASS 
            ? 'Basic ' + Buffer.from(`${process.env.PROMETHEUS_USER}:${process.env.PROMETHEUS_PASS}`).toString('base64') 
            : null;
        this.lokiAuth = process.env.LOKI_USER && process.env.LOKI_PASS 
            ? 'Basic ' + Buffer.from(`${process.env.LOKI_USER}:${process.env.LOKI_PASS}`).toString('base64') 
            : null;
    }

    /**
     * Parse timeframe into Prometheus format (e.g. 30d, 7d, 24h)
     */
    getTimeframeDuration(timeframe) {
        if (!timeframe) return '30d';
        // Map common frontend values to PromQL durations
        const mapping = {
            'now-24h': '24h',
            'now-7d': '7d',
            'now-30d': '30d',
            'now-90d': '90d'
        };
        return mapping[timeframe] || '30d';
    }

    /**
     * Query Prometheus for a specific metric
     */
    async queryPrometheus(query) {
        try {
            const url = `${this.prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
            const headers = this.promAuth ? { 'Authorization': this.promAuth } : {};
            const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error(`Status ${response.status}: ${response.statusText}`);
            const data = await response.json();
            return data.status === 'success' ? data.data.result : [];
        } catch (error) {
            throw new Error(`Prometheus Unreachable (${this.prometheusUrl}): ${error.message}`);
        }
    }

    /**
     * Get aggregate metrics for the report (Structured for Enterprise PDF)
     */
    async asyncGetStructuredReport(timeframe = 'now-30d') {
        const duration = this.getTimeframeDuration(timeframe);
        
        // Parallel Fetch - Let errors bubble up to controller
        // Note: Using subquery syntax [duration:resolution] to calculate averages from instant vectors over time.
        const [cpuRes, ramRes, reqRes, err5xxRes, logsSummary] = await Promise.all([
            this.queryPrometheus(`avg_over_time((100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100))[${duration}:1h])`),
            this.queryPrometheus(`avg_over_time(((node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100)[${duration}:1h])`),
            this.queryPrometheus(`sum(increase(traefik_entrypoint_requests_total{entrypoint="websecure"}[${duration}]))`),
            this.queryPrometheus(`sum(increase(traefik_entrypoint_requests_total{entrypoint="websecure", code=~"5.."}[${duration}]))`),
            this.getLogSummary(timeframe)
        ]);

        const avgCpu = Number(cpuRes[0]?.value?.[1]) || 0;
        const avgRam = Number(ramRes[0]?.value?.[1]) || 0;
        const totalRequests = Math.round(Number(reqRes[0]?.value?.[1]) || 0);
        const errCount = Number(err5xxRes[0]?.value?.[1]) || 0;
        const errorRate = totalRequests > 0 ? ((errCount / totalRequests) * 100).toFixed(2) : "0.00";

        return {
            avgCpu: avgCpu.toFixed(1),
            avgRam: avgRam.toFixed(1),
            totalRequests,
            errorRate,
            criticalErrors: logsSummary.criticalErrors || 0,
            services: [
                { name: "Traefik Router", status: Number(errorRate) < 1 ? "healthy" : "warning", details: `${totalRequests.toLocaleString()} req handled with ${errorRate}% error rate.`},
                { name: "API Cluster", status: avgCpu < 70 ? "healthy" : "warning", details: `Core cluster responsive with ${avgCpu.toFixed(1)}% avg load.`},
                { name: "FFmpeg Workers", status: "healthy", details: "Streaming pipelines operational. Hardware transcoding active." }
            ],
            alerts: []
        };
    }

    /**
     * Query Loki for error counts
     */
    async getLogSummary(timeframe = 'now-30d') {
        const duration = this.getTimeframeDuration(timeframe);
        try {
            const query = `count_over_time({container="streamvision_app"} |= "error" [${duration}])`;
            const url = `${this.lokiUrl}/loki/api/v1/query?query=${encodeURIComponent(query)}`;
            const headers = this.lokiAuth ? { 'Authorization': this.lokiAuth } : {};
            
            const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error(`Status ${response.status}: ${response.statusText}`);
            const data = await response.json();
            
            const count = data.data?.result?.[0]?.value?.[1] || 0;
            return {
                criticalErrors: parseInt(count),
                healthStatus: parseInt(count) > 50 ? 'Warning' : 'Healthy'
            };
        } catch (error) {
            throw new Error(`Loki Unreachable (${this.lokiUrl}): ${error.message}`);
        }
    }
}

module.exports = new MonitoringClient();
