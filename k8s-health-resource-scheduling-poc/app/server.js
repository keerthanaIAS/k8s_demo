const express = require("express");

const app = express();
const PORT = 3000;

let ready = true;
let alive = true;

app.get("/", (req, res) => {
    res.json({
        message: "Kubernetes Health POC",
        ready,
        alive
    });
});

app.get("/health/ready", (req, res) => {
    if (!ready) {
        return res.status(500).json({
            status: "NOT_READY"
        });
    }

    res.status(200).json({
        status: "READY"
    });
});

app.get("/health/live", (req, res) => {
    if (!alive) {
        return res.status(500).json({
            status: "NOT_ALIVE"
        });
    }

    res.status(200).json({
        status: "ALIVE"
    });
});

// Testing endpoints
app.get("/make-not-ready", (req, res) => {
    ready = false;

    res.json({
        message: "Application is now NOT READY"
    });
});

app.get("/make-unready", (req, res) => {
    ready = false;

    res.json({
        message: "Application is now NOT READY"
    });
});

app.get("/make-unhealthy", (req, res) => {
    alive = false;

    res.json({
        message: "Application is now UNHEALTHY"
    });
});

app.get("/stress-cpu", (req, res) => {
    res.json({ message: "CPU stress started" });

    setInterval(() => {
        let x = 0;

        for (let i = 0; i < 100000000; i++) {
            x += Math.sqrt(i);
        }
    }, 0);
});

app.get("/stress-memory", (req, res) => {
  res.json({ message: "Memory stress started" });

  const chunks = [];

  setInterval(() => {
    chunks.push(Buffer.alloc(10 * 1024 * 1024));
  }, 100);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});