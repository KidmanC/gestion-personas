const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "persons_photos",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // Maximo 2MB
});

module.exports = upload;
