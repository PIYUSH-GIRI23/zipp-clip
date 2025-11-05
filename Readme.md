<div align="center">

# 🎬 Clip Service  
### A scalable media management microservice for uploading, managing, and upgrading user clips.

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Deploy with Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br>

💡 **Official Repository:**  
👉 [ZIPP — GitHub Repository](https://github.com/PIYUSH-GIRI23/zipp)

</div>

---

## 🚀 Features

- 🎥 **Clip Uploading** — Upload and manage user media using Cloudinary.  
- 📦 **Storage Limits** — Smart upload restrictions based on plan and usage.  
- ⚙️ **Multer Integration** — Seamless file handling and multipart upload.  
- 🔐 **JWT Validation** — Secure routes with JWT verification middleware.  
- 💎 **Upgrade Plans** — Dynamic plan management and user quota upgrades.  
- 🧠 **Utility Functions** — Modular helpers for limit checks, JWT, and uploads.  
- ☁️ **Vercel Ready** — Optimized for fast, serverless deployment.  

---

## 🧱 Project Structure

<pre>
clip/
├── db/                          # Database setup (if applicable)
│
├── middleware/                  # Middleware functions
│
├── node_modules/                # Installed dependencies
│
├── routes/                      # Clip-related routes
│   └── manageClip.js
│
├── utils/                       # Helper utilities
│   ├── cloudinary/              # Cloudinary upload management
│   ├── checkLimit.js            # Checks upload/storage limits
│   ├── findLimits.js            # Finds user plan limits
│   ├── jwtUtils.js              # JWT helper utilities
│   ├── multer.js                # File upload configuration
│   └── upgradePlan.js           # Plan upgrade logic
│
├── .env                         # Environment variables
├── .env.config                  # Environment configuration
├── .gitignore                   # Git ignored files
├── package.json                 # Dependencies & metadata
├── package-lock.json            # Locked dependency versions
├── Readme.md                    # This documentation ❤️
├── server.js                    # Service entry point
└── vercel.json                  # Deployment configuration
</pre>

---

## ⚙️ Setup & Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/PIYUSH-GIRI23/zipp-clip.git

# 2️⃣ Move into the directory
cd clip

# 3️⃣ Install dependencies
npm install

# 4️⃣ Configure environment variables
cp .env.config .env

# 5️⃣ Start the server (development)
npm run dev

---

🌐 Connect with Me


<a href="mailto:giri.piyush2003@gmail.com"><img src="https://img.shields.io/badge/Mail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Mail"></a>
<a href="https://github.com/PIYUSH-GIRI23"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
<a href="https://www.linkedin.com/in/piyush-giri-031b71254/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://x.com/GIRIPIYUSH2310"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" alt="X"></a>