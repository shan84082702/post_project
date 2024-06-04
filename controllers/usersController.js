const Post = require("../models/postsModel");
const User = require("../models/usersModel");
const appError = require("../service/appError");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const appError = require('../service/appError'); 
const User = require('../models/usersModel');
const {isAuth,generateSendJWT} = require('../service/auth');

const usersController = {
    async signUp(req, res, next) {
        let { email, password,confirmPassword,name } = req.body;
        // 內容不可為空
        if(!email||!password||!confirmPassword||!name){
          return next(appError("400","欄位未填寫正確！",next));
        }
        // 密碼正確
        if(password!==confirmPassword){
          return next(appError("400","密碼不一致！",next));
        }
        // 密碼 8 碼以上
        if(!validator.isLength(password,{min:8})){
          return next(appError("400","密碼字數低於 8 碼",next));
        }
        // 是否為 Email
        if(!validator.isEmail(email)){
          return next(appError("400","Email 格式不正確",next));
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
        const user = await User.findOne({ email }).select('+password');
        const auth = await bcrypt.compare(password, user.password);
        if(!auth){
          return next(appError(400,'您的密碼不正確',next));
        }
        generateSendJWT(user,200,res);
    },

    async getProfile(req, res, next){
        res.status(200).json({
          status: 'success',
          user: req.user
        });
    },

    async updatePassword(req,res,next){
        const {password,confirmPassword } = req.body;
        if(password!==confirmPassword){
          return next(appError("400","密碼不一致！",next));
        }
        newPassword = await bcrypt.hash(password,12);
        
        const user = await User.findByIdAndUpdate(req.user.id,{
          password:newPassword
        });
        generateSendJWT(user,200,res)
    }
    
}

module.exports = usersController;