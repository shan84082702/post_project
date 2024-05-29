var express = require('express');
var router = express.Router();
const PostController = require("../controllers/postsController");
const handleErrorAsync = require("../service/handleErrorAsync");

router.get('/', PostController.getPosts);

router.post('/', handleErrorAsync(PostController.createPost));

router.delete('/', PostController.deleteAllPosts);

router.delete('/:id', handleErrorAsync(PostController.deletePost));

router.patch('/:id', handleErrorAsync(PostController.patchPost));

module.exports = router;
