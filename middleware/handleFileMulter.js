const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v1: uuidv1 } = require('uuid');

const dirName = 'public/temp';
console.log('dirName: ', dirName);

const handleFileMulter = (req, res, next) => {
  try {
    // Make directory if it does not exist
    if (!fs.existsSync(dirName)) {
      console.log('dirName 2: ', dirName);
      fs.mkdirSync(dirName, { recursive: true });
    }

    // Use memory storage to keep file in buffer
    // const storage = multer.memoryStorage();

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, dirName);
      },
      filename: (req, file, cb) => {
        cb(null, `${uuidv1()}${path.extname(file.originalname)}`);
      },
    });

    const multerUpload = multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    });

    multerUpload.array('csv', 1);
    next();
  } catch (error) {
    console.log('error: ', error);
    return res
      .status(400)
      .json({ message: 'File is not valid', error: error.message });
  }
};

// only required one file

module.exports = handleFileMulter;
