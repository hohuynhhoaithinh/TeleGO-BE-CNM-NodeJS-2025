const Messages = require("../models/MessageModel");
const mongoose = require("mongoose");
const { getSocketIO, getOnlineUsers } = require("../utils/socket"); // thêm dòng này ở đầu file
const groupModel = require("../models/GroupModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to, groupId } = req.body;

    let messages;
    // Lấy tin nhắn cá nhân
    messages = await Messages.find({
      users: { $all: [from, to] },
      groupId: null,
      deletedFor: { $ne: from },
    })
      .sort({ updatedAt: 1 })
      .populate({
        path: "replyTo",
        select: "message sender createdAt",
        populate: {
          path: "sender",
          select: "fullName avatar",
        },
      });

    const projectedMessages = messages.map((msg) => ({
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text,
      fileUrls: msg.message.files.map((file) => file.url),
      fileTypes: msg.message.files.map((file) => file.type),
      emoji: msg.message.emoji,
      _id: msg._id,
      createdAt: msg.createdAt,
      recalled: msg.recalled,
      sender: msg.sender.toString(), // Thêm trường sender với ID của người gửi
      reactions: msg.reactions.map((r) => ({
        user: r.user,
        emoji: r.emoji,
      })),
      replyTo: msg.replyTo
        ? {
            _id: msg.replyTo._id,
            text: msg.replyTo.message.text,
            createdAt: msg.replyTo.createdAt,
            user: {
              _id: msg.replyTo.sender?._id,
              fullName: msg.replyTo.sender?.fullName,
              avatar: msg.replyTo.sender?.avatar,
            },
            fileUrls: msg.replyTo.message.files.map((file) => file.url),
            fileTypes: msg.replyTo.message.files.map((file) => file.type),
          }
        : null,
    }));

    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    if (!req.body) {
      console.error("[addMessage] req.body is undefined");
      return res.status(400).json({ msg: "Request body is missing" });
    }

    const { from, to, groupId, message, files, isGif, replyTo } = req.body;

    // Log khi nhận yêu cầu gửi tin nhắn
    console.log(
      `📤 [addMessage] Sending message - From: ${from} - To: ${to} - GroupId: ${groupId} - Content: ${message} - IsGIF: ${isGif}`
    );

    if (!mongoose.Types.ObjectId.isValid(from)) {
      console.error("[addMessage] Invalid user ID:", { from });
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const newMsg = {
      sender: from,
      message: {
        text: message || "",
        files: files
          ? files.map((file) => ({
              url: file.location,
              type: file.mimetype,
            }))
          : isGif
          ? [{ url: message, type: "image/gif" }]
          : [],
      },
    };

    if (groupId) {
      // Tin nhắn nhóm
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        console.error("[addMessage] Invalid group ID:", { groupId });
        return res.status(400).json({ msg: "Invalid group ID" });
      }
      newMsg.groupId = groupId;
      newMsg.users = [];
    } else {
      // Tin nhắn cá nhân
      if (!mongoose.Types.ObjectId.isValid(to)) {
        console.error("[addMessage] Invalid recipient ID:", { to });
        return res.status(400).json({ msg: "Invalid recipient ID" });
      }
      newMsg.users = [from, to];
    }

    let repliedToMessage = null;
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      newMsg.replyTo = replyTo;
      repliedToMessage = await Messages.findById(replyTo).populate(
        "sender",
        "fullName avatar"
      );
    }

    console.log("[addMessage] Saving message to DB:", newMsg);
    const savedMessage = await Messages.create(newMsg);

    // Log khi tin nhắn được lưu thành công
    console.log(
      `✅ [addMessage] Message saved - From: ${from} - To: ${to} - GroupId: ${groupId} - Message ID: ${savedMessage._id} - Content: ${savedMessage.message.text}`
    );

    const io = getSocketIO();
    const onlineUsers = getOnlineUsers();

    if (groupId) {
      // Gửi tin nhắn nhóm qua socket
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ msg: "Group not found" });
      }
      group.groupMembers.forEach((memberId) => {
        // Xử lý memberId là String hoặc ObjectId
        const memberIdStr = memberId.toString ? memberId.toString() : memberId;
        const memberSocket = onlineUsers.get(memberIdStr);
        if (memberSocket && memberIdStr !== from) {
          io.to(memberSocket).emit("group-msg-receive", {
            groupId,
            from,
            message: savedMessage.message.text,
            fileUrls: savedMessage.message.files.map((f) => f.url),
            fileTypes: savedMessage.message.files.map((f) => f.type),
            isImage: savedMessage.message.files.some((f) =>
              f.type.startsWith("image/")
            ),
            createdAt: savedMessage.createdAt,
            _id: savedMessage._id,
            replyTo: repliedToMessage
              ? {
                  _id: repliedToMessage._id.toString(),
                  message: repliedToMessage.message.text,
                  senderId: repliedToMessage.sender._id.toString(),
                  sender: {
                    _id: repliedToMessage.sender._id.toString(),
                    fullName: repliedToMessage.sender.fullName,
                    avatar: repliedToMessage.sender.avatar,
                  },
                  createdAt: repliedToMessage.createdAt,
                  fileUrls: repliedToMessage.message.files.map((f) => f.url),
                  fileTypes: repliedToMessage.message.files.map((f) => f.type),
                }
              : null,
          });
        }
      });
    } else {
      // Gửi tin nhắn cá nhân qua socket
      const recipientSocket = onlineUsers.get(to);
      if (io && recipientSocket) {
        io.to(recipientSocket).emit("msg-receive", {
          from: savedMessage.sender.toString(),
          to,
          message: savedMessage.message.text,
          fileUrls: savedMessage.message.files.map((f) => f.url),
          fileTypes: savedMessage.message.files.map((f) => f.type),
          isImage: savedMessage.message.files.some((f) =>
            f.type.startsWith("image/")
          ),
          createdAt: savedMessage.createdAt,
          _id: savedMessage._id,
          replyTo: repliedToMessage
            ? {
                _id: repliedToMessage._id.toString(),
                message: repliedToMessage.message.text,
                senderId: repliedToMessage.sender._id.toString(),
                sender: {
                  _id: repliedToMessage.sender._id.toString(),
                  fullName: repliedToMessage.sender.fullName,
                  avatar: repliedToMessage.sender.avatar,
                },
                createdAt: repliedToMessage.createdAt,
                fileUrls: repliedToMessage.message.files.map((f) => f.url),
                fileTypes: repliedToMessage.message.files.map((f) => f.type),
              }
            : null,
        });
      }
    }

    return res.json({
      msg: "Message added to the database",
      message: {
        _id: savedMessage._id,
        message: savedMessage.message.text,
        fileUrls: savedMessage.message.files.map((file) => file.url),
        fileTypes: savedMessage.message.files.map((file) => file.type),
        createdAt: savedMessage.createdAt,
        from: savedMessage.sender,
        to: groupId ? null : to,
        groupId: groupId || null,
        replyTo: repliedToMessage
          ? {
              _id: repliedToMessage._id.toString(),
              message: repliedToMessage.message.text,
              senderId: repliedToMessage.sender._id.toString(),
              sender: {
                _id: repliedToMessage.sender._id.toString(),
                fullName: repliedToMessage.sender.fullName,
                avatar: repliedToMessage.sender.avatar,
              },
              createdAt: repliedToMessage.createdAt,
              fileUrls: repliedToMessage.message.files.map((f) => f.url),
              fileTypes: repliedToMessage.message.files.map((f) => f.type),
            }
          : null,
      },
    });
  } catch (ex) {
    console.error("[addMessage] Error:", ex.stack);
    res.status(500).json({ msg: "Internal Server Error", error: ex.message });
    next(ex);
  }
};

module.exports.sendMediaMessage = async (req, res, next) => {
  try {
    if (!req.body) {
      console.error("req.body is undefined");
      return res.status(400).json({ msg: "Request body is missing" });
    }

    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    const { from, to, groupId, emoji, text, replyTo } = req.body;
    const files = req.files || [];
    let messageFiles = [];

    // Xử lý tệp được tải lên (hình ảnh, tệp)
    if (files.length > 0) {
      messageFiles = files.map((file) => ({
        url: file.location,
        type: file.mimetype,
      }));
    }
    // Xử lý URL media (GIF)
    else if (req.body.mediaUrls) {
      try {
        const providedMedia = JSON.parse(req.body.mediaUrls);
        if (Array.isArray(providedMedia)) {
          messageFiles = providedMedia.map((media) => ({
            url: media.url,
            type: media.type,
          }));
        }
      } catch (error) {
        console.error("Error parsing mediaUrls:", error);
      }
    }
    if (!mongoose.Types.ObjectId.isValid(from)) {
      console.error("Invalid user ID:", { from });
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const newMsg = {
      sender: from,
      message: {
        text: text || "",
        emoji: emoji || "",
        files: messageFiles.map((file) => {
          console.log("File location:", file.url);
          return {
            url: file.url,
            type: file.type,
          };
        }),
      },
    };

    if (groupId) {
      // Tin nhắn nhóm
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        console.error("Invalid group ID:", { groupId });
        return res.status(400).json({ msg: "Invalid group ID" });
      }
      newMsg.groupId = groupId;
      newMsg.users = [];
    } else {
      // Tin nhắn cá nhân
      if (!mongoose.Types.ObjectId.isValid(to)) {
        console.error("Invalid recipient ID:", { to });
        return res.status(400).json({ msg: "Invalid recipient ID" });
      }
      newMsg.users = [from, to];
    }

    let repliedToMessage = null;
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      newMsg.replyTo = replyTo;
      repliedToMessage = await Messages.findById(replyTo).populate(
        "sender",
        "fullName avatar"
      );
    }

    console.log("Saving message to DB:", newMsg);
    const message = await Messages.create(newMsg);
    console.log("Message saved:", message);

    const io = getSocketIO();
    const onlineUsers = getOnlineUsers();

    // Gửi tin nhắn cá nhân qua socket
    const recipientSocket = onlineUsers.get(to);
    if (io && recipientSocket) {
      io.to(recipientSocket).emit("msg-receive", {
        from: message.sender.toString(),
        to,
        message: message.message.text,
        fileUrls: message.message.files.map((f) => f.url),
        fileTypes: message.message.files.map((f) => f.type),
        isImage: message.message.files.some((f) => f.type.startsWith("image/")),
        createdAt: message.createdAt,
        _id: message._id,
        replyTo: repliedToMessage
          ? {
              _id: repliedToMessage._id.toString(),
              message: repliedToMessage.message.text,
              senderId: repliedToMessage.sender._id.toString(),
              sender: {
                _id: repliedToMessage.sender._id.toString(),
                fullName: repliedToMessage.sender.fullName,
                avatar: repliedToMessage.sender.avatar,
              },
              createdAt: repliedToMessage.createdAt,
              fileUrls: repliedToMessage.message.files.map((f) => f.url),
              fileTypes: repliedToMessage.message.files.map((f) => f.type),
            }
          : null,
      });
    }
    // message.message.files.map((f) => console.log("File URL:", f.url));
    res.json({ msg: "Media message sent", message });
  } catch (ex) {
    console.error("Error in sendMediaMessage:", ex.stack);
    res.status(500).json({ msg: "Internal Server Error", error: ex.message });
  }
};

module.exports.getLastMessagesPerUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const messages = await Messages.aggregate([
      {
        $match: {
          users: userId,
          deletedFor: { $ne: userId },
        },
      },
      {
        $addFields: {
          otherUser: {
            $filter: {
              input: "$users",
              as: "u",
              cond: { $ne: ["$$u", userId] },
            },
          },
        },
      },
      {
        $unwind: "$otherUser",
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$otherUser",
          message: { $first: "$message" },
          sender: { $first: "$sender" },
          createdAt: { $first: "$createdAt" },
          recalled: { $first: "$recalled" },
          messageId: { $first: "$_id" },
          users: { $first: "$users" },
        },
      },
      {
        $project: {
          _id: "$messageId",
          users: 1,
          fromSelf: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
          message: "$message.text",
          fileUrls: "$message.files.url", // Lấy URL từ files
          fileTypes: "$message.files.type", // Lấy type từ files
          emoji: "$message.emoji",
          createdAt: 1,
          recalled: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json(messages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Messages.findById(id)
      .populate({
        path: "replyTo",
        select: "message sender createdAt",
        populate: {
          path: "sender",
          select: "fullName avatar",
        },
      })
      .populate("sender", "fullName avatar");

    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    const result = {
      fromSelf: false, // Có thể thêm logic để xác định user gọi API
      message: message.message.text,
      fileUrls: message.message.files.map((f) => f.url),
      fileTypes: message.message.files.map((f) => f.type),
      emoji: message.message.emoji,
      _id: message._id,
      createdAt: message.createdAt,
      recalled: message.recalled,
      reactions: message.reactions.map((r) => ({
        user: r.user,
        emoji: r.emoji,
      })),
      sender: {
        _id: message.sender._id,
        fullName: message.sender.fullName,
        avatar: message.sender.avatar,
      },
      groupId: message.groupId || null,
      users: message.users || [],
      replyTo: message.replyTo
        ? {
            _id: message.replyTo._id,
            message: message.replyTo.message.text,
            createdAt: message.replyTo.createdAt,
            sender: {
              _id: message.replyTo.sender?._id,
              fullName: message.replyTo.sender?.fullName,
              avatar: message.replyTo.sender?.avatar,
            },
            fileUrls: message.replyTo.message.files.map((f) => f.url),
            fileTypes: message.replyTo.message.files.map((f) => f.type),
          }
        : null,
    };

    res.json(result);
  } catch (ex) {
    next(ex);
  }
};
