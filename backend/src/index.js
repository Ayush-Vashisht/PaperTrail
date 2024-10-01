const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "your_username",
  password: "your_password",
  database: "bookstore_db",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

// Middleware for authentication
const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, "your_jwt_secret");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Routes
app.get("/api/books/:id", (req, res) => {
  // Fetch book details
});

app.post("/api/wishlist", authenticateUser, (req, res) => {
  // Add book to wishlist
});

app.put("/api/users/:id", authenticateUser, (req, res) => {
  // Update user information
});

app.delete("/api/wishlist/:bookId", authenticateUser, (req, res) => {
  // Remove book from wishlist
});

app.get("/api/orders", authenticateUser, (req, res) => {
  // Get user's order history
});

app.post("/api/reviews", authenticateUser, (req, res) => {
  // Submit a book review
});

app.post("/api/books", authenticateUser, (req, res) => {
  // Add new book (admin only)
});

app.get("/api/recently-viewed", authenticateUser, (req, res) => {
  // Get recently viewed books
});

app.get("/api/search", (req, res) => {
  // Search for books
});

app.post("/api/checkout", authenticateUser, (req, res) => {
  // Process checkout
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Ensure Prisma client is disconnected when the app is terminated
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
