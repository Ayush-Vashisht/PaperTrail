const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

// Middleware for authentication
const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// test
app.get("/", async (req, res) => {
  return res.json("OK!");
});

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const books = await prisma.book.findMany();
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "An error occurred while fetching books" });
  }
});

// Get a single book
app.get("/api/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the book" });
  }
});

// User registration
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    res
      .status(201)
      .json({ message: "User registered successfully", userId: user.id });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "An error occurred while registering" });
  }
});

// User login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

// Get user's wishlist
app.get("/api/wishlist", authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: { book: true },
    });
    res.json(wishlist.map((item) => item.book));
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the wishlist" });
  }
});

// Add book to wishlist
app.post("/api/wishlist", authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { bookId } = req.body;
  try {
    await prisma.wishlist.create({
      data: {
        userId,
        bookId: parseInt(bookId),
      },
    });
    res.status(201).json({ message: "Book added to wishlist successfully" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res
      .status(500)
      .json({ error: "An error occurred while adding to wishlist" });
  }
});

// Remove book from wishlist
app.delete("/api/wishlist/:bookId", authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const bookId = parseInt(req.params.bookId);
  try {
    await prisma.wishlist.deleteMany({
      where: {
        userId,
        bookId,
      },
    });
    res.json({ message: "Book removed from wishlist successfully" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res
      .status(500)
      .json({ error: "An error occurred while removing from wishlist" });
  }
});

// Submit a review
app.post("/api/reviews", authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { bookId, rating, comment } = req.body;
  try {
    const review = await prisma.review.create({
      data: {
        userId,
        bookId: parseInt(bookId),
        rating: parseInt(rating),
        comment,
      },
    });
    res
      .status(201)
      .json({ message: "Review submitted successfully", reviewId: review.id });
  } catch (error) {
    console.error("Error submitting review:", error);
    res
      .status(500)
      .json({ error: "An error occurred while submitting the review" });
  }
});

// Get user's order history
app.get("/api/orders", authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { orderItems: { include: { book: true } } },
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching order history" });
  }
});

// Search books
app.get("/api/search", async (req, res) => {
  const { query } = req.query;
  try {
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { author: { contains: query } },
          { genre: { contains: query } },
        ],
      },
    });
    res.json(books);
  } catch (error) {
    console.error("Error searching books:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching for books" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Ensure Prisma client is disconnected when the app is terminated
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
