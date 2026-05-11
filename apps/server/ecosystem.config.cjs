module.exports = {
    apps: [
        {
            name: "tasslim-backend",
            script: "npm",
            args: "run dev",
            cwd: "./",
            watch: false,
            max_memory_restart: "1G",
            cron_restart: "0 * * * *", // Restarts at minute 0 of every hour
            autorestart: true, // Auto restart if app crashes
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            }
        }
    ]
};
