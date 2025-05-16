# Jade's Clothing 👗

**Jade's Clothing** is a full-stack e-commerce platform built to showcase and sell beautiful Nigerian traditional and contemporary attire. It's structured for growth and modular development.

---

## 🚀 Tech Stack

- **Backend Framework:** NexusJS
- **Frontend Styling:** Bootstrap 5
- **Runtime:** Node.js
- **Templating (optional):** EJS or modern JS frontend (TBD)
- **Database:** PostgreSQL (default), MongoDB (optional support)
- **Architecture:** Modular MVC with layered services

---

## 📁 Project Structure

```text
src/
├── config/         # App configs, DB configs
├── middlewares/    # Auth, error handling, logging
├── core/           # App startup, base services
├── controllers/    # Global controllers
├── models/         # Global models
├── views/          # Static pages or templating
├── modules/
│   └── product/
│       ├── controllers/    # Separated into api/admin
│       ├── routes/         # Separated into api/admin
│       ├── services/       # Business logic
│       └── models/         # Product.model.js
├── utils/          # Helper functions
└── index.js        # App entry point
```

---

## 🧠 Features (Planned)

- ✅ Modular structure (feature-based)
- 🛍️ Product management (admin & API)
- 👗 Category browsing (e.g. Ankara, Agbada)
- 🔐 Auth & role-based access
- 🛒 Cart & checkout flow
- 💼 Seller dashboards
- 📊 Admin analytics dashboard
- 🌍 Nigerian currency / shipping options

---

## 🔧 Development Setup

### Prerequisites

- Node.js >= 20.x
- PostgreSQL
- Git

### Installation

```bash
git clone https://github.com/nathius262/jades-clothing.git
cd jades-clothing
npm install
npm run dev
```

---

## ✅ Todo (Initial)

- [ ] Setup NexusJS server with modular routing
- [ ] Add PostgreSQL connection via `config/db.js`
- [ ] Implement Product module (CRUD, split API/Admin)
- [ ] Add Bootstrap to frontend views
- [ ] Setup authentication system
- [ ] Deploy to Vercel or Railway

---

## 📄 License

MIT License