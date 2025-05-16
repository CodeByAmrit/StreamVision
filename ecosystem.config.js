module.exports = {
    apps: [
        {
            name: 'streamvision-server',
            script: 'app.js',
            instances: 1, // Single instance because streaming apps usually need full control over ports and streams
            exec_mode: 'cluster', // fork mode is safer for streaming apps (cluster mode not ideal unless your app is stateless)
            watch: false, // Don't watch files (production only)
            autorestart: true, // Restart if crash
            restart_delay: 5000, // Wait 5 seconds before restarting (to avoid crash loops)
            max_memory_restart: '4G', // Restart if using more than 2GB RAM (safe limit for 4GB RAM server)
            env: {
                NODE_ENV: 'production', // Environment variable for production
                PORT: 3000 // Optional, set your app's port
            },
            error_file: './logs/err.log', // Capture stderr logs
            out_file: './logs/out.log',   // Capture stdout logs
            log_date_format: 'YYYY-MM-DD HH:mm:ss', // Better log timestamp format
            time: true // Shows execution time in pm2 list
        }
    ]
};
