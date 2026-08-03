const express = require("express");
const os = require("os");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Kubernetes Multi-Node POC",
    pod: os.hostname(),
    node: process.env.NODE_NAME || "unknown",
    app: process.env.APP_NAME || "user-service",
    environment: process.env.APP_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    pod: os.hostname(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`User service running on port ${PORT}`);
});