const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HisabKitab API Running 🚀",
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "HisabKitab API",
  });
});
const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");

app.use("/api/user", userRoutes);

const transactionRoutes = require("./routes/transactionRoutes");

app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
