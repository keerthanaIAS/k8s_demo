const express = require("express");
const { MongoClient } = require("mongodb");
const { Kafka } = require("kafkajs");

const app = express();

app.use(express.json());

const PORT = 3000;

// Kubernetes Service DNS
const MONGO_URL =
  process.env.MONGO_URL || "mongodb://mongodb:27017";

const KAFKA_BROKER =
  process.env.KAFKA_BROKER || "kafka-0.kafka:9092";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL ||
  "http://order-service:3001";

// -------------------------
// MongoDB
// -------------------------

const mongoClient = new MongoClient(MONGO_URL);

let usersCollection;

// -------------------------
// Kafka Producer
// -------------------------

const kafka = new Kafka({
  clientId: "user-service",
  brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();

// -------------------------
// Health Check
// -------------------------

app.get("/", (req, res) => {
  res.json({
    service: "user-service",
    message: "Hello from User Microservice",
    version: "2.0.0",
  });
});

// -------------------------
// Create User
// -------------------------

app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "name and email are required",
      });
    }

    // 1. Save user in MongoDB

    const user = {
      name,
      email,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(user);

    const createdUser = {
      _id: result.insertedId.toString(),
      name,
      email,
    };

    // 2. Publish event to Kafka

    await producer.send({
      topic: "user-events",
      messages: [
        {
          key: createdUser._id,
          value: JSON.stringify({
            event: "UserCreated",
            user: createdUser,
          }),
        },
      ],
    });

    console.log("User saved to MongoDB");
    console.log("UserCreated event published to Kafka");

    res.status(201).json({
      message: "User created",
      user: createdUser,
    });

  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
});

// -------------------------
// Call Order Service
// -------------------------

app.get("/check-order-service", async (req, res) => {
  try {
    const response = await fetch(
      `${ORDER_SERVICE_URL}/internal/health`
    );

    const data = await response.json();

    res.json({
      message: "User Service successfully called Order Service",
      orderServiceResponse: data,
    });

  } catch (error) {
    console.error("Order service call failed:", error);

    res.status(500).json({
      message: "Failed to call Order Service",
      error: error.message,
    });
  }
});

// -------------------------
// Start Application
// -------------------------

async function startServer() {
  try {

    // Connect MongoDB

    await mongoClient.connect();

    const db = mongoClient.db("microservices");

    usersCollection = db.collection("users");

    console.log("Connected to MongoDB");

    // Connect Kafka Producer

    await producer.connect();

    console.log("Connected to Kafka");

    // Start HTTP server

    app.listen(PORT, () => {
      console.log(
        `User Service running on port ${PORT}`
      );
    });

  } catch (error) {

    console.error(
      "Failed to start User Service:",
      error
    );

    process.exit(1);
  }
}

startServer();