const express = require('express');
const handleErrorAsync = require('../service/handleErrorAsync');
const {isAuth,generateSendJWT} = require('../service/auth');
const router = express.Router();
const UserController = require("../controllers/usersController");


router.post('/sign_up', handleErrorAsync(UserController.signUp));

router.post('/sign_in',handleErrorAsync(UserController.signIn));

router.get('/profile',isAuth, handleErrorAsync(UserController.getProfile));

router.patch('/profile',isAuth, handleErrorAsync(UserController.updateProfile));

router.post('/updatePassword',isAuth,handleErrorAsync(UserController.updatePassword));

module.exports = router;
