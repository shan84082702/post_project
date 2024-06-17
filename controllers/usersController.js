const User = require("../models/usersModel");
const Post = require("../models/postsModel");
const appError = require("../service/appError");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const {isAuth,generateSendJWT} = require('../service/auth');
const successHandle = require("../service/successHandle");

const usersController = {
    async signUp(req, res, next) {
        let { email, password,confirmPassword,name } = req.body;
        // 內容不可為空
        if(!email||!password||!confirmPassword||!name){
          return next(appError("400","欄位未填寫正確！",next));
        }
        // 暱稱2個字以上
        if(!validator.isLength(name.trim(),{min:2})){
          return next(appError("400","暱稱字數低於2個字",next));
        }
        // 密碼正確
        if(password!==confirmPassword){
          return next(appError("400","密碼不一致！",next));
        }
        // 密碼 8 碼以上
        if(!validator.isLength(password,{min:8})){
          return next(appError("400","密碼字數低於 8 碼",next));
        }
        // 密碼英數混合
        if(!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)){
          return next(appError("400","密碼需要至少含有一個數字和一個英文字母",next));
        }
        // 是否為 Email
        if(!validator.isEmail(email)){
          return next(appError("400","Email 格式不正確",next));
        }

        const user = await User.findOne({"email":email});
        if(user){
          return next(appError("400","此帳號已被註冊",next));
        }

        // 加密密碼
        password = await bcrypt.hash(req.body.password,12);
        const newUser = await User.create({
          email,
          password,
          name
        });
        generateSendJWT(newUser,201,res);
    },

    async signIn(req,res,next){
        const { email, password } = req.body;
        if (!email || !password) {
          return next(appError( 400,'帳號密碼不可為空',next));
        }
        // 是否為 Email
        if(!validator.isEmail(email)){
          return next(appError("400","Email 格式不正確",next));
        }

        const user = await User.findOne({ email }).select('+password');
        if(!user){
          return next(appError(400,'此帳號尚未註冊',next));
        }
        const auth = await bcrypt.compare(password, user.password);
        if(!auth){
          return next(appError(400,'您的密碼不正確',next));
        }
        generateSendJWT(user,200,res);
    },

    async getProfile(req, res, next){
        const result = { user: req.user };
        successHandle(res,result);
    },

    async updateProfile(req, res, next){
        let { name, sex, photo } = req.body;
        // 內容不可為空
        if(!name || !sex){
          return next(appError("400","欄位未填寫正確！",next));
        }
        // 暱稱2個字以上
        if(!validator.isLength(name.trim(),{min:2})){
          return next(appError("400","暱稱字數低於2個字",next));
        }

        let updateData = { name:name, 
                          sex:sex };
        
        //若有傳送photo欄位，photo資料也要更新
        if(photo !== undefined){
          if(!validator.isURL(photo)){
            return next(appError("400","頭像URL未填寫正確！",next));
          };
          updateData = { name:name, 
                         sex:sex,
                         photo:photo };
        }

        const updateUser = await User.findByIdAndUpdate(req.user.id,updateData,{new:true,runValidators:true});

        const result = { user: updateUser };
        successHandle(res,result);

        
    },

    async updatePassword(req,res,next){
        const {password,confirmPassword } = req.body;
        // 內容不可為空
        if(!password||!confirmPassword){
          return next(appError("400","欄位未填寫正確！",next));
        }
        if(password!==confirmPassword){
          return next(appError("400","密碼不一致！",next));
        }
        // 密碼 8 碼以上
        if(!validator.isLength(password,{min:8})){
          return next(appError("400","密碼字數低於 8 碼",next));
        }
        // 密碼英數混合
        if(!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)){
          return next(appError("400","密碼需要至少含有一個數字和一個英文字母",next));
        }
        newPassword = await bcrypt.hash(password,12);
        
        const user = await User.findByIdAndUpdate(req.user.id,{ password:newPassword });
        generateSendJWT(user,200,res)
    },

    async follow(req,res,next){
        if (req.params.id === req.user.id) {
            return next(appError(401,'您無法追蹤自己',next));
        }

        const followUser = await User.findOne({"_id":req.params.id});
        if(!followUser){
            return next(appError(400,'無此用戶',next));
        }

        //檢查是否已追蹤
        const isFollow = await User.findOne({_id: req.user.id,"following.user":{$eq:req.params.id}});
        if(isFollow){
          return next(appError(400,'已追蹤此用戶',next));
        }

        await User.updateOne(
            {
                _id: req.user.id,
                'following.user': { $ne: req.params.id }
            },
            {
                $addToSet: { following: { user: req.params.id } }
            }
        );
        await User.updateOne(
            {
                _id: req.params.id,
                'followers.user': { $ne: req.user.id }
            },
            {
                $addToSet: { followers: { user: req.user.id } }
            }
        );
        
        const result = { message:"追蹤成功" };
        successHandle(res,result);
    },

    async unfollow(req,res,next){
        if (req.params.id === req.user.id) {
            return next(appError(401,'您無法取消追蹤自己',next));
        }

        const follower = await User.findOne({"_id":req.params.id});
        if(!follower){
            return next(appError(400,'無此用戶',next));
        }
        
        //檢查是否有追蹤
        const isFollow = await User.findOne({_id: req.user.id,"following.user":{$eq:req.params.id}});
        if(!isFollow){
          return next(appError(400,'未追蹤此用戶',next));
        }

        await User.updateOne(
            {
                _id: req.user.id
            },
            {
                $pull: { following: { user: req.params.id } }
            }
        );
        await User.updateOne(
            {
                _id: req.params.id
            },
            {
                $pull: { followers: { user: req.user.id } }
            }
        );

        const result = { message: "成功取消追蹤" };
        successHandle(res,result);
    },

    async getLikeList(req,res,next){
        const likeList = await Post.find({ likes: { $in: [req.user.id] } })
                                   .populate({ path:"user",
                                                select:"name photo" })
                                   .sort("-createdAt");

        const result = { likeList: likeList };
        successHandle(res,result);
    },

    async getCommentList(req,res,next){
      console.log(req.user.id);
      const posts = await Post.find().populate({ path:"user",
                                              select:"name photo" })
                                      .populate({ path: 'comments',
                                                  select: 'comment user' })
                                      .sort("-createdAt");
      const commentList = posts.filter( post => post.comments.some( comment => comment.user.equals(req.user.id) ) );
      
      //希望output僅僅是顯示貼文，所以把comment欄位刪掉
      const commentListResult = commentList.map(post => {
        const postObj = post.toObject();
        delete postObj.comments;
        return postObj;
      });
      const result = { commentList: commentListResult };
      successHandle(res,result);
  },

    async following(req,res,next){
      const followingList = await User.findById(req.user.id)
                                      .select('following.user following.createdAt')
                                      .populate({ path:"following.user",
                                                  select:"name photo" });
      console.log(followingList);
      const result = { followingList: followingList.following };
      successHandle(res,result);                  
    },
    
}

module.exports = usersController;