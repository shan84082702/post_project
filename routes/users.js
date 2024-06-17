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

router.post('/:id/follow',isAuth,handleErrorAsync(UserController.follow));

router.delete('/:id/unfollow',isAuth,handleErrorAsync(UserController.unfollow));

router.get('/getLikeList',isAuth,handleErrorAsync(UserController.getLikeList));

router.get('/getCommentList',isAuth,handleErrorAsync(UserController.getCommentList));

router.get('/following',isAuth,handleErrorAsync(UserController.following));

module.exports = router;
