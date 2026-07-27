const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.json({
    service: "user-service",
    message: "Hello from User Microservice",
    version: "1.0.0"
  });
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});