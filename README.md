# 🎬 CineVerse

CineVerse is a premium, high-performance local movie discovery and exploration application. It features a stunning, glassmorphic React + TypeScript frontend, a robust Flask + Python backend API, and a local PostgreSQL database running in Docker. The system maintains a local cache of over **1 million movies** scraped directly from the TMDB database, along with watch provider streaming information.

---

## 🏗️ System Architecture

CineVerse separates data ingestion, service delivery, and presentation layers for clean organization and high scalability:

```
                      ┌──────────────────────────────────────────────┐
                      │                 TMDB API                     │
                      └──────────────────────┬───────────────────────┘
                                             │ (Scrapes IDs/Metadata)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │              Python Scrapers                 │
                      │       (movie_scraper.py, watch_providers.py) │
                      └──────────────────────┬───────────────────────┘
                                             │ (Fast Batched Imports)
                                             ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ LOCAL SYSTEM                                                              │
│                                                                           │
│   ┌────────────────────────┐           ┌──────────────────────────────┐   │
│   │   Docker Container     │           │       Python Flask API       │   │
│   │    "movie-postgres"    ├──────────►│      (api_server.py:5000)     │   │
│   │   (PostgreSQL 15 DB)   │           │                              │   │
│   └────────────────────────┘           └──────────────┬───────────────┘   │
│                                                       │                   │
│                                                       │ (CORS Enabled)    │
│                                                       ▼                   │
│                                        ┌──────────────────────────────┐   │
│                                        │     React + Vite Frontend    │   │
│                                        │     (localhost:5173)         │   │
│                                        └──────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
movie-app/
├── backend/                  # Backend code and database assets
│   ├── api/                  # Python Flask REST API server
│   │   └── api_server.py     # Main API server entry point
│   ├── scrapers/             # Python scrapers & data processors
│   │   ├── movie_scraper.py  # Stage 1: Fetches TMDB daily movie ID exports
│   │   ├── movie_details.py  # Stage 2: Fetches movie details and saves to Postgres
│   │   └── watch_providers.py# Stage 3: Fetches watch providers for movies in Postgres
│   ├── database/             # PostgreSQL database schema and migrations
│   │   ├── account_tables.sql# Schema for user accounts (sessions/watchlist)
│   │   ├── movies_db.sql     # Database SQL export (1.2 GB local dump)
│   │   └── db_notes.txt      # Reference SQL commands and imports
│   ├── data/                 # Raw data directories (excluded from Git)
│   │   ├── movie_details/    # Scraper chunk progress markers for movie details
│   │   ├── watch_provider_progress/# Scraper chunk progress markers for providers
│   │   ├── movie_ids.csv     # Daily TMDB exported movie IDs
│   │   └── output.csv        # Temporary output CSV for scraped data
│   └── requirements.txt      # Python libraries & dependencies
│
├── docs/                     # Comprehensive project documentation
│   └── ARCHITECTURE.md       # Deeper system design, schemas, and pipeline guide
│
├── src/                      # React + TypeScript + Tailwind Frontend
│   ├── components/           # Reusable UI components (Navbar, Hero, Row, etc.)
│   ├── pages/                # Page views (Home, MovieDetails, Profile, Watchlist, Login)
│   ├── services/             # Axios and HTTP services connecting to local API
│   ├── hooks/                # Custom React Query fetching hooks
│   └── index.css             # Main styling with Tailwind directives
│
├── package.json              # Frontend Node package configuration
├── vite.config.ts            # Vite compiler configuration
├── tsconfig.json             # TypeScript compiler settings
└── .gitignore                # Rules for excluding large files & cache from Git
```

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed on your system:
- **Node.js** (v18.x or later) & **npm**
- **Python 3.10+** (with pip)
- **Docker Desktop** (with Docker Compose or Docker CLI running)

---

## 🚀 Getting Started

Follow these step-by-step instructions to get CineVerse up and running on your local machine:

### 1. Database Setup
Ensure Docker Desktop is open and running, then start the local PostgreSQL container.
The DB is run in a Docker container named `movie-postgres` utilizing port `5432`:

- **Credentials**:
  - **Host**: `127.0.0.1`
  - **Port**: `5432`
  - **Database**: `movies_db`
  - **User**: `postgres`
  - **Password**: `postgres`

If you are setting up the database for the first time, you can start the Postgres 15 docker container:
```bash
docker run -d --name movie-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=movies_db -p 5432:5432 postgres:15
```

If you have a database dump, you can import it:
```bash
cat backend/database/movies_db.sql | docker exec -i movie-postgres psql -U postgres -d movies_db
```

### 2. Backend API Setup
Install the Python dependencies and start the local Flask API server:

```bash
# Navigate to backend directory and install dependencies
cd backend
pip install -r requirements.txt

# Run the Flask API Server (listens on http://localhost:5000)
python api/api_server.py
```

### 3. Frontend App Setup
Open a separate terminal window at the project root, install the dependencies, and start the development server:

```bash
# Install frontend node modules
npm install

# Start Vite React development server (runs on http://localhost:5173)
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to explore CineVerse!

---

## 📥 Ingestion Pipeline & Scrapers

CineVerse uses a 3-stage python pipeline to gather details for over 1,000,000 movies from the TMDB API and store them locally.

Scrapers are located in `backend/scrapers/` and store progress markers in `backend/data/` so they are fully **resumable** in case of network disconnects or API rate limiting.

1. **Stage 1 (Get IDs)**: Run `python backend/scrapers/movie_scraper.py`. This downloads TMDB's daily export file and extracts movie IDs, popularity, and titles into a CSV file (`backend/data/movie_ids.csv`).
2. **Stage 2 (Get Movie Details)**: Run `python backend/scrapers/movie_details.py`. This script reads the movie IDs from the CSV and uses `asyncio`/`aiohttp` concurrency to fetch full metadata for each movie, saving it directly into the PostgreSQL container.
3. **Stage 3 (Get Watch Providers)**: Run `python backend/scrapers/watch_providers.py`. This reads all movie IDs from your local database and scrapes where the movies are streaming (Netflix, Prime, Disney+, etc.), saving this mapping into the `watch_providers` table.

For a deep-dive walkthrough of database schemas, pipeline tuning, and troubleshooting, read our **[Architecture Guide](file:///c:/Appu/Projects/movie-app/docs/ARCHITECTURE.md)**.
