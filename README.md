# 🚛 Retorrent

Retorrent (**React + Torrent**) is a modern web UI and middleware layer that replaces the default Transmission interface.  
It provides a clean, responsive frontend with account-based authentication, role management, and notification features — designed for self-hosting environments like NAS or home servers.

---

## ✨ Features
- 🔑 **Authentication**: JWT-based login with multi-user support and role-based access
- 🖥 **Modern UI**: React-based, responsive torrent dashboard
- 🔔 **Notifications**: Email and PWA Webpush for torrent events
- 🔌 **Multi-client support**: Transmission first, qBittorrent (next)

---

## 📸 Screenshots
*(Coming soon – demo images of the dashboard UI)*

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Go
- Transmission RPC or qBittorrent Web API available

### Installation

**Clone and run locally**
```bash
git clone https://github.com/hojinzs/retorrent.git
cd retorrent
npm install
npm run dev
```

**Run With Docker**
1. Make sure Docker is installed.
2. Build and run the container:
```bash
docker build -t retorrent .
docker run -p 3000:3000 --env-file .env retorrent
```

**Docker Compose**
1. In the directory with `docker-compose.yml`, run:
```bash
docker-compose up --build
```
Refer to the docker-compose file for environment variables and configuration.

---

## 🗂️ Directory Structure
```
├── server/         # Go backend & Transmission integration
│   ├── internal/
│   ├── migrations/
│   └── main.go
├── web/            # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Go, Transmission RPC integration
- **Database**: SQLite (PocketBase)
- **Authentication**: JWT-based
- **DevOps**: Docker, Docker Compose

---

## 🛣 Roadmap

- JWT authentication
- Torrent dashboard (React)
- Role management (admin / user)
- Email notifications
- PWA Webpush

See the Issues for more.

---

## 🤝 Contributing
Contributions are welcome!

1.	Fork the repo
2.	Create a feature branch (git checkout -b feature/your-feature)
3.	Commit changes (git commit -m 'Add new feature')
4.	Push to branch (git push origin feature/your-feature)
5.	Open a Pull Request

Please check the CONTRIBUTING.md (coming soon) for details.

---

## 📜 License

This project is licensed under the MIT License.

---

## 📬 Community & Contact

- Issues & feature requests: GitHub Issues
- Maintainer: [@hojinzs](https://github.com/hojinzs)