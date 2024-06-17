const Post = require("../models/postsModel");
const User = require("../models/usersModel");
const Comment = require("../models/commentsModel");
const validator = require('validator');
const successHandle = require("../service/successHandle");
const appError = require("../service/appError");

const postsController = {
    async getPosts(req, res){
        const timeSort = req.query.timeSort === "asc" ? "createdAt":"-createdAt"
        const q = req.query.q !== undefined ? {"content": new RegExp(req.query.q)} : {};
        //find()內的語法要為{"content":/刷牙/} /刷牙/=>正規表達物件
        const posts = await Post.find(q).populate({
            path: 'user', //對應到postsModel的第18行
            select: 'name photo'
        }).populate({
            path: 'comments',
            select: 'comment user'
        }).sort(timeSort); //populate：把user和comments都展開
        /*小筆記
        *如果populate comments這一段拿掉
        *整個comments都不會顯示
        *因為postsModel本身沒有comments欄位
        *如果沒有這段語法就代表不會去造訪comments table
        *postsModel的virtual那一段等於沒用
        */
        
        const result = { posts: posts };
        successHandle(res,result);
    },

    async getOnePost(req, res, next){
        const post = await Post.findOne({"_id":req.params.id}).populate({
            path: 'user', //對應到postsModel的第18行
            select: ' name photo '
        }).populate({
            path: 'comments',
            select: ' comment user '
        });

        if(!post){
            return next(appError(400,"無此貼文"));
        }

        const result = { post: post };
        successHandle(res,result);
    },

    async createPost(req, res, next){
        if(req.body.content === undefined){
            return next(appError(400,"你沒有填寫 content 資料"));
        }

        //有photo欄位且有值的話，判斷一下是否為URI
        if(req.body.photo !== undefined && req.body.photo !== ""){
            if(!validator.isURL(req.body.photo)){
              return next(appError("400","貼文URL未填寫正確！",next));
            };
        }
        const newPost = await Post.create(
            {
                user: req.user.id,
                content: req.body.content.trim(),
                photo: req.body.photo
            }
        );
        const result = { post: newPost };
        successHandle(res,result);
    },

    async deleteAllPosts(req, res, next){
        //刪除單一貼文但未填寫ID的狀況處理
        if(req.originalUrl === "/posts/"){
            return next(appError(400,"未填寫欲刪除之id"));
        }

        const deletePosts = await Post.find({"user": req.user.id}).select('id');
        if(deletePosts.length===0){
            return next(appError(400,"使用者沒有任何貼文"));
        }
        const deleteIds = await deletePosts.map(doc => doc._id);

        //刪除登入者的全部貼文&評論
        await Post.deleteMany({"user": req.user.id});
        await Comment.deleteMany({"post": {$in:deleteIds}});

        const result = { message: "刪除所有貼文成功" };
        successHandle(res,result);
    },

    async deletePost(req, res, next){
        const id = req.params.id;
        const deletePost = await Post.findById(id).populate({
            path: 'user',
            select: 'id'
        });
        if(deletePost === null){
            return next(appError(400,"查無此id"));
        }
        if(deletePost.user.id !== req.user.id){
            return next(appError(403,"無權刪除此貼文"));
        }
        await Post.findByIdAndDelete(id);
        await Comment.deleteMany({"post": id});
        
        const result = { message: "刪除貼文成功" };
        successHandle(res,result);
    },

    async patchPost(req, res, next){
        if(req.body.content === undefined){
            return next(appError(400,"你沒有填寫content資料"));
        }
        const id = req.params.id;
        const updatePost = await Post.findById(id).populate({
            path: 'user',
            select: 'id'
        });
        if(updatePost === null){
            return next(appError(400,"查無此id"));
        }
        if(updatePost.user.id !== req.user.id){
            return next(appError(403,"無權修改此貼文"));
        }

        let updateData = {
            content: req.body.content.trim()
        }
        //有photo欄位且有值的話，判斷一下是否為URI，若沒問題，photo欄位也要更新
        if(req.body.photo !== undefined && req.body.photo !== ""){
            if(!validator.isURL(req.body.photo)){
              return next(appError("400","貼文URL未填寫正確！",next));
            };
            updateData = {
                content: req.body.content.trim(),
                photo: req.body.photo
            }
        }
        const newPost = await Post.findByIdAndUpdate(id,updateData,{new:true,runValidators:true});
        
        const result = { post: newPost };
        successHandle(res,result);
    },

    async createPostLike(req, res, next){
        const _id = req.params.id;

        //檢查有無此貼文
        const likePost = await Post.findOne({"_id":_id});
        if(!likePost){
            return next(appError(400,'無此貼文',next));
        }

        //檢查是否已按讚
        const isLike = await Post.findOne({_id: _id, likes:{$eq:req.user.id}});
        if(isLike){
          return next(appError(400,'已按讚此貼文',next));
        }

        await Post.findOneAndUpdate( { _id },
                                     { $addToSet: { likes: req.user.id } } );
        const result = { message: "按讚成功" };
        successHandle(res,result);
    },

    async deletePostLike(req, res, next){
        const _id = req.params.id;

        //檢查有無此貼文
        const likePost = await Post.findOne({"_id":_id});
        if(!likePost){
            return next(appError(400,'無此貼文',next));
        }

        //檢查是否已按讚
        const isLike = await Post.findOne({_id: _id, likes:{$eq:req.user.id}});
        if(!isLike){
          return next(appError(400,'未按讚此貼文',next));
        }

        await Post.findOneAndUpdate( { _id },
                                     { $pull: { likes: req.user.id } });

        const result = { message: "已取消按讚" };
        successHandle(res,result);
    },

    async createPostComment(req, res, next){
        if(req.body.comment === undefined){
            return next(appError(400,"你沒有填寫 comment 資料"));
        }

        //檢查有無此貼文
        const likePost = await Post.findOne({"_id":req.params.id});
        if(!likePost){
            return next(appError(400,'無此貼文',next));
        }

        
        const newComment = await Comment.create(
            {
                post: req.params.id,
                user: req.user.id,
                comment: req.body.comment.trim()
            }
        );
        
        const result = { comment: newComment };
        successHandle(res,result);
    },

    async patchPostComment(req, res, next){
        if(req.body.comment === undefined){
            return next(appError(400,"你沒有填寫comment資料"));
        }

        const postId = req.params.id;
        const commentId = req.params.commentId;

        const patchComment = await Comment.findById(commentId).populate({
            path: 'user',
            select: 'id'
        });

        if(patchComment === null){
            return next(appError(400,"查無此id"));
        }
        if(!patchComment.post.equals(postId)){
            return next(appError(400,"此評論不屬於此貼文"));
        }
        if(patchComment.user.id !== req.user.id){
            return next(appError(403,"無權修改此評論"));
        }

        const patchData = {
            comment: req.body.comment.trim()
        }
        const newComment = await Comment.findByIdAndUpdate(commentId,patchData,{new:true,runValidators:true});

        const result = { comment: newComment };
        successHandle(res,result);
        
    },

    async deletePostComment(req, res, next){
        const postId = req.params.id;
        const commentId = req.params.commentId;

        const deleteComment = await Comment.findById(commentId).populate({
            path: 'user',
            select: 'id'
        });

        if(deleteComment === null){
            return next(appError(400,"查無此id"));
        }
        console.log(deleteComment.post);
        if(!deleteComment.post.equals(postId)){
            return next(appError(400,"此評論不屬於此貼文"));
        }

        const deleteCommentPost = await Post.findById(postId).populate({
            path: 'user',
            select: 'id'
        });

        if(deleteCommentPost === null){
            return next(appError(400,"查無此id"));
        }
        //貼文的發表者&評論的發表者 都有權刪除評論
        if(deleteComment.user.id !== req.user.id && deleteCommentPost.user.id !== req.user.id){
            return next(appError(403,"無權刪除此評論"));
        }

        await Comment.findByIdAndDelete(commentId);

        const result = { message: "刪除評論成功" };
        successHandle(res,result);
    },

    async getPostList(req, res, next){
        const user = await User.findOne({"_id":req.params.id});
        if(!user){
            return next(appError(400,'無此用戶',next));
        }

        const posts = await Post.find({user:req.params.id})
                                .populate({ path: 'comments',
                                            select: 'comment user' })
                                .sort("-createdAt");

        const result = { num: posts.length, posts: posts };
        successHandle(res,result);
    },

};

module.exports = postsController;