module.exports = {
  apps: [
    {
      name: "worker",
      script: "worker.py",
      interpreter: "python",
      cwd: __dirname,
      watch: true,
      autorestart: true,
      restart_delay: 5000
    },

    {
      name: "server",
      script: "server.js",
      cwd: __dirname,
      watch: true,
      autorestart: true,
      restart_delay: 5000
    },

    {
      name: "frontend",
      script: "./node_modules/vite/bin/vite.js",
      interpreter: "node",
      args: "--host",
      cwd: __dirname,
      watch: true,
      autorestart: true,
      restart_delay: 5000
    }
  ]
};