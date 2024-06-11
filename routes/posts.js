const express = require('express');
const router = express.Router();
const PostController = require("../controllers/postsController");
const handleErrorAsync = require("../service/handleErrorAsync");
const {isAuth,generateSendJWT} = require('../service/auth');

router.get('/', isAuth, PostController.getPosts);

router.post('/', isAuth, handleErrorAsync(PostController.createPost));

router.delete('/', isAuth, PostController.deleteAllPosts);

router.delete('/:id', isAuth, handleErrorAsync(PostController.deletePost));

router.patch('/:id', isAuth, handleErrorAsync(PostController.patchPost));

module.exports = router;
