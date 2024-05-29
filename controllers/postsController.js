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
                user: req.body.user,
                content: req.body.content.trim(),
                photo: req.body.photo
            }
        );
        const posts = await Post.find().populate({
            path: 'user',
            select: 'name photo'
        });
        successHandle(res,posts);
    },

    async deleteAllPosts(req, res, next){
        //刪除單一貼文但未填寫ID的狀況處理
        if(req.originalUrl === "/posts/"){
            return next(appError(400,"未填寫欲刪除之id"));
        }

        await Post.deleteMany({});
        successHandle(res,[]);
    },

    async deletePost(req, res, next){
        const id = req.params.id;
        const deletePost = await Post.findByIdAndDelete(id);
        if(deletePost === null){
            return next(appError(400,"查無此id"));
        }
        const posts = await Post.find().populate({
            path: 'user',
            select: 'name photo'
        });
        successHandle(res,posts);
    },

    async patchPost(req, res, next){
        if(req.body.content === undefined || req.body.user === undefined){
            return next(appError(400,"你沒有填寫 content 或 user資料"));
        }
        const id = req.params.id;
        const updateData = {
            user: req.body.user,
            content: req.body.content.trim()
        }
        const updatePost = await Post.findByIdAndUpdate(id,updateData,{new:true,runValidators:true});
        if(updatePost === null){
            return next(appError(400,"查無此ID"));
        }
        const posts = await Post.find().populate({
            path: 'user',
            select: 'name photo'
        });
        successHandle(res,posts);
    },
};

module.exports = postsController;