
const mongoose = require("mongoose");

const alumniSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    passingYear: {
      type: Number,
      required: true,
      min: 1888,
      max: new Date().getFullYear(),
    },

    profession: {
      type: String,
      trim: true,
    },

    currentCity: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Profile photo stored in Cloudinary
    profilePhotoUrl: {
      type: String,
      default: "",
    },

    profilePhotoPublicId: {
      type: String,
      default: "",
    },

    // Public display requires consent
    publicProfileConsent: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alumni", alumniSchema);
