import requests
import gzip
import json
import csv
from datetime import datetime, timedelta
from io import BytesIO

# -------- CONFIG --------
BASE_URL = "https://files.tmdb.org/p/exports"
FILE_PREFIX = "movie_ids"   # change if needed
OUTPUT_FILE = "movie_ids.csv"
# ------------------------

def get_latest_file():
    """Try today, fallback to last 2 days"""
    for i in range(3):
        date = datetime.utcnow() - timedelta(days=i)
        filename = date.strftime(f"{FILE_PREFIX}_%m_%d_%Y.json.gz")
        url = f"{BASE_URL}/{filename}"

        print(f"Trying: {url}")
        res = requests.get(url)

        if res.status_code == 200:
            print(f"✅ Found file: {filename}")
            return BytesIO(res.content)

    raise Exception("❌ No recent export file found!")


def convert_to_csv(file_obj):
    with gzip.open(file_obj, 'rt', encoding='utf-8') as f, \
         open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as csvfile:

        writer = csv.writer(csvfile)

        # Header (adjust fields if needed)
        writer.writerow(["id", "adult", "original_title", "popularity"])

        count = 0

        for line in f:
            data = json.loads(line)

            writer.writerow([
                data.get("id"),
                data.get("adult"),
                data.get("original_title"),
                data.get("popularity")
            ])

            count += 1

        print(f"✅ CSV created: {OUTPUT_FILE} ({count} rows)")


def main():
    file_obj = get_latest_file()
    convert_to_csv(file_obj)


if __name__ == "__main__":
    main()