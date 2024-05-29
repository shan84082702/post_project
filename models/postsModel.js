const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
      content: {
        type: String,
        required: [true, 'Content 未填寫']
      },
      photo: {
        type:String,
        default:""
      },
      createdAt: {
        type: Date,
        default: Date.now,
        select: false
      },
      user: {
          type: mongoose.Schema.ObjectId,
          ref: 'user', //這要跟usersModel.js最後一行，括號中'user'的字一樣
          required: [true, '貼文姓名未填寫']
      },
      likes: {
          type:Number,
          default:0
        }
    },
    {
      versionKey : false
    }
);
                           //集合名稱，mongoose會自動變成全小寫並加s:>
const Post = mongoose.model('post', postSchema);
module.exports = Post;