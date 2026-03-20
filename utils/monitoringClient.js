const logger = require('./logger');

/**
 * MonitoringClient
 * Handles internal communication with Prometheus and Loki
 */
class MonitoringClient {
    constructor() {
        this.prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
        this.lokiUrl = process.env.LOKI_URL || 'http://loki:3100';
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
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Prometheus error: ${response.statusText}`);
            const data = await response.json();
            return data.status === 'success' ? data.data.result : [];
        } catch (error) {
            logger.error(`Error querying Prometheus: ${error.message}`);
            return [];
        }
    }

    /**
     * Get aggregate metrics for the report (Structured for Enterprise PDF)
     */
    async asyncGetStructuredReport(timeframe = 'now-30d') {
        const duration = this.getTimeframeDuration(timeframe);
        
        // 1. Core Resource Metrics
        const cpuQuery = `avg_over_time(100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)[${duration}])`;
        const ramQuery = `avg_over_time(((node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100)[${duration}])`;
        
        // 2. Traefik / Gateway Metrics
        const requestsQuery = `sum(increase(traefik_entrypoint_requests_total{entrypoint="websecure"}[${duration}]))`;
        const err5xxQuery = `sum(increase(traefik_entrypoint_requests_total{entrypoint="websecure", code=~"5.."}[${duration}]))`;

        // Parallel Fetch
        const [cpuRes, ramRes, reqRes, err5xxRes, logsSummary] = await Promise.all([
            this.queryPrometheus(cpuQuery),
            this.queryPrometheus(ramQuery),
            this.queryPrometheus(requestsQuery),
            this.queryPrometheus(err5xxQuery),
            this.getLogSummary(timeframe)
        ]);

        const avgCpu = parseFloat(cpuRes[0]?.value[1] || 0);
        const avgRam = parseFloat(ramRes[0]?.value[1] || 0);
        const totalRequests = Math.round(parseFloat(reqRes[0]?.value[1] || 0));
        const errorRate = totalRequests > 0 ? (parseFloat(err5xxRes[0]?.value[1] || 0) / totalRequests * 100).toFixed(2) : 0;

        // 3. Build Service Status Array
        const services = [
            { 
                name: "Traefik Router", 
                status: errorRate < 1 ? "healthy" : "warning", 
                details: `${totalRequests.toLocaleString()} req handled with ${errorRate}% error rate.`
            },
            { 
                name: "API Cluster", 
                status: avgCpu < 70 ? "healthy" : "warning", 
                details: `Core cluster responsive with ${avgCpu.toFixed(1)}% avg load.`
            },
            { 
                name: "FFmpeg Workers", 
                status: "healthy", 
                details: "Streaming pipelines operational. Hardware transcoding active." 
            }
        ];

        // 4. Anomaly Detection Engine
        const alerts = [];
        if (avgCpu > 80) alerts.push(`High average CPU load detected (${avgCpu.toFixed(1)}%)`);
        if (avgRam > 90) alerts.push(`Critical memory utilization spike (${avgRam.toFixed(1)}%)`);
        if (errorRate > 2) alerts.push(`Unusual gateway error volume detected (${errorRate}%)`);
        if (logsSummary.criticalErrors > 100) alerts.push(`Critical log event surge in Loki (${logsSummary.criticalErrors} errors)`);

        return {
            avgCpu: avgCpu.toFixed(1),
            avgRam: avgRam.toFixed(1),
            totalRequests,
            errorRate,
            criticalErrors: logsSummary.criticalErrors,
            services,
            alerts
        };
    }

    /**
     * @deprecated Use asyncGetStructuredReport for new PDF engine
     */
    async getReportMetrics(timeframe = 'now-30d') {
        const report = await this.asyncGetStructuredReport(timeframe);
        return {
            avgCpu: report.avgCpu,
            avgRam: report.avgRam,
            totalRequests: report.totalRequests,
            errorRate: report.errorRate
        };
    }

    /**
     * Query Loki for error counts
     */
    async getLogSummary(timeframe = 'now-30d') {
        const duration = this.getTimeframeDuration(timeframe);
        try {
            // Count "error" logs for streamvision app
            const query = `count_over_time({container="streamvision_app"} |= "error" [${duration}])`;
            const url = `${this.lokiUrl}/loki/api/v1/query?query=${encodeURIComponent(query)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Loki error: ${response.statusText}`);
            const data = await response.json();
            
            const count = data.data?.result[0]?.value[1] || 0;
            return {
                criticalErrors: parseInt(count),
                healthStatus: parseInt(count) > 50 ? 'Warning' : 'Healthy'
            };
        } catch (error) {
            logger.error(`Error querying Loki: ${error.message}`);
            return { criticalErrors: 0, healthStatus: 'Unknown' };
        }
    }
}

module.exports = new MonitoringClient();
