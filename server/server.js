
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const Alumni = require("./models/Alumni");
const ContactMessage = require("./models/ContactMessage");
const News = require("./models/News");
const { upload, cloudinary } = require("./config/cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/+$/, ""),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin.replace(/\/+$/, ""))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "20kb" }));

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const decoded = jwt.verify(authHeader.slice(7), jwtSecret);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

// ==========================================
// PHOTO UPLOAD ERROR HANDLING
// ==========================================

function handlePhotoUpload(req, res, next) {
  upload.single("photo")(req, res, (error) => {
    if (!error) {
      return next();
    }

    console.error("Photo upload error:", error.message);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Photo must be 5 MB or smaller.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to upload this photo.",
    });
  });
}
// ==========================================
// CLOUDINARY IMAGE CLEANUP
// ==========================================

async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result !== "ok" && result.result !== "not found") {
      console.warn("Cloudinary image cleanup:", result);
    }
  } catch (error) {
    // Database changes should not be reversed if image cleanup fails.
    console.error("Cloudinary image deletion failed:", error.message);
  }
}
// ==========================================
// NEWS VALIDATION
// ==========================================

const NEWS_CATEGORIES = [
  "School News",
  "Alumni Stories",
  "Events",
  "Achievements",
  "Announcements",
];

function validateNewsFields({ title, excerpt, content, category, status }) {
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof excerpt !== "string" ||
    !excerpt.trim() ||
    typeof content !== "string" ||
    !content.trim() ||
    typeof category !== "string" ||
    !NEWS_CATEGORIES.includes(category)
  ) {
    return "Please provide a title, description, article content and valid category.";
  }

  if (
    title.trim().length > 180 ||
    excerpt.trim().length > 400 ||
    content.trim().length > 20000
  ) {
    return "The article exceeds the allowed text length.";
  }

  if (
    status !== undefined &&
    !["draft", "published"].includes(status)
  ) {
    return "Status must be draft or published.";
  }

  return null;
}

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      console.error("Admin login environment settings are missing.");

      return res.status(500).json({
        success: false,
        message: "Admin login is not configured.",
      });
    }

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    const suppliedPassword = Buffer.from(password, "utf8");
    const configuredPassword = Buffer.from(adminPassword, "utf8");

    const passwordMatches =
      suppliedPassword.length === configuredPassword.length &&
      crypto.timingSafeEqual(suppliedPassword, configuredPassword);

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { role: "admin", email: adminEmail },
      jwtSecret,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Admin login successful.",
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in right now.",
    });
  }
});

// ==========================================
// ALUMNI REGISTRATION WITH PHOTO UPLOAD
// ==========================================

app.post(
  "/api/alumni/register",
  handlePhotoUpload,
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        passingYear,
        profession,
        currentCity,
        message,
        consent,
      } = req.body;

      console.log("PHOTO UPLOAD CHECK:", {
        fileReceived: Boolean(req.file),
        photoUrlSavedFromUpload: Boolean(req.file?.path),
        publicIdReceived: Boolean(req.file?.filename),
      });

      if (
        typeof fullName !== "string" ||
        !fullName.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        passingYear === undefined ||
        passingYear === null ||
        passingYear === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Full name, email, and passing year are required.",
        });
      }

      if (consent !== true && consent !== "true") {
        return res.status(400).json({
          success: false,
          message: "Public profile consent is required to register.",
        });
      }

      const year = Number(passingYear);

      if (
        !Number.isInteger(year) ||
        year < 1888 ||
        year > new Date().getFullYear()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid passing year.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingAlumni = await Alumni.findOne({
        email: normalizedEmail,
      });

      if (existingAlumni) {
        return res.status(409).json({
          success: false,
          message: "An alumni registration with this email already exists.",
        });
      }

      const photoUrl = req.file?.path || "";
      const photoPublicId = req.file?.filename || "";

      const alumni = await Alumni.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone,
        passingYear: year,
        profession,
        currentCity,
        message,
        publicProfileConsent: true,
        profilePhotoUrl: photoUrl,
        profilePhotoPublicId: photoPublicId,
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message:
          "Registration submitted successfully. It is pending admin approval.",
        alumni: {
          id: alumni._id,
          fullName: alumni.fullName,
          status: alumni.status,
          profilePhotoUrl: alumni.profilePhotoUrl || "",
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered.",
        });
      }

      if (
        error.name === "ValidationError" ||
        error.name === "CastError"
      ) {
        console.error("Alumni validation error:", error.message);

        return res.status(400).json({
          success: false,
          message: "Please check your registration details.",
        });
      }

      console.error("Alumni registration error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Registration failed. Please try again later.",
      });
    }
  }
);

// ==========================================
// PUBLIC: VIEW APPROVED ALUMNI
// ==========================================

app.get("/api/alumni/approved", async (req, res) => {
  try {
    const alumni = await Alumni.find({
      status: "approved",
      publicProfileConsent: true,
    })
      .select(
        "fullName passingYear profession currentCity profilePhotoUrl"
      )
      .sort({ passingYear: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      count: alumni.length,
      alumni,
    });
  } catch (error) {
    console.error("Approved alumni fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load the alumni directory.",
    });
  }
});

// ==========================================
// ADMIN: VIEW PENDING ALUMNI REGISTRATIONS
// ==========================================

app.get("/api/admin/alumni/pending", requireAdmin, async (req, res) => {
  try {
    const alumni = await Alumni.find({ status: "pending" })
      .select(
        "fullName email phone passingYear profession currentCity message profilePhotoUrl profilePhotoPublicId status createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      count: alumni.length,
      alumni,
    });
  } catch (error) {
    console.error("Pending alumni fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending registrations.",
    });
  }
});

// ==========================================
// ADMIN: APPROVE OR REJECT ALUMNI
// ==========================================


app.patch(
  "/api/admin/news/:id",
  requireAdmin,
  handlePhotoUpload,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news article ID.",
        });
      }

      const { title, excerpt, content, category, status } = req.body;

      const validationError = validateNewsFields({
        title,
        excerpt,
        content,
        category,
        status,
      });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const article = await News.findById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "News article not found.",
        });
      }

      const previousStatus = article.status;
      const previousImagePublicId = article.coverImagePublicId;
      const nextStatus = status || previousStatus;

      article.title = title.trim();
      article.excerpt = excerpt.trim();
      article.content = content.trim();
      article.category = category;
      article.status = nextStatus;

      if (req.file) {
        article.coverImage = req.file.path || "";
        article.coverImagePublicId = req.file.filename || "";
      }

      if (nextStatus === "published" && previousStatus !== "published") {
        article.publishedAt = new Date();
      }

      if (nextStatus === "draft") {
        article.publishedAt = null;
      }

      await article.save();

      // Delete the previous image only after the new article is saved.
      if (
        req.file &&
        previousImagePublicId &&
        previousImagePublicId !== article.coverImagePublicId
      ) {
        await deleteCloudinaryImage(previousImagePublicId);
      }

      return res.json({
        success: true,
        message:
          nextStatus === "published"
            ? "News article updated successfully."
            : "Draft updated successfully.",
        article,
      });
    } catch (error) {
      console.error("News update error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update the news article.",
      });
    }
  }
);

// ==========================================
// PUBLIC: SUBMIT CONTACT MESSAGE
// ==========================================

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all contact form fields.",
      });
    }

    if (
      name.trim().length > 100 ||
      email.trim().length > 254 ||
      message.trim().length > 3000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please check your contact details and try again.",
      });
    }

    const savedMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
      id: savedMessage._id,
    });
  } catch (error) {
    console.error("Contact submission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your message right now.",
    });
  }
});

// ==========================================
// ADMIN: VIEW CONTACT MESSAGES
// ==========================================

app.get("/api/admin/messages", requireAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Contact messages fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load contact messages.",
    });
  }
});

// ==========================================
// ADMIN: MARK MESSAGE READ OR UNREAD
// ==========================================

app.patch(
  "/api/admin/messages/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID.",
        });
      }

      if (!["read", "unread"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be read or unread.",
        });
      }

      const updatedMessage = await ContactMessage.findByIdAndUpdate(
        id,
        { $set: { status } },
        { returnDocument: "after", runValidators: true }
      );

      if (!updatedMessage) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      return res.json({
        success: true,
        message: "Message status updated.",
        contactMessage: updatedMessage,
      });
    } catch (error) {
      console.error("Contact message update error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update message status.",
      });
    }
  }
);

// ==========================================
// NEWS: PUBLICLY VIEW PUBLISHED ARTICLES
// ==========================================

app.get("/api/news", async (req, res) => {
  try {
    const articles = await News.find({
      status: "published",
    })
      .select(
        "title excerpt content category coverImage publishedAt createdAt"
      )
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Public news fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load news articles.",
    });
  }
});

// ==========================================
// ADMIN: VIEW ALL NEWS (DRAFTS + PUBLISHED)
// ==========================================

app.get("/api/admin/news", requireAdmin, async (req, res) => {
  try {
    const articles = await News.find()
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Admin news fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load news articles.",
    });
  }
});

// ==========================================
// ADMIN: CREATE NEWS ARTICLE
// ==========================================

app.post(
  "/api/admin/news",
  requireAdmin,
  handlePhotoUpload,
  async (req, res) => {
    try {
      const { title, excerpt, content, category, status } = req.body;

      const validationError = validateNewsFields({
        title,
        excerpt,
        content,
        category,
        status,
      });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const articleStatus = status || "draft";

      const article = await News.create({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        coverImage: req.file?.path || "",
        coverImagePublicId: req.file?.filename || "",
        status: articleStatus,
        publishedAt:
          articleStatus === "published" ? new Date() : null,
      });

      return res.status(201).json({
        success: true,
        message:
          articleStatus === "published"
            ? "News article published successfully."
            : "News article saved as a draft.",
        article,
      });
    } catch (error) {
      console.error("News creation error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to create the news article.",
      });
    }
  }
);

// ==========================================
// ADMIN: EDIT NEWS ARTICLE
// ==========================================

app.patch(
  "/api/admin/news/:id",
  requireAdmin,
  handlePhotoUpload,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news article ID.",
        });
      }

      const { title, excerpt, content, category, status } = req.body;

      const validationError = validateNewsFields({
        title,
        excerpt,
        content,
        category,
        status,
      });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const article = await News.findById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "News article not found.",
        });
      }

      const previousStatus = article.status;
      const nextStatus = status || previousStatus;

      article.title = title.trim();
      article.excerpt = excerpt.trim();
      article.content = content.trim();
      article.category = category;
      article.status = nextStatus;

      if (req.file) {
        article.coverImage = req.file.path || "";
        article.coverImagePublicId = req.file.filename || "";
      }

      if (nextStatus === "published" && previousStatus !== "published") {
        article.publishedAt = new Date();
      }

      if (nextStatus === "draft") {
        article.publishedAt = null;
      }

      await article.save();

      return res.json({
        success: true,
        message:
          nextStatus === "published"
            ? "News article updated successfully."
            : "Draft updated successfully.",
        article,
      });
    } catch (error) {
      console.error("News update error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update the news article.",
      });
    }
  }
);

// ==========================================
// ADMIN: DELETE NEWS ARTICLE
// ==========================================


app.delete(
  "/api/admin/news/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news article ID.",
        });
      }

      const article = await News.findById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "News article not found.",
        });
      }

      const imagePublicId = article.coverImagePublicId;

      // Delete the database record first.
      await News.deleteOne({ _id: id });

      // Then clean up its Cloudinary image.
      await deleteCloudinaryImage(imagePublicId);

      return res.json({
        success: true,
        message: "News article deleted successfully.",
      });
    } catch (error) {
      console.error("News deletion error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete the news article.",
      });
    }
  }
);


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KKJIAA Alumni Association API is running!",
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message: "Backend is working correctly.",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// ==========================================
// START SERVER AND CONNECT TO MONGODB
// ==========================================

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });

  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is missing from server/.env");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.log("API is running, but database features are unavailable.");
  }
}

startServer();
