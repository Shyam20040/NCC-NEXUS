# NCC-Nexus

## 📌 Project Overview

NCC-Nexus is a centralized digital platform designed to streamline and modernize National Cadet Corps (NCC) operations. It addresses the challenges of scattered communication, manual record keeping, lack of transparency, and difficulty in accessing learning and administrative resources.

The platform provides a unified, secure, and scalable solution for **cadets, ANOs, and administrators**.

---

## 🎯 Problem Statement

NCC operations lack a centralized digital platform, leading to:

* Scattered communication
* Manual and inefficient record handling
* Limited transparency in administrative processes
* Difficulty in accessing training, learning, and official resources

**NCC-Nexus** aims to solve these issues by providing an integrated digital ecosystem.

---

## 🚀 Key Features

* 🔐 Secure JWT-based authentication
* 👥 Role-based access (Cadet / Admin / ANO)
* 📋 Digital attendance and cadet records
* 📢 Centralized notices and announcements
* 📚 NCC training and learning resources
* 📊 Admin dashboard for management & monitoring
* ☁️ Cloud-ready deployment

---

## 🛠 Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios
* React Router

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL
* Sequelize ORM

### Authentication

* JWT (JSON Web Token)

### Deployment

* AWS / Render / Vercel

### Testing & Dev Tools

* Postman
* GitHub
* Docker (optional)

---

## 📁 Project Folder Structure

```
ncc-nexus/
│
├── frontend/        # React frontend
├── backend/         # Node & Express backend
├── database/        # DB schema & seed files
├── docs/            # Documentation & diagrams
├── docker/          # Docker configuration
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js
* PostgreSQL
* Git

### Clone Repository

```bash
git clone https://github.com/your-username/ncc-nexus.git
cd ncc-nexus
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

> Make sure to configure `.env` files for both frontend and backend.

---

## 🔐 Authentication Flow

1. User logs in using credentials
2. Backend validates user and generates JWT
3. JWT is sent to frontend and stored securely
4. Protected routes are accessed using JWT middleware

---

## 📄 Documentation

* API documentation available in `docs/api-docs.md`
* System architecture in `docs/architecture.md`
* Database ER diagram in `docs/er-diagram.png`

---

## 🌱 Future Enhancements

* Mobile application support
* Role-based analytics dashboard
* Real-time notifications
* Attendance via QR code
* Performance and training analytics

---

## 👩‍💻 Contributors

* Harshita Pandey
* Lavanya Jain
* Ruchika Kohad
* Shami Dubey
* Shyam Patidar
