# CineVerse Technical Architecture & Deep Dive

This document details the internal design, database structures, APIs, and data engineering pipelines of CineVerse.

---

## 🗄️ Database Architecture

CineVerse uses a local PostgreSQL 15 database hosted inside a Docker container. The schema is optimized for fast read-heavy search operations and complex relational queries.

### 1. `movies` Table
Stores raw movie metadata. Columns like `genres` and `production_companies` use the **JSONB** data type to store nested lists and structures efficiently, allowing complex indexing and filtering without extensive join tables.

| Column Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Unique TMDB identifier |
| `title` | `TEXT` | | Movie Title |
| `original_title` | `TEXT` | | Original Title (in original language) |
| `overview` | `TEXT` | | Full plot synopsis |
| `tagline` | `TEXT` | | Short marketing tagline |
| `status` | `TEXT` | | Release status (e.g. Released, In Production) |
| `adult` | `BOOLEAN` | | Whether movie has mature content |
| `video` | `BOOLEAN` | | True if this is a video asset |
| `release_date` | `DATE` | | Release Date |
| `runtime` | `INTEGER` | | Movie runtime in minutes |
| `budget` | `BIGINT` | | Production budget in USD |
| `revenue` | `BIGINT` | | Box office revenue in USD |
| `popularity` | `DOUBLE PRECISION` | | TMDB popularity rating |
| `vote_average` | `DOUBLE PRECISION` | | Average rating out of 10 |
| `vote_count` | `INTEGER` | | Total number of rating votes |
| `original_language` | `TEXT` | | ISO 639-1 language code |
| `homepage` | `TEXT` | | Official website URL |
| `imdb_id` | `TEXT` | | Unique IMDb identifier |
| `poster_path` | `TEXT` | | CDN path to movie poster image |
| `backdrop_path` | `TEXT` | | CDN path to backdrop banner image |
| `genres` | `JSONB` | | Nested array: `[{"id": 28, "name": "Action"}, ...]` |
| `production_companies`| `JSONB` | | List of production studios |
| `production_countries`| `JSONB` | | Production locations |
| `spoken_languages` | `JSONB` | | Languages spoken in the film |
| `origin_country` | `JSONB` | | Countries of origin |
| `belongs_to_collection`| `JSONB` | | collection details if movie belongs to a franchise |

### 2. `watch_providers` Table
Stores information about where movies can be streamed, rented, or bought. It maintains a foreign key relationship with the `movies` table.

| Column Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Auto-incrementing identifier |
| `movie_id` | `INTEGER` | `REFERENCES movies(id)` | Foreign key referencing `movies.id` |
| `provider_id` | `INTEGER` | | TMDB unique provider identifier |
| `provider_name` | `TEXT` | | Streaming service name (e.g. Netflix, Prime) |
| `logo_path` | `TEXT` | | CDN path to streaming service logo image |
| `provider_type` | `TEXT` | | Provider type: `flatrate`, `rent`, `buy`, `ads` |
| `country` | `TEXT` | | ISO-3166-1 country code (e.g., US, IN) |
| `display_priority` | `INTEGER` | | Sort priority when displaying providers |

---

## 📥 Data Ingestion Pipeline

CineVerse is equipped with high-throughput scraping utilities located in `backend/scrapers/` to fetch data from TMDB.

### Resumable Chunk Architecture
Since scraping millions of movies takes time and requires handling potential network interruptions or API limits, the scrapers divide work into small **chunks** (default size: `500` or `1000` records).
- **State Persistence**: For every completed chunk, a marker file is written into `backend/data/movie_details/` or `backend/data/watch_provider_progress/` named `chunk_{index}`.
- **Auto-Resume**: When a scraper starts, it reads these directory marker files to identify the highest processed index and immediately resumes scraping from that point, allowing safe stops and starts without data loss or duplicate API calls.

### Concurrency and Speed Tuning
- **Async I/O**: The details and watch provider scrapers use Python's `asyncio` and `aiohttp` to perform up to **40-50 simultaneous API queries**.
- **Batch Commits**: Instead of writing records to PostgreSQL one-by-one, they are accumulated and written to the database using `psycopg2.extras.execute_batch` (batch sizes of `1000`), ensuring minimal write latency.

---

## 🔌 API Server Endpoints

The backend API server (`backend/api/api_server.py`) is written in Flask and listens on port `5000`. It is fully configured with CORS middleware so it can be consumed from any origin.

### Endpoint Reference
- **GET** `/api/trending/all/week`
  - Fetches the top 20 trending movies ordered by popularity.
- **GET** `/api/movie/top_rated`
  - Fetches top 20 rated movies (having at least 10 votes) ordered by average vote rating.
- **GET** `/api/discover/tv`
  - A discover route for showcase items.
- **GET** `/api/discover/movie?with_genres={genre_id}`
  - Discovers movies. If `with_genres` is provided, executes a Postgres JSONB query (`WHERE genres @> '[{"id": 28}]'`) to find matching genres.
- **GET** `/api/search/movie?query={text}`
  - Performs case-insensitive wildcard pattern matching against both original and translated titles.
- **GET** `/api/movie/{movie_id}`
  - Fetches complete detail for a single movie.
- **GET** `/api/movie/{movie_id}/credits`
  - Returns mock credits (director and top cast) for page rendering.
- **GET** `/api/movie/{movie_id}/videos`
  - Returns movie trailer YouTube link details.
- **GET** `/api/movie/{movie_id}/similar`
  - Returns similar recommended movies.
- **GET** `/api/movie/{movie_id}/watch/providers`
  - Returns local stream, rent, and buy providers parsed by region (e.g. US, IN).

---

## 💻 Frontend Design

The frontend (`src/`) is built on **React 19**, styled using **Vanilla CSS** + **TailwindCSS**, and bundled with **Vite**.

### Core Architecture Components:
1. **Routing (`src/App.tsx`)**:
   Uses `react-router-dom` to coordinate routes:
   - `/`: Explore home page.
   - `/movie/:id`: Movie details view.
   - `/watchlist`: Premium watchlist manager page.
   - `/profile`: User Profile control screen.
   - `/login`: User authentication view.
2. **State Management & Caching**:
   Utilizes `@tanstack/react-query` to fetch API data and manage query states automatically. Requests are cached in-memory and re-validated in the background, making the UI feel incredibly responsive and smooth.
3. **HTTP Client (`src/services/tmdb.ts`)**:
   Configured with Axios pointing to `http://localhost:5000/api`. The Axios `combineURLs` utility ensures all relative routes cleanly resolve under `/api/` on port 5000.
4. **Watchlist Persistence**:
   The watchlist is managed locally using browser `localStorage` under `cineverse_watchlist` so user lists are preserved persistently across restarts, independent of server sessions.

---

## 🔧 Operations & Troubleshooting

### 1. CORS Problems
If the console prints a CORS blocked warning:
- Ensure `flask-cors` is installed and registered inside `api_server.py`:
  ```python
  from flask_cors import CORS
  CORS(app, resources={r"/*": {"origins": "*"}})
  ```

### 2. Docker DB Connection Fails
If Flask throws a database connection error:
- Verify the docker container is running: `docker ps`
- Test container logs: `docker logs movie-postgres`
- Ensure port `5432` is not occupied by a host PostgreSQL server. If it is, change the binding port (e.g., `-p 5433:5432`) and update `DB_CONFIG` inside the Flask and scraper scripts.
