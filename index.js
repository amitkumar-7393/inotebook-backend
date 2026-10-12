require("dotenv").config();

const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "iNotebook API is running" });
});

let dbConnectionPromise;

const connectToMongoOnce = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectToMongo().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }

  return dbConnectionPromise;
};

// Vercel par API request aane par database connect hoga.
app.use("/api", async (req, res, next) => {
  try {
    await connectToMongoOnce();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));

if (!process.env.VERCEL) {
  connectToMongoOnce()
    .then(() => {
      app.listen(port, () => {
        console.log(`iNotebook backend listening on port ${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start backend:", error.message);
      process.exit(1);
    });
}

module.exports = app;
