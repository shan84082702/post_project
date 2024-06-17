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
      likes: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'user'
        }
      ]//這邊要放陣列資料，必須保證資料量不超過16MB
    },
    {
      versionKey : false,
      toJSON : { virtuals : true }, //若用virtual欄位，需加上這兩行
      toObject : { virtuals : true }, //若用virtual欄位，需加上這兩行
      id: false
    }
);
//不同資料表產生關聯寫法：
//產生虛擬的comments欄位，條件：Comment中，post=(自己)_id
postSchema.virtual('comments', {
  ref: 'comment',
  foreignField: 'post', //對方的欄位
  localField: '_id' //自己的欄位
});
                           //集合名稱，mongoose會自動變成全小寫並加s:>
const Post = mongoose.model('post', postSchema);
module.exports = Post;