const { Theme, ThemeEntry } = require('../models');
const dotenv = require('dotenv');
const { v1: uuidv1 } = require('uuid');
const AWS = require('aws-sdk');
const path = require('path');
require('dotenv').config();

// ✅ Initialize S3 instance
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ✅ Upload File to S3 using AWS credentials directly (no presigned link)
exports.directUpload = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    const file = req.files.file;
    const extension = path.extname(file.name);
    const key = `themes/${uuidv1()}${extension}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.data, // ✅ Raw binary data from express-fileupload
      ContentType: file.mimetype, // ✅ Automatically sets correct content-type
      ACL: 'public-read', // ✅ So it's viewable by frontend users
    };

    await s3.putObject(params).promise(); // ✅ S3 direct upload using PutObject

    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('❌ Error uploading with PutObject:', error);
    return res
      .status(500)
      .json({ message: 'Upload failed', error: error.message });
  }
};

// ✅ Generate a Pre-Signed URL for S3 Upload
exports.getUploadURL = async (req, res) => {
  try {
    const { fileType } = req.query;

    if (!fileType) {
      return res.status(400).json({ message: 'File type is required' });
    }

    const fileKey = `themes/${uuidv1()}.${fileType.split('/')[1]}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Expires: 300, // URL expires in 5 minutes
      ContentType: fileType,
      CacheControl: 'public, max-age=31536000, immutable',
      ACL: 'public-read',
    };

    // ✅ Use the correctly initialized s3 instance
    const uploadURL = await s3.getSignedUrlPromise('putObject', params);

    res.status(200).json({
      uploadURL,
      fileKey,
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
    });
  } catch (error) {
    console.error('❌ Error generating upload URL:', error);
    res
      .status(500)
      .json({ message: 'Error generating upload URL', error: error.message });
  }
};

// ✅ Create Theme in Database
exports.createTheme = async (req, res) => {
  try {
    const { themeName, description, specialRules, coverImageUrl } = req.body;

    if (!themeName || !coverImageUrl) {
      return res
        .status(400)
        .json({ message: 'Theme name and cover image are required.' });
    }

    const newTheme = await Theme.create({
      name: themeName,
      description,
      special_rules: specialRules,
      cover_image_url: coverImageUrl,
    });

    res
      .status(201)
      .json({ message: 'Theme created successfully', theme: newTheme });
  } catch (error) {
    console.error('❌ Error creating theme:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Update a Theme
exports.updateTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, coverImageUrl } = req.body;

    const theme = await Theme.findByPk(id);
    if (!theme) return res.status(404).json({ message: 'Theme not found' });

    await theme.update({
      name,
      description,
      cover_image_url: coverImageUrl,
    });

    res.status(200).json({ message: 'Theme updated successfully', theme });
  } catch (error) {
    console.error('❌ Error updating theme:', error);
    res.status(500).json({ message: 'Server error while updating theme.' });
  }
};

// ✅ Add in-house entries to a theme
exports.addThemeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Theme ID is required' });

    if (!req.files || !req.files['entries']) {
      return res
        .status(400)
        .json({ message: 'At least one image is required' });
    }

    const entries = req.files['entries'].map((file) => ({
      theme_id: id,
      image_url: `/uploads/${file.filename}`,
    }));

    await ThemeEntry.bulkCreate(entries);

    res.status(201).json({ message: 'Entries added successfully', entries });
  } catch (error) {
    console.error('❌ Error adding entries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Delete an entry
exports.deleteThemeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ThemeEntry.findByPk(id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    await entry.destroy();
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Delete a theme and its entries
exports.deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await Theme.findByPk(id);
    if (!theme) return res.status(404).json({ message: 'Theme not found' });

    await theme.destroy();
    res.status(200).json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting theme:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get all themes
exports.getAllThemes = async (req, res) => {
  try {
    const themes = await Theme.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(themes);
  } catch (error) {
    console.error('❌ Error fetching themes:', error);
    res.status(500).json({ message: 'Server error while fetching themes.' });
  }
};

// ✅ Get theme by ID
exports.getThemeById = async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await Theme.findByPk(id);

    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }

    res.status(200).json(theme);
  } catch (error) {
    console.error('❌ Error fetching theme:', error);
    res.status(500).json({ message: 'Server error while fetching theme.' });
  }
};

// ✅ Update cover image URL only
exports.updateThemeCoverImageUrl = async (req, res) => {
  try {
    const { themeId, coverImageUrl } = req.body;

    if (!themeId || !coverImageUrl) {
      return res
        .status(400)
        .json({ message: 'Both themeId and coverImageUrl are required.' });
    }

    const theme = await Theme.findByPk(themeId);
    if (!theme) return res.status(404).json({ message: 'Theme not found' });

    await theme.update({ cover_image_url: coverImageUrl });

    res
      .status(200)
      .json({ message: 'Cover image updated successfully', theme });
  } catch (error) {
    console.error('❌ Error updating cover image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; // ✅ Last export ends cleanly

exports.uploadCoverImage = async (req, res) => {
  try {
    const { fileName, fileBuffer, fileType } = req.body;

    if (!fileName || !fileBuffer || !fileType) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const buffer = Buffer.from(fileBuffer, 'base64');
    const fileKey = `themes/${fileName}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: fileType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable',
    };

    const result = await s3.upload(uploadParams).promise();
    res.status(200).json({ imageUrl: result.Location });
  } catch (error) {
    console.error('❌ Failed to upload image to S3:', error);
    res
      .status(500)
      .json({ message: 'Image upload failed', error: error.message });
  }
};
