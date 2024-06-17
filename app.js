let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
const dotenv = require("dotenv");
dotenv.config({"path":"./config.env"});
const errorHandle = require("./service/errorHandle");

require("./connections");

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let postsRouter = require('./routes/posts');
let uploadRouter = require('./routes/upload');

let app = express();

process.on('uncaughtException', err => {
    // 記錄錯誤下來，等到服務都處理完後，停掉該 process
    console.error('Uncaughted Exception！')
    console.error(err);
    process.exit(1);
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/upload', uploadRouter);

// 404 錯誤
app.use(function(req, res, next) {
    const errorMessage =  { message: "無此路由資訊" };
    errorHandle(res, 404, errorMessage);
});

// 自己設定的 err 錯誤 
const resErrorProd = (err, res) => {
    if (err.isOperational) {
        const errorMessage =  { message: err.message };
        errorHandle(res, err.statusCode, errorMessage);
    } 
    else {
        // log 紀錄
        console.error('出現重大錯誤', err);
        // 送出罐頭預設訊息
        const errorMessage =  { message: "系統錯誤，請洽系統管理員" };
        errorHandle(res, 500, errorMessage);
    }
};

// 開發環境錯誤
const resErrorDev = (err, res) => {
    const errorMessage =  { message: err.message,
                            error: err,
                            stack: err.stack };
    errorHandle(res, err.statusCode, errorMessage);
};

// 錯誤處理
app.use(function(err, req, res, next) {
    // dev
    err.statusCode = err.statusCode || 400;
    if (process.env.NODE_ENV === 'dev') {
        return resErrorDev(err, res);
    } 
    // production
    if (err.name === 'ValidationError'){
        err.message = "資料欄位未填寫正確，請重新輸入！"
        err.isOperational = true;
        return resErrorProd(err, res)
    }
    // production
    else if (err.code === 'LIMIT_FILE_SIZE'){
        err.message = "檔案過大"
        err.isOperational = true;
        return resErrorProd(err, res)
    }
    // production
    else if (err.name === 'CastError'){
        err.message = "id格式錯誤"
        err.isOperational = true;
        return resErrorProd(err, res)
    }
    resErrorProd(err, res)
});

// 未捕捉到的 catch 
process.on('unhandledRejection', (reason, promise) => {
    console.error('未捕捉到的 rejection：', promise, '原因：', reason);
    // 記錄於 log 上
});

module.exports = app;
