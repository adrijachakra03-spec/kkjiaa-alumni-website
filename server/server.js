
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const Alumni = require("./models/Alumni");
const { upload } = require("./config/cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "20kb" }));

// ADMIN AUTHENTICATION
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

// PHOTO UPLOAD ERROR HANDLING
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

// ADMIN LOGIN
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

// ALUMNI REGISTRATION WITH PHOTO DIAGNOSTICS
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

      // DIAGNOSTIC: checks whether the upload middleware received a photo.
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

      // Log only whether photo details exist, not personal data.
      console.log("SAVING ALUMNI PHOTO:", {
        hasPhotoUrl: Boolean(photoUrl),
        hasPhotoPublicId: Boolean(photoPublicId),
      });

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

      console.log("ALUMNI PHOTO SAVE RESULT:", {
        recordCreated: Boolean(alumni._id),
        photoUrlSaved: Boolean(alumni.profilePhotoUrl),
        photoPublicIdSaved: Boolean(alumni.profilePhotoPublicId),
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

// PUBLIC: VIEW APPROVED ALUMNI
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

// ADMIN: VIEW PENDING ALUMNI REGISTRATIONS
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

// ADMIN: APPROVE OR REJECT AN ALUMNI REGISTRATION
app.patch(
  "/api/admin/alumni/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid alumni ID.",
        });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be approved or rejected.",
        });
      }

      const alumni = await Alumni.findByIdAndUpdate(
        id,
        { $set: { status } },
        { returnDocument: "after", runValidators: true }
      ).select(
        "fullName email passingYear profession currentCity profilePhotoUrl status"
      );

      if (!alumni) {
        return res.status(404).json({
          success: false,
          message: "Alumni record not found.",
        });
      }

      return res.json({
        success: true,
        message: `Alumni registration ${status}.`,
        alumni,
      });
    } catch (error) {
      console.error("Alumni status update error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not update alumni status.",
      });
    }
  }
);

// HOME ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KKJIAA Alumni Association API is running!",
  });
});

// HEALTH CHECK
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

// START SERVER AND CONNECT TO MONGODB
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
