const Post = require("../models/postsModel");
const User = require("../models/usersModel");
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
        }).sort(timeSort);
        successHandle(res,posts);
    },

    async createPost(req, res, next){
        if(req.body.content === undefined){
            return next(appError(400,"你沒有填寫 content 資料"));
        }
        const newPost = await Post.create(
            {
                user: req.user.id,
                content: req.body.content.trim(),
                photo: req.body.photo
            }
        );
        successHandle(res,newPost);
    },

    async deleteAllPosts(req, res, next){
        //刪除單一貼文但未填寫ID的狀況處理
        if(req.originalUrl === "/posts/"){
            return next(appError(400,"未填寫欲刪除之id"));
        }

        //刪除登入者的全部貼文
        await Post.deleteMany({"user": req.user.id});

        res.status(200).json({
            status: "success",
            message: "刪除所有貼文成功"
        });
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
        
        res.status(200).json({
            status: "success",
            message: "刪除貼文成功"
        });
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
        const updateData = {
            user: req.user.id,
            content: req.body.content.trim()
        }
        const newPost = await Post.findByIdAndUpdate(id,updateData,{new:true,runValidators:true});
        
        successHandle(res,newPost);
    },
};

module.exports = postsController;