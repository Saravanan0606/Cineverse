import aiohttp
import asyncio
import csv
import getpass
import json
import os
import subprocess
import sys
import time
from typing import List, Optional

import psycopg2
from psycopg2.extras import execute_batch
from tqdm import tqdm

# =========================
# CONFIG
# =========================
API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTVmODk3NThmNDYwMGNhYWNiYTRiYmYwM2RmZGZlNyIsIm5iZiI6MTc3NTU0OTI4My4zMDcwMDAyLCJzdWIiOiI2OWQ0YmI2MzNmYmEzNTE1NjkwNzE0YWMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.CJM56DpgqmHARbPALNX-gler3ZtCgOHPGW0fBM-jQoc"

BASE_URL = "https://api.themoviedb.org/3/movie"
HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "accept": "application/json",
}

CONTAINER_NAME = "movie-postgres"
DB_NAME = "movies_db"
DB_USER = "postgres"
DB_PORT = 5432
POSTGRES_IMAGE = "postgres:15"

CHUNK_SIZE = 500
CONCURRENCY = 40
OUTPUT_DIR = "movie_details"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# =========================
# GENERAL UTILS
# =========================
def run_command(cmd: str, capture_output: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd,
        shell=True,
        text=True,
        capture_output=capture_output,
    )


def prompt_choice(prompt: str, valid_choices: List[str]) -> str:
    while True:
        value = input(prompt).strip().lower()
        if value in valid_choices:
            return value
        print(f"Please enter one of: {', '.join(valid_choices)}")


def prompt_int(prompt: str, min_value: int, max_value: int) -> int:
    while True:
        raw = input(prompt).strip()
        try:
            value = int(raw)
            if min_value <= value <= max_value:
                return value
        except ValueError:
            pass
        print(f"Enter a number between {min_value} and {max_value}.")


def clean(value):
    return value if value not in ("", None) else None


# =========================
# DOCKER HELPERS
# =========================
def check_docker_available():
    result = run_command("docker --version")
    if result.returncode != 0:
        print("Docker is not available. Please install/start Docker and try again.")
        sys.exit(1)


def container_exists() -> bool:
    result = run_command(
        f'docker ps -a --filter "name=^{CONTAINER_NAME}$" --format "{{{{.Names}}}}"'
    )
    return result.returncode == 0 and CONTAINER_NAME in result.stdout.splitlines()


def container_running() -> bool:
    result = run_command(
        f'docker ps --filter "name=^{CONTAINER_NAME}$" --format "{{{{.Names}}}}"'
    )
    return result.returncode == 0 and CONTAINER_NAME in result.stdout.splitlines()


def create_container(password: str):
    print(f"Creating Docker container '{CONTAINER_NAME}'...")
    cmd = (
        f'docker run -d '
        f'--name {CONTAINER_NAME} '
        f'-e POSTGRES_USER={DB_USER} '
        f'-e POSTGRES_PASSWORD="{password}" '
        f'-e POSTGRES_DB={DB_NAME} '
        f'-p {DB_PORT}:5432 '
        f'{POSTGRES_IMAGE}'
    )
    result = run_command(cmd)
    if result.returncode != 0:
        print("Failed to create container.")
        print(result.stderr)
        sys.exit(1)
    print("Container created.")


def start_container():
    print(f"Starting container '{CONTAINER_NAME}'...")
    result = run_command(f"docker start {CONTAINER_NAME}")
    if result.returncode != 0:
        print("Failed to start container.")
        print(result.stderr)
        sys.exit(1)
    print("Container started.")


def ensure_container(password: str):
    if not container_exists():
        print(f"Container '{CONTAINER_NAME}' was not found.")
        choice = prompt_choice("Create it now? (y/n): ", ["y", "n"])
        if choice == "n":
            print("Cannot continue without a PostgreSQL container.")
            sys.exit(0)
        create_container(password)
    elif not container_running():
        print(f"Container '{CONTAINER_NAME}' exists but is stopped.")
        choice = prompt_choice("Start it now? (y/n): ", ["y", "n"])
        if choice == "n":
            print("Cannot continue while the container is stopped.")
            sys.exit(0)
        start_container()
    else:
        print(f"Container '{CONTAINER_NAME}' is already running.")


# =========================
# DATABASE HELPERS
# =========================
def get_connection(password: str, retries: int = 20, delay_seconds: int = 2):
    print("Waiting for PostgreSQL to be ready...")
    last_error = None

    for _ in range(retries):
        try:
            conn = psycopg2.connect(
                host="127.0.0.1",
                database=DB_NAME,
                user=DB_USER,
                password=password,
                port=DB_PORT,
            )
            print("PostgreSQL is ready.")
            return conn
        except Exception as exc:
            last_error = exc
            time.sleep(delay_seconds)

    print("Could not connect to PostgreSQL.")
    print(last_error)
    sys.exit(1)


def create_table(conn):
    query = """
    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY,
        title TEXT,
        original_title TEXT,
        overview TEXT,
        tagline TEXT,
        status TEXT,
        adult BOOLEAN,
        video BOOLEAN,
        release_date DATE,
        runtime INTEGER,
        budget BIGINT,
        revenue BIGINT,
        popularity DOUBLE PRECISION,
        vote_average DOUBLE PRECISION,
        vote_count INTEGER,
        original_language TEXT,
        homepage TEXT,
        imdb_id TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        genres JSONB,
        production_companies JSONB,
        production_countries JSONB,
        spoken_languages JSONB,
        origin_country JSONB,
        belongs_to_collection JSONB
    );
    """
    with conn.cursor() as cursor:
        cursor.execute(query)
    conn.commit()
    print("Ensured table 'movies' exists.")


def has_table(conn) -> bool:
    query = """
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'movies'
    );
    """
    with conn.cursor() as cursor:
        cursor.execute(query)
        return cursor.fetchone()[0]


def has_data(conn) -> bool:
    if not has_table(conn):
        return False
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM movies;")
        count = cursor.fetchone()[0]
    return count > 0


def get_movie_count(conn) -> int:
    if not has_table(conn):
        return 0
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM movies;")
        return cursor.fetchone()[0]


def insert_movies(conn, movies: List[dict]):
    if not movies:
        return

    query = """
    INSERT INTO movies (
        id, title, original_title, overview, tagline, status,
        adult, video, release_date, runtime,
        budget, revenue, popularity,
        vote_average, vote_count,
        original_language, homepage, imdb_id,
        poster_path, backdrop_path,
        genres, production_companies, production_countries,
        spoken_languages, origin_country, belongs_to_collection
    )
    VALUES (
        %(id)s, %(title)s, %(original_title)s, %(overview)s, %(tagline)s, %(status)s,
        %(adult)s, %(video)s, %(release_date)s, %(runtime)s,
        %(budget)s, %(revenue)s, %(popularity)s,
        %(vote_average)s, %(vote_count)s,
        %(original_language)s, %(homepage)s, %(imdb_id)s,
        %(poster_path)s, %(backdrop_path)s,
        %(genres)s::jsonb, %(production_companies)s::jsonb, %(production_countries)s::jsonb,
        %(spoken_languages)s::jsonb, %(origin_country)s::jsonb, %(belongs_to_collection)s::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
    """

    with conn.cursor() as cursor:
        execute_batch(cursor, query, movies, page_size=100)
    conn.commit()


# =========================
# SQL IMPORT / EXPORT
# =========================
def find_sql_files() -> List[str]:
    return sorted([f for f in os.listdir() if f.lower().endswith(".sql")])


def choose_file(files: List[str], label: str) -> Optional[str]:
    if not files:
        return None

    print(f"\nAvailable {label} files:")
    for i, file_name in enumerate(files, start=1):
        print(f"{i}. {file_name}")

    index = prompt_int(f"Select {label} file: ", 1, len(files))
    return files[index - 1]


def import_sql(sql_file: str, password: str):
    print(f"Importing '{sql_file}' into PostgreSQL...")
    if os.name == "nt":
        cmd = (
            f'type "{sql_file}" | docker exec -i {CONTAINER_NAME} '
            f'psql -U {DB_USER} -d {DB_NAME}'
        )
    else:
        cmd = (
            f'cat "{sql_file}" | docker exec -i {CONTAINER_NAME} '
            f'psql -U {DB_USER} -d {DB_NAME}'
        )

    result = run_command(cmd)
    if result.returncode != 0:
        print("SQL import failed.")
        print(result.stderr)
        return

    print("SQL import completed.")


def export_sql(default_name: str = "movies_db.sql"):
    filename = input(f"Enter export file name [{default_name}]: ").strip()
    if not filename:
        filename = default_name

    print(f"Exporting database to '{filename}'...")
    cmd = (
        f'docker exec -t {CONTAINER_NAME} pg_dump -U {DB_USER} -h localhost {DB_NAME} > "{filename}"'
    )
    result = run_command(cmd)
    if result.returncode != 0:
        print("Export failed.")
        print(result.stderr)
        return

    print(f"Export completed: {filename}")


# =========================
# CSV HELPERS
# =========================
def choose_csv_file() -> str:
    files = sorted([f for f in os.listdir() if f.lower().endswith(".csv")])

    if not files:
        print("No CSV files found in the current directory.")
        sys.exit(0)

    print("\nAvailable CSV files:")
    for i, file_name in enumerate(files, start=1):
        print(f"{i}. {file_name}")

    index = prompt_int("Select CSV file: ", 1, len(files))
    return files[index - 1]


def read_movie_ids(csv_path: str) -> List[str]:
    ids = []

    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                movie_id = row.get("id")
                if movie_id:
                    ids.append(movie_id)
    except UnicodeDecodeError:
        print("UTF-8 read failed. Retrying with latin-1...")
        with open(csv_path, newline="", encoding="latin-1") as f:
            reader = csv.DictReader(f)
            for row in reader:
                movie_id = row.get("id")
                if movie_id:
                    ids.append(movie_id)

    return ids


# =========================
# RESUME HELPERS
# =========================
def get_marker_path(index: int) -> str:
    return os.path.join(OUTPUT_DIR, f"chunk_{index}")


def get_last_processed_index() -> int:
    indexes = []

    for file_name in os.listdir(OUTPUT_DIR):
        if file_name.startswith("chunk_"):
            try:
                indexes.append(int(file_name.split("_")[1]))
            except (IndexError, ValueError):
                pass

    return max(indexes) + CHUNK_SIZE if indexes else 0


def clear_resume_markers():
    removed = 0
    for file_name in os.listdir(OUTPUT_DIR):
        if file_name.startswith("chunk_"):
            try:
                os.remove(os.path.join(OUTPUT_DIR, file_name))
                removed += 1
            except OSError:
                pass
    print(f"Cleared {removed} resume marker(s).")


# =========================
# TMDB FETCHING
# =========================
async def fetch_movie(session: aiohttp.ClientSession, movie_id: str):
    url = f"{BASE_URL}/{movie_id}?language=en-US"

    for _ in range(3):
        try:
            async with session.get(url, headers=HEADERS) as response:
                if response.status == 200:
                    d = await response.json()
                    return {
                        "id": d.get("id"),
                        "title": d.get("title"),
                        "original_title": d.get("original_title"),
                        "overview": d.get("overview"),
                        "tagline": d.get("tagline"),
                        "status": d.get("status"),
                        "adult": d.get("adult"),
                        "video": d.get("video"),
                        "release_date": clean(d.get("release_date")),
                        "runtime": d.get("runtime"),
                        "budget": d.get("budget"),
                        "revenue": d.get("revenue"),
                        "popularity": d.get("popularity"),
                        "vote_average": d.get("vote_average"),
                        "vote_count": d.get("vote_count"),
                        "original_language": d.get("original_language"),
                        "homepage": clean(d.get("homepage")),
                        "imdb_id": clean(d.get("imdb_id")),
                        "poster_path": d.get("poster_path"),
                        "backdrop_path": d.get("backdrop_path"),
                        "genres": json.dumps(d.get("genres", [])),
                        "production_companies": json.dumps(d.get("production_companies", [])),
                        "production_countries": json.dumps(d.get("production_countries", [])),
                        "spoken_languages": json.dumps(d.get("spoken_languages", [])),
                        "origin_country": json.dumps(d.get("origin_country", [])),
                        "belongs_to_collection": json.dumps(d.get("belongs_to_collection")),
                    }

                if response.status == 429:
                    await asyncio.sleep(2)
                else:
                    return None

        except Exception:
            await asyncio.sleep(1)

    return None


async def process_chunk(chunk: List[str], chunk_index: int) -> List[dict]:
    results = []
    connector = aiohttp.TCPConnector(limit=CONCURRENCY)

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_movie(session, movie_id) for movie_id in chunk]

        for task in tqdm(
            asyncio.as_completed(tasks),
            total=len(tasks),
            desc=f"Chunk {chunk_index}",
        ):
            result = await task
            if result:
                results.append(result)

    return results


# =========================
# SCRAPING FLOW
# =========================
async def scrape_and_insert(conn):
    csv_file = choose_csv_file()
    movie_ids = read_movie_ids(csv_file)

    if not movie_ids:
        print("No movie IDs found in the selected CSV.")
        return

    print(f"Total IDs found: {len(movie_ids)}")

    start_index = get_last_processed_index()
    if start_index > 0:
        print(f"Resume markers found. Next chunk starts from index {start_index}.")
        choice = prompt_choice("Resume from there? (y/n): ", ["y", "n"])
        if choice == "n":
            reset = prompt_choice("Clear old resume markers and start from 0? (y/n): ", ["y", "n"])
            if reset == "y":
                clear_resume_markers()
                start_index = 0
            else:
                print("Keeping existing markers. Returning to menu.")
                return

    for i in range(start_index, len(movie_ids), CHUNK_SIZE):
        chunk = movie_ids[i:i + CHUNK_SIZE]
        print(f"\nProcessing IDs {i} -> {i + len(chunk)}")

        results = await process_chunk(chunk, i)

        try:
            insert_movies(conn, results)
            with open(get_marker_path(i), "w", encoding="utf-8") as f:
                f.write("done")
            print(f"Inserted {len(results)} row(s) for chunk starting at {i}.")
        except Exception as exc:
            print(f"Insert failed for chunk starting at {i}.")
            print(exc)
            print("Stopping here so you can resume later.")
            return

    print("Scraping completed.")


# =========================
# MENU
# =========================
def show_menu():
    print("\n========== MOVIE DB TOOL ==========")
    print("1. Import SQL dump")
    print("2. Export DB to SQL")
    print("3. Start scraping and insert into DB")
    print("4. Show DB row count")
    print("5. Exit")
    return prompt_choice("Choose option: ", ["1", "2", "3", "4", "5"])


# =========================
# MAIN
# =========================
async def main():
    check_docker_available()

    if API_TOKEN == "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTVmODk3NThmNDYwMGNhYWNiYTRiYmYwM2RmZGZlNyIsIm5iZiI6MTc3NTU0OTI4My4zMDcwMDAyLCJzdWIiOiI2OWQ0YmI2MzNmYmEzNTE1NjkwNzE0YWMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.CJM56DpgqmHARbPALNX-gler3ZtCgOHPGW0fBM-jQoc":
        print("Please update API_TOKEN in the script before scraping.")

    password = getpass.getpass("Enter Postgres password for the container: ").strip()
    if not password:
        print("Password cannot be empty.")
        return

    ensure_container(password)

    conn = get_connection(password)
    create_table(conn)

    while True:
        choice = show_menu()

        if choice == "1":
            sql_files = find_sql_files()
            if not sql_files:
                print("No .sql files found in the current directory.")
                continue

            if has_data(conn):
                current_count = get_movie_count(conn)
                print(f"The DB already contains {current_count} row(s).")
                proceed = prompt_choice("Import anyway? This may duplicate/overwrite depending on SQL. (y/n): ", ["y", "n"])
                if proceed == "n":
                    continue

            selected_sql = choose_file(sql_files, "SQL")
            import_sql(selected_sql, password)

            conn.close()
            conn = get_connection(password)
            create_table(conn)

        elif choice == "2":
            if has_data(conn):
                print(f"Current DB row count: {get_movie_count(conn)}")
                export_sql()
            else:
                print("No data found in the movies table. Nothing to export.")

        elif choice == "3":
            await scrape_and_insert(conn)

        elif choice == "4":
            print(f"Movies row count: {get_movie_count(conn)}")

        elif choice == "5":
            print("Exiting...")
            break

    conn.close()


if __name__ == "__main__":
    asyncio.run(main())