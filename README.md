# Alpha Chats V2

A real-time chat platform for coders, built with **GitHub-only authentication**, **team channels**, and **Telegram-style UI**.

## 🚀 Features

- **GitHub OAuth Authentication** - Secure sign-in with GitHub only
- **8 Pre-configured Channels** - Web Dev, App Dev, CP, AI/ML, Cyber Security, OS, System Design, Beginners
- **Direct Messages** - Private conversations with any user
- **Role-based Access** - Co-founders/Core team get admin privileges
- **Real-time Messaging** - Socket.IO powered instant delivery
- **Code Sharing** - Syntax-highlighted code blocks
- **File Attachments** - Share images and documents
- **Typing Indicators** - See when others are typing
- **Online Status** - Know who's online

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS |
| State | Redux Toolkit |
| Backend | Express 5, Node.js |
| Database | MongoDB with Mongoose |
| Auth | Passport.js + GitHub OAuth 2.0 |
| Real-time | Socket.IO 4.x |
| File Storage | Cloudinary |

## 👥 Team Members

### Co-founders (Full Admin Access)
- **Vikash** - @Vortex-16
- **Archisman** - @Dealer-09
- **Rajbeer** - @PixelPioneer404
- **Rouvik** - @Rouvik

### Core Team (Elevated Access)
- **Ayush** - @AyushChowdhuryCSE
- **Ayan** - @AyanAlikhan11
- **Rajdeep** - @yourajdeep
- **Nikhil** - @nikhil-chourasia
- **Shoaib** - @luckym-crypto
- **Jeet** - @Jeet-Pathak

## 📦 Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- GitHub OAuth App (create at https://github.com/settings/developers)
- Cloudinary account (for file uploads)

### 1. Clone & Install

```bash
cd Version-2

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URL=mongodb://localhost:27017/alpha-chats-v2
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### 3. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Alpha Chats V2
   - **Homepage URL**: http://localhost:5173
   - **Authorization callback URL**: http://localhost:4000/api/auth/github/callback
4. Copy Client ID and Client Secret to your `.env` files

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the App

- **Frontend**: https://alphachat-v2.vercel.app (or http://localhost:5173 locally)
- **Backend API**: https://alphachat-v2.onrender.com (or http://localhost:4000 locally)
- **Health Check**: https://alphachat-v2.onrender.com/api/health

## 📁 Project Structure

```
Version-2/
├── backend/
│   ├── config/           # Database, Passport, Cloudinary, Team config
│   ├── controllers/      # Auth, Channel, Message, User controllers
│   ├── middlewares/      # Auth, Role, Multer middlewares
│   ├── models/           # User, Channel, Message models
│   ├── routes/           # API routes
│   ├── scripts/          # Database seeding
│   └── index.js          # Main server
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, Chat components
│   │   ├── pages/        # Welcome, Login, Chat, Profile
│   │   ├── redux/        # User and Chat state
│   │   ├── hooks/        # Socket, Auth hooks
│   │   └── config/       # API, Axios config
│   └── index.html
└── README.md
```

## 🔐 Security

- GitHub OAuth only - No password storage
- Session-based auth with HTTP-only cookies
- Role-based access control
- Co-founders have full admin access to all channels
- Core team has elevated privileges

## 📢 Channels

| Channel | Description |
|---------|-------------|
| 🌐 Web Dev | Backend + Frontend development |
| 📱 App Dev | Mobile and desktop apps |
| 🏆 Competitive Programming | CP, contests, problem solving |
| 🤖 AI/ML | Machine learning, AI |
| 🔐 Cyber Security | Security, CTFs, pentesting |
| 💻 Operating System | OS, Linux, kernel |
| 🏗️ System Design | Architecture, scalability |
| 🌱 Beginners | C, Python, Java basics |

---

Built with ❤️ by Alpha Coders Team
