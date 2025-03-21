const { Theme, ThemeEntry } = require("../models");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
require("dotenv").config();

// ✅ Initialize S3 instance
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ✅ Generate a Pre-Signed URL for S3 Upload
exports.getUploadURL = async (req, res) => {
  try {
    const { fileType } = req.query;
    
    if (!fileType) {
      return res.status(400).json({ message: "File type is required" });
    }

    const fileKey = `themes/${uuidv4()}.${fileType.split("/")[1]}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Expires: 300, // URL expires in 5 minutes
      ContentType: fileType,
    };

    // ✅ Use the correctly initialized `s3` instance
    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    res.status(200).json({
      uploadURL,
      fileKey,
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
    });
  } catch (error) {
    console.error("❌ Error generating upload URL:", error);
    res.status(500).json({ message: "Error generating upload URL", error: error.message });
  }
};



// ✅ Create Theme in Database
exports.createTheme = async (req, res) => {
  try {
    const { themeName, description, specialRules, coverImageUrl } = req.body;

    if (!themeName || !coverImageUrl) {
      return res.status(400).json({ message: "Theme name and cover image are required." });
    }

    const newTheme = await Theme.create({
      name: themeName,
      description,
      special_rules: specialRules,
      cover_image_url: coverImageUrl, // ✅ Store S3 URL
    });

    res.status(201).json({ message: "Theme created successfully", theme: newTheme });
  } catch (error) {
    console.error("❌ Error creating theme:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Create a new theme (handling file upload)
// exports.createTheme = async (req, res) => {
//   try {
//     const { themeName, description, specialRules } = req.body;
//     const coverImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

//     if (!themeName) {
//       return res.status(400).json({ message: "Theme name is required" });
//     }

//     const newTheme = await Theme.create({
//       name: themeName,
//       description,
//       special_rules: specialRules,
//       cover_image_url: coverImageUrl,
//     });

//     res.status(201).json({ message: "Theme created successfully", theme: newTheme });
//   } catch (error) {
//     console.error("❌ Error creating theme:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


// ✅ Fetch all themes (including their in-house entries)
exports.getAllThemes = async (req, res) => {
  try {
    const themes = await Theme.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: ThemeEntry }], // Include in-house entries
    });
    res.status(200).json(themes);
  } catch (error) {
    console.error("❌ Error fetching themes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get theme by ID (including its in-house entries)
exports.getThemeById = async (req, res) => {
  try {
    const theme = await Theme.findByPk(req.params.id, {
      include: [{ model: ThemeEntry }],
    });
    if (!theme) {
      return res.status(404).json({ message: "Theme not found" });
    }
    res.status(200).json(theme);
  } catch (error) {
    console.error("❌ Error fetching theme:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update theme and upload multiple entries
// exports.updateTheme = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const theme = await Theme.findByPk(id);
//     if (!theme) return res.status(404).json({ message: "Theme not found" });

//     const { name, description, specialRules } = req.body;
//     const coverImageUrl = req.files["coverImage"] ? `/uploads/${req.files["coverImage"][0].filename}` : theme.cover_image_url;

//     await theme.update({ name, description, special_rules: specialRules, cover_image_url: coverImageUrl });

//     // Process multiple entries if they exist
//     if (req.files["entries"]) {
//       const entries = req.files["entries"].map((file) => ({
//         theme_id: id,
//         image_url: `/uploads/${file.filename}`,
//       }));

//       await ThemeEntry.bulkCreate(entries); // Save multiple entries at once
//     }

//     res.status(200).json({ message: "Theme updated successfully", theme });
//   } catch (error) {
//     console.error("❌ Error updating theme:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
exports.updateTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, specialRules, coverImageKey } = req.body;

    const theme = await Theme.findByPk(id);
    if (!theme) return res.status(404).json({ message: "Theme not found" });

    const coverImageUrl = coverImageKey
      ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${coverImageKey}`
      : theme.cover_image_url;

    await theme.update({ name, description, special_rules: specialRules, cover_image_url: coverImageUrl });

    res.status(200).json({ message: "Theme updated successfully", theme });
  } catch (error) {
    console.error("❌ Error updating theme:", error);
    res.status(500).json({ message: "Server error while updating theme." });
  }
};


// ✅ Add an in-house entry to a theme
exports.addThemeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Theme ID is required" });

    if (!req.files || !req.files["entries"]) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const entries = req.files["entries"].map((file) => ({
      theme_id: id,
      image_url: `/uploads/${file.filename}`,
    }));

    await ThemeEntry.bulkCreate(entries);

    res.status(201).json({ message: "Entries added successfully", entries });
  } catch (error) {
    console.error("❌ Error adding entries:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Delete an in-house entry
exports.deleteThemeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ThemeEntry.findByPk(id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await entry.destroy();
    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting entry:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete an entire theme (removing its entries as well)
exports.deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await Theme.findByPk(id);
    if (!theme) return res.status(404).json({ message: "Theme not found" });

    await theme.destroy();
    res.status(200).json({ message: "Theme deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting theme:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
