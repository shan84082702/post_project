const express = require('express');
const router = express.Router();
const appError = require("../service/appError");
const handleErrorAsync = require("../service/handleErrorAsync");
const upload = require('../service/image');
const {isAuth,generateSendJWT} = require('../service/auth');
const UploadController = require("../controllers/uploadController");


router.post('/image',isAuth,upload,handleErrorAsync(UploadController.uploadImg));
module.exports = router;