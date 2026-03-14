const cluster = require("cluster");
const os = require("os");
const streamStore = require("./utils/streamStore");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    streamStore.setupPrimaryHandlers(worker);
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    const newWorker = cluster.fork();
    streamStore.setupPrimaryHandlers(newWorker);
  });

  // Handle graceful shutdown in Master to cleanup all FFmpeg processes
  const gracefulShutdown = () => {
    console.log("Master received shutdown signal. Cleaning up all streams...");
    streamStore.cleanupAll();
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);

} else {
  require("./app"); // Each worker runs the Express app
}
