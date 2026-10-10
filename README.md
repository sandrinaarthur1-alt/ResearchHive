# ResearchHive 🔎

**Discover research. Organize ideas. Keep exploring.**

ResearchHive is a research discovery platform that helps users find academic papers by topic, organize research projects, and save relevant papers in one place.

> Built to make exploring academic research a little more organized.

## ✨ Features

- **Research Projects** — Create, search, view, and delete projects.
- **Paper Discovery** — Search academic publications by topic using OpenAlex.
- **Saved Papers** — Keep relevant papers organized under research projects.
- **Local Storage** — Store projects and saved papers in an SQLite database.
- **Dashboard** — View your projects and track saved papers.

## 🛠️ Built With

| Frontend | Backend | Data |
| --- | --- | --- |
| HTML | Node.js | SQLite |
| CSS | Express.js | OpenAlex API |
| JavaScript | better-sqlite3 | |

## 📁 Project Structure

```text
ResearchHive/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A web browser

### 1. Clone the repository

```bash
git clone https://github.com/sandrinaarthur1-alt/ResearchHive.git
cd ResearchHive
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Start the backend

```bash
npm start
```

The API runs locally at `http://localhost:5000`.

### 4. Open the frontend

Open `frontend/index.html` in your browser, or use the VS Code Live Server extension.

Keep the backend running while using the application.

## 💾 Data Storage

ResearchHive uses SQLite to store research projects and saved papers locally. The database is created by the backend when needed.

Local database files are excluded from Git, so cloning the repository starts with a separate local database.

## 🗺️ Roadmap

- [x] Research project management
- [x] Academic paper search
- [x] Save papers to projects
- [ ] AI-assisted paper summaries
- [ ] Research gap exploration
- [ ] Research planning tools
- [ ] Public deployment

## 📚 Research Data

Paper discovery is powered by [OpenAlex](https://openalex.org/), an open catalog of scholarly works.

## 📌 Project Status

**In development.** ResearchHive is an evolving project, with more research and organization features planned.

---

*Built as a learning project exploring web development and academic research tools.*