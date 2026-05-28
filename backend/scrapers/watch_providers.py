import aiohttp
import asyncio
import psycopg2
from psycopg2.extras import execute_batch
from tqdm import tqdm
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ================= CONFIG =================
API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTVmODk3NThmNDYwMGNhYWNiYTRiYmYwM2RmZGZlNyIsIm5iZiI6MTc3NTU0OTI4My4zMDcwMDAyLCJzdWIiOiI2OWQ0YmI2MzNmYmEzNTE1NjkwNzE0YWMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.CJM56DpgqmHARbPALNX-gler3ZtCgOHPGW0fBM-jQoc"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "accept": "application/json"
}

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Admin123@127.0.0.1:5432/movies_db")

CONCURRENCY = 50
BATCH_SIZE = 1000
CHUNK_SIZE = 1000

# Resolve paths relative to this script so they work from any working directory
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(_SCRIPT_DIR, "..", "data")
PROGRESS_DIR = os.path.join(_DATA_DIR, "watch_provider_progress")
os.makedirs(PROGRESS_DIR, exist_ok=True)
# ==========================================


# ================= DB =================
def create_table(conn):
    query = """
    CREATE TABLE IF NOT EXISTS watch_providers (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        provider_id INTEGER,
        provider_name TEXT,
        logo_path TEXT,
        provider_type TEXT,
        country TEXT,
        display_priority INTEGER
    );
    """
    with conn.cursor() as cursor:
        cursor.execute(query)
    conn.commit()


def get_movie_ids(conn):
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM movies")
        return [row[0] for row in cursor.fetchall()]


def get_processed_movie_ids(conn):
    with conn.cursor() as cursor:
        cursor.execute("SELECT DISTINCT movie_id FROM watch_providers")
        return {row[0] for row in cursor.fetchall()}


def insert_watch_providers(conn, data):
    if not data:
        return

    query = """
    INSERT INTO watch_providers (
        movie_id,
        provider_id,
        provider_name,
        logo_path,
        provider_type,
        country,
        display_priority
    )
    VALUES (
        %(movie_id)s,
        %(provider_id)s,
        %(provider_name)s,
        %(logo_path)s,
        %(provider_type)s,
        %(country)s,
        %(display_priority)s
    )
    ON CONFLICT DO NOTHING;
    """

    with conn.cursor() as cursor:
        execute_batch(cursor, query, data, page_size=100)

    conn.commit()
# =======================================


# ================= RESUME =================
def get_last_chunk():
    files = os.listdir(PROGRESS_DIR)

    indexes = []
    for f in files:
        if f.startswith("chunk_"):
            try:
                indexes.append(int(f.split("_")[1]))
            except:
                pass

    return max(indexes) + 1 if indexes else 0


def mark_chunk_done(idx):
    open(f"{PROGRESS_DIR}/chunk_{idx}", "w").close()
# ==========================================


# ================= API =================
async def fetch_watch_providers(session, movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers"

    for _ in range(3):
        try:
            async with session.get(url, headers=HEADERS) as res:

                if res.status == 200:
                    data = await res.json()
                    results = []

                    for country, details in data.get("results", {}).items():
                        for ptype in ["flatrate", "rent", "buy", "ads"]:
                            for p in details.get(ptype, []):
                                results.append({
                                    "movie_id": movie_id,
                                    "provider_id": p.get("provider_id"),
                                    "provider_name": p.get("provider_name"),
                                    "logo_path": p.get("logo_path"),
                                    "provider_type": ptype,
                                    "country": country,
                                    "display_priority": p.get("display_priority")
                                })

                    return results

                elif res.status == 429:
                    await asyncio.sleep(2)

        except:
            await asyncio.sleep(1)

    return []
# ==========================================


# ================= PROCESS =================
async def process_chunk(conn, chunk, chunk_idx):
    connector = aiohttp.TCPConnector(limit=CONCURRENCY)

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_watch_providers(session, mid) for mid in chunk]

        batch = []

        for task in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc=f"Chunk {chunk_idx}"):
            result = await task

            if result:
                batch.extend(result)

            if len(batch) >= BATCH_SIZE:
                insert_watch_providers(conn, batch)
                batch = []

        if batch:
            insert_watch_providers(conn, batch)
# ==========================================


# ================= MAIN =================
async def main():
    print("🔌 Connecting to DB...")
    conn = psycopg2.connect(DATABASE_URL)

    print("📦 Creating table...")
    create_table(conn)

    print("🎬 Fetching movie IDs...")
    all_ids = get_movie_ids(conn)

    print("🔍 Checking already processed movies...")
    processed_ids = get_processed_movie_ids(conn)

    remaining_ids = [mid for mid in all_ids if mid not in processed_ids]

    print(f"Total movies: {len(all_ids)}")
    print(f"Already processed: {len(processed_ids)}")
    print(f"Remaining: {len(remaining_ids)}")

    # optional limit
    limit = input("Enter limit (press Enter for all): ").strip()
    if limit:
        remaining_ids = remaining_ids[:int(limit)]

    start_chunk = get_last_chunk()
    print(f"🔁 Resuming from chunk index: {start_chunk}")

    for i in range(start_chunk, len(remaining_ids), CHUNK_SIZE):
        chunk = remaining_ids[i:i + CHUNK_SIZE]

        print(f"\n🚀 Processing {i} → {i + len(chunk)}")

        try:
            await process_chunk(conn, chunk, i)
            mark_chunk_done(i)
        except Exception as e:
            print(f"❌ Error at chunk {i}: {e}")
            print("⛔ Stopping — resume later")
            break

    conn.close()
    print("\n🎉 DONE!")


if __name__ == "__main__":
    asyncio.run(main())