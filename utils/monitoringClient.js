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
     * Get aggregate metrics for the report
     */
    async getReportMetrics(timeframe = 'now-30d') {
        const duration = this.getTimeframeDuration(timeframe);
        
        // 1. CPU Usage Avg
        const cpuQuery = `avg_over_time(100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)[${duration}])`;
        
        // 2. RAM Usage Avg
        const ramQuery = `avg_over_time(((node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100)[${duration}])`;
        
        // 3. Total Traefik Requests
        const requestsQuery = `sum(increase(traefik_entrypoint_requests_total{entrypoint="websecure"}[${duration}]))`;

        // 4. 5xx Error Volume
        const errorsQuery = `sum(increase(traefik_entrypoint_requests_total{entrypoint="websecure", code=~"5.."}[${duration}]))`;

        const [cpuRes, ramRes, reqRes, errRes] = await Promise.all([
            this.queryPrometheus(cpuQuery),
            this.queryPrometheus(ramQuery),
            this.queryPrometheus(requestsQuery),
            this.queryPrometheus(errorsQuery)
        ]);

        return {
            avgCpu: parseFloat(cpuRes[0]?.value[1] || 0).toFixed(1),
            avgRam: parseFloat(ramRes[0]?.value[1] || 0).toFixed(1),
            totalRequests: Math.round(parseFloat(reqRes[0]?.value[1] || 0)),
            errorRate: reqRes[0] ? (parseFloat(errRes[0]?.value[1] || 0) / parseFloat(reqRes[0]?.value[1]) * 100 || 0).toFixed(2) : 0
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
