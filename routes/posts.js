const express = require('express');
const router = express.Router();
const PostController = require("../controllers/postsController");
const handleErrorAsync = require("../service/handleErrorAsync");
const {isAuth,generateSendJWT} = require('../service/auth');

router.get('/', isAuth, PostController.getPosts);

router.get('/:id', isAuth, handleErrorAsync(PostController.getOnePost));

router.post('/', isAuth, handleErrorAsync(PostController.createPost));

router.delete('/', isAuth, PostController.deleteAllPosts);

router.delete('/:id', isAuth, handleErrorAsync(PostController.deletePost));

router.patch('/:id', isAuth, handleErrorAsync(PostController.patchPost));

router.post('/:id/like', isAuth, handleErrorAsync(PostController.createPostLike));

router.delete('/:id/like', isAuth, handleErrorAsync(PostController.deletePostLike));

router.post('/:id/comment', isAuth, handleErrorAsync(PostController.createPostComment));

router.patch('/:id/comment/:commentId', isAuth, handleErrorAsync(PostController.patchPostComment));

router.delete('/:id/comment/:commentId', isAuth, handleErrorAsync(PostController.deletePostComment));

router.get('/user/:id', handleErrorAsync(PostController.getPostList));

module.exports = router;
