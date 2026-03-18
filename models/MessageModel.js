const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const MessageSchema = new Schema(
  {
    message: {
      text: { type: String, default: "" },
      files: [
        {
          url: { type: String, default: "" },
          type: { type: String, default: "" },
        },
      ],
      emoji: { type: String, default: "" },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "group",
      default: null, // null nếu là tin nhắn cá nhân
    },
    recalled: {
      type: Boolean,
      default: false,
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String }, // ví dụ: ❤️, 😂, 😮, 👍
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message", // tham chiếu đến chính MessageModel
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model("message", MessageSchema);
module.exports = MessageModel;
