// const { UUID, axios, filetype, SHARP, AWS } = sails.config.constants;

const { default: axios } = require('axios');
const filetype = require('file-type');
const AWS = require('aws-sdk');

const dotenv = require('dotenv');
// ✅ Load environment variables from .env file
dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const convertToS3Url = async (url, user_id) => {
  try {
    const downloadImage = async (url) => {
      const response = await axios({
        url,
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data, 'binary');
    };

    const uploadToS3 = async (buffer, bucketName, key, type) => {
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: type,
        region: process.env.AWS_REGION,
      };
      return s3.upload(params).promise();
    };

    // Step 1: Download the image
    const imageBuffer = await downloadImage(url);

    let detectedType = await filetype.fromBuffer(imageBuffer);

    if (!detectedType) {
      const response = await fetch(url, { method: 'HEAD' });
      const mimeType = response.headers.get('content-type');
      detectedType = {
        ext: mimeType.split('/').at(-1),
        mime: mimeType,
      };
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    const key = `uploads/${Date.now()}-${user_id}.${detectedType?.ext}`;

    // Step 3: Upload the WebP image to S3
    const result = await uploadToS3(
      imageBuffer,
      bucketName,
      key,
      detectedType?.mime
    );

    return {
      isError: false,
      data: result.Location,
    };
  } catch (error) {
    console.log('error: ', error);
    return {
      isError: true,
      error,
      message: 'Error in Upload to S3URL',
    };
  }
};

module.exports = convertToS3Url;
