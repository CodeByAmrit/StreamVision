module.exports = {
    apps: [{
        name: 'camera-server',
        script: 'app.js',
        watch: false,
        max_memory_restart: '1G',
        autorestart: true,
        restart_delay: 2000
    }]
}
