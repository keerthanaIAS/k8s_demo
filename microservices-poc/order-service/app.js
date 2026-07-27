const express = require("express");
const { MongoClient } = require("mongodb");
const { Kafka } = require("kafkajs");

const app = express();

app.use(express.json());

const PORT = 3001;

// -------------------------
// Configuration
// -------------------------

const MONGO_URL =
  process.env.MONGO_URL ||
  "mongodb://mongodb:27017";

const KAFKA_BROKER =
  process.env.KAFKA_BROKER ||
  "kafka-0.kafka:9092";

// -------------------------
// MongoDB
// -------------------------

const mongoClient = new MongoClient(MONGO_URL);

let ordersCollection;

// -------------------------
// Kafka Consumer
// -------------------------

const kafka = new Kafka({
  clientId: "order-service",
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({
  groupId: "order-service-group",
});

// -------------------------
// Health Check
// -------------------------

app.get("/", (req, res) => {
  res.json({
    service: "order-service",
    message: "Hello from Order Microservice",
    version: "2.0.0",
  });
});

// -------------------------
// Internal Health
// -------------------------

app.get("/internal/health", (req, res) => {
  res.json({
    service: "order-service",
    status: "healthy",
  });
});

// -------------------------
// Create Order
// -------------------------

app.post("/orders", async (req, res) => {
  try {

    const {
      userId,
      product
    } = req.body;

    if (!userId || !product) {
      return res.status(400).json({
        message: "userId and product are required",
      });
    }

    const order = {
      userId,
      product,
      createdAt: new Date(),
    };

    const result =
      await ordersCollection.insertOne(order);

    res.status(201).json({
      message: "Order created",
      orderId: result.insertedId,
      order,
    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// -------------------------
// Kafka Consumer
// -------------------------

async function startKafkaConsumer() {

  await consumer.connect();

  console.log("Connected to Kafka");

  await consumer.subscribe({
    topic: "user-events",
    fromBeginning: true,
  });

  await consumer.run({

    eachMessage: async ({
      topic,
      partition,
      message,
    }) => {

      const event =
        JSON.parse(
          message.value.toString()
        );

      console.log(
        "Received Kafka event:",
        event
      );

      if (event.event === "UserCreated") {

        console.log(
          "Processing UserCreated event"
        );

        console.log(
          "User:",
          event.user
        );

        // Here the Order Service
        // can perform business logic.
      }
    },
  });
}

// -------------------------
// Start Application
// -------------------------

async function startServer() {

  try {

    // Connect MongoDB

    await mongoClient.connect();

    const db =
      mongoClient.db("microservices");

    ordersCollection =
      db.collection("orders");

    console.log(
      "Connected to MongoDB"
    );

    // Start Kafka Consumer

    await startKafkaConsumer();

    // Start HTTP server

    app.listen(PORT, () => {

      console.log(
        `Order Service running on port ${PORT}`
      );

    });

  } catch (error) {

    console.error(
      "Failed to start Order Service:",
      error
    );

    process.exit(1);
  }
}

startServer();