const jwt = require('jsonwebtoken');
const appError = require('../service/appError'); 
const handleErrorAsync = require('../service/handleErrorAsync');
const User = require('../models/usersModel');
const successHandle = require("./successHandle");
const isAuth = handleErrorAsync(async (req, res, next) => {
    // 確認 token 是否存在
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
  
    if (!token) {
      return next(appError(401,'你尚未登入！',next));
    }
  
    // 驗證 token 正確性
    const decoded = await new Promise((resolve,reject)=>{
      jwt.verify(token,process.env.JWT_SECRET,(err,payload)=>{
        if(err){
          return next(appError(403,'token過期或格式錯誤',next));
        }else{
          resolve(payload)
        }
      })
    })
    const currentUser = await User.findById(decoded.id);
  
    req.user = currentUser;
    next();
  });
const generateSendJWT= (user,statusCode,res)=>{
    // 產生 JWT token
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
      expiresIn: process.env.JWT_EXPIRES_DAY
    });
    user.password = undefined;
    
    const result = { user: { token:token, name:user.name } };
    successHandle(res,result);
  }

module.exports = {
    isAuth,
    generateSendJWT
}