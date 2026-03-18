## 📌 Overview

**TeleGO** is a scalable real-time messaging application built with **Node.js**, designed to deliver fast, reliable, and seamless communication between users. The system leverages modern backend technologies and architecture patterns to ensure high performance and maintainability.

---

## ✨ Features

### 💬 Messaging

| Feature                              | 1-on-1 | Group |
| ------------------------------------ | :----: | :---: |
| Real-time messaging (WebSocket)      |   ✅   |  ✅   |
| Message history & retrieval          |   ✅   |  ✅   |
| Send media files (image, video, ...) |   ✅   |  ✅   |
| Typing indicator                     |   ✅   |  ✅   |
| Recall / Delete message              |   ✅   |  ✅   |
| Forward message                      |   ✅   |  ✅   |
| React to message                     |   ✅   |  ✅   |
| Pin / Unpin message                  |   ✅   |  ✅   |
| Delete conversation                  |   ✅   |  ✅   |

### 👥 Group Chat

- 📝 Create & rename group conversations
- 👤 Add / Remove members
- 👑 Admin & Deputy role management
- 🖼️ Update group avatar
- 🚪 Leave group

### 👤 User & Friends

- 📱 Register / Login by phone number
- 🔄 Online / Offline status tracking
- 👫 Send / Accept / Reject / Unfriend
- 🔑 Forgot password & change password

---

## 🛠️ Tech Stack

```
Backend         Node.js + Express.js
Real-time       Socket.io
Database        MongoDB (Mongoose ODM)
File Upload     Multipart / Cloud Storage
DevOps          Docker + Docker Compose
```

---

## 📁 Project Structure

```
telego/
├── src/
│   ├── config/             # DB, environment configs
│   ├── controllers/        # Route controllers
│   │   ├── userController.js
│   │   ├── friendController.js
│   │   ├── messageController.js
│   │   └── groupController.js
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   └── Group.js
│   ├── routes/             # Express routes
│   │   ├── userRoutes.js
│   │   ├── friendRoutes.js
│   │   ├── messageRoutes.js
│   │   └── groupRoutes.js
│   ├── socket/             # Socket.io event handlers
│   │   ├── index.js
│   │   ├── chat.socket.js
│   │   └── group.socket.js
│   ├── middlewares/        # Upload, error handlers
│   └── utils/              # Helpers
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- [MongoDB](https://www.mongodb.com/) >= 6.x
- [Docker](https://www.docker.com/) _(optional)_

---

### 📦 Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/telego.git
cd telego
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
S3_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
ATLAS_URI (cluster MongoDB) =
```

**4. Run the application**

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

---

### 🐳 Run with Docker

```bash
docker-compose up --build
```

The app will be available at `http://localhost:5000`.

---

## 📡 API Reference

### 👤 User — `/api/users`

| Method   | Endpoint                 | Description               |
| -------- | ------------------------ | ------------------------- |
| `GET`    | `/`                      | Get all users             |
| `POST`   | `/`                      | Create new user           |
| `POST`   | `/login`                 | Login                     |
| `POST`   | `/logout`                | Logout                    |
| `GET`    | `/id/:id`                | Get user by ID            |
| `GET`    | `/phone/:phoneNumber`    | Get user by phone number  |
| `PUT`    | `/phone/:phoneNumber`    | Update user info & avatar |
| `DELETE` | `/id/:id`                | Delete user by ID         |
| `GET`    | `/status/:userId`        | Get online/offline status |
| `POST`   | `/forgot-password`       | Forgot password           |
| `PUT`    | `/change-password/:id`   | Change password by ID     |
| `PUT`    | `/change-password-phone` | Change password by phone  |

---

### 👫 Friends — `/api/friends`

| Method | Endpoint                  | Description                 |
| ------ | ------------------------- | --------------------------- |
| `GET`  | `/get-friend/:userId`     | Get friend list             |
| `POST` | `/add-friend`             | Send friend request         |
| `POST` | `/accept-friend`          | Accept friend request       |
| `POST` | `/reject-friend`          | Reject friend request       |
| `POST` | `/unfriend-friend`        | Unfriend                    |
| `GET`  | `/get-add-friend/:userId` | Get pending friend requests |

---

### 💬 Messages — `/api/messages`

| Method   | Endpoint                      | Description                       |
| -------- | ----------------------------- | --------------------------------- |
| `POST`   | `/addmsg`                     | Send a text message               |
| `POST`   | `/getmsg`                     | Get messages in a conversation    |
| `POST`   | `/sendmedia`                  | Send media file                   |
| `POST`   | `/forwardmsg`                 | Forward a message                 |
| `DELETE` | `/deletemsg/:id`              | Delete message (for everyone)     |
| `POST`   | `/recallmsg/:id`              | Recall a message                  |
| `POST`   | `/deletemsgforme`             | Delete message (for me only)      |
| `POST`   | `/delete-all-messages-for-me` | Delete all messages for me        |
| `POST`   | `/delete-conversation`        | Delete a conversation             |
| `GET`    | `/usermessages/:userId`       | Get all messages of a user        |
| `GET`    | `/lastmessages/:userId`       | Get last message per conversation |
| `POST`   | `/react`                      | React to a message                |
| `POST`   | `/pinmsg/:messageId`          | Pin a message                     |
| `POST`   | `/unpinmsg/:messageId`        | Unpin a message                   |
| `POST`   | `/getPinnedMessages`          | Get pinned messages               |

---

### 👥 Groups — `/api/groups`

| Method   | Endpoint               | Description                |
| -------- | ---------------------- | -------------------------- |
| `POST`   | `/create-group`        | Create a new group         |
| `POST`   | `/add-member`          | Add member to group        |
| `POST`   | `/remove-member`       | Remove member from group   |
| `POST`   | `/set-deputy`          | Set deputy admin           |
| `POST`   | `/remove-deputy`       | Remove deputy admin        |
| `POST`   | `/change-admin`        | Transfer admin role        |
| `POST`   | `/rename-group`        | Rename group               |
| `DELETE` | `/delete-group`        | Delete group               |
| `POST`   | `/leave-group`         | Leave group                |
| `PUT`    | `/update-avatar`       | Update group avatar        |
| `GET`    | `/id/:id`              | Get group by ID            |
| `GET`    | `/member/:id`          | Get all groups of a member |
| `GET`    | `/all`                 | Get all groups             |
| `GET`    | `/get-member/:groupId` | Get all members in a group |

---

## 🔌 Socket.io Events

### Client → Server

| Event                | Payload                        | Description         |
| -------------------- | ------------------------------ | ------------------- |
| `join_conversation`  | `{ conversationId }`           | Join a 1-on-1 room  |
| `join_group`         | `{ groupId }`                  | Join a group room   |
| `send_message`       | `{ conversationId, content }`  | Send direct message |
| `send_group_message` | `{ groupId, content }`         | Send group message  |
| `typing_start`       | `{ conversationId / groupId }` | User starts typing  |
| `typing_stop`        | `{ conversationId / groupId }` | User stops typing   |

### Server → Client

| Event               | Payload            | Description                |
| ------------------- | ------------------ | -------------------------- |
| `new_message`       | `{ message }`      | Receive new direct message |
| `new_group_message` | `{ message }`      | Receive new group message  |
| `user_typing`       | `{ userId, name }` | Someone is typing          |
| `user_online`       | `{ userId }`       | User came online           |
| `user_offline`      | `{ userId }`       | User went offline          |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  Client                     │
└──────────────┬──────────────────────────────┘
               │  HTTP / WebSocket
┌──────────────▼──────────────────────────────┐
│             Node.js + Express               │
│           Socket.io Gateway                 │
├────────────────────┬────────────────────────┤
│   REST API Layer   │   Real-time Layer      │
└────────────────────┴────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │       MongoDB        │
          │    (Persistence)     │
          └─────────────────────┘
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [Your Name](https://github.com/hohuynhhoaithinh)

⭐ Star this repo if you find it helpful!
