const dotenv = require('dotenv');
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Initialize S3 client
const s3 = new AWS.S3();

/**
 * delete the images from the s3 bucket
 * @author Dhrumil Amrutiya (Zignuts)
 */
const deleteImageFromS3 = async (url) => {
  try {
    const images = Array.isArray(url) ? url : [url];
    // Create an array of objects to be deleted
    const objectsToDelete = images.map((url) => {
      let fileUrl = new URL(url);
      let file = decodeURIComponent(fileUrl.pathname.substr(1)); // Decode URL path
      return { Key: file };
    });

    // Set up the parameters for the delete operation
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Delete: {
        Objects: objectsToDelete,
      },
    };

    // Delete objects
    await s3.deleteObjects(params);

    return {
      isError: false,
      message: 'Image Deleted Successfully',
    };
  } catch (error) {
    console.error('❌ Error deleting  images:', error);
    return {
      success: false,
      error: error,
      message: 'Server error while deleting the Image',
    };
  }
};

module.exports = deleteImageFromS3;
