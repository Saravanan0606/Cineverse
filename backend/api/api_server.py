from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import date

app = Flask(__name__)
# Enable CORS for all routes so the React frontend on 5173 can access it
CORS(app, resources={r"/*": {"origins": "*"}})

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "database": "movies_db",
    "user": "postgres",
    "password": "postgres"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def parse_movie_fields(movie):
    if not movie:
        return movie
    
    # Genres, production details etc. may be JSONB fields or stored as JSON strings.
    # We ensure they are parsed as native Python lists/dicts so they serialize cleanly as JSON.
    for field in ["genres", "production_companies", "production_countries", "spoken_languages", "origin_country", "belongs_to_collection"]:
        if field in movie and movie[field] is not None:
            if isinstance(movie[field], str):
                try:
                    movie[field] = json.loads(movie[field])
                except:
                    pass
    
    if "release_date" in movie and isinstance(movie["release_date"], (date,)):
        movie["release_date"] = movie["release_date"].isoformat()
        
    return movie

@app.route('/api/trending/all/week', methods=['GET'])
def get_trending():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM movies ORDER BY popularity DESC LIMIT 20;")
        movies = cur.fetchall()
        cur.close()
        conn.close()
        
        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/movie/top_rated', methods=['GET'])
def get_top_rated():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM movies WHERE vote_count > 10 ORDER BY vote_average DESC, popularity DESC LIMIT 20;")
        movies = cur.fetchall()
        cur.close()
        conn.close()
        
        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/discover/tv', methods=['GET'])
def get_discover_tv():
    # Placeholder for TV original rows — return popular movies
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM movies ORDER BY popularity DESC OFFSET 20 LIMIT 20;")
        movies = cur.fetchall()
        cur.close()
        conn.close()
        
        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/discover/movie', methods=['GET'])
def discover_movies():
    try:
        genre_id = request.args.get('with_genres')
        conn = get_db_connection()
        cur = conn.cursor()
        
        if genre_id:
            # Query JSONB array for genre containing ID
            # genres column is a JSONB array: [{"id": 28, "name": "Action"}]
            # In SQL: WHERE genres @> '[{"id": 28}]'
            query_json = json.dumps([{"id": int(genre_id)}])
            cur.execute(
                "SELECT * FROM movies WHERE genres @> %s::jsonb ORDER BY popularity DESC LIMIT 20;",
                (query_json,)
            )
        else:
            cur.execute("SELECT * FROM movies ORDER BY popularity DESC LIMIT 20;")
            
        movies = cur.fetchall()
        cur.close()
        conn.close()
        
        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/search/movie', methods=['GET'])
def search_movies():
    try:
        query = request.args.get('query', '')
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM movies WHERE title ILIKE %s OR original_title ILIKE %s ORDER BY popularity DESC LIMIT 30;",
            (f"%{query}%", f"%{query}%")
        )
        movies = cur.fetchall()
        cur.close()
        conn.close()
        
        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/movie/<int:movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM movies WHERE id = %s;", (movie_id,))
        movie = cur.fetchone()
        cur.close()
        conn.close()
        
        if not movie:
            return jsonify({"error": "Movie not found"}), 404
            
        return jsonify(parse_movie_fields(dict(movie)))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/movie/<int:movie_id>/credits', methods=['GET'])
def get_movie_credits(movie_id):
    # Mocking credit structure since credits are not stored in the flat SQL movies table
    return jsonify({
        "id": movie_id,
        "cast": [
            {"id": 101, "name": "Cillian Murphy", "character": "Lead Actor", "profile_path": None, "cast_id": 1},
            {"id": 102, "name": "Emily Blunt", "character": "Supporting Actress", "profile_path": None, "cast_id": 2},
            {"id": 103, "name": "Robert Downey Jr.", "character": "Antagonist", "profile_path": None, "cast_id": 3},
            {"id": 104, "name": "Matt Damon", "character": "General", "profile_path": None, "cast_id": 4}
        ],
        "crew": [
            {"id": 201, "name": "Christopher Nolan", "job": "Director"}
        ]
    })

@app.route('/api/movie/<int:movie_id>/videos', methods=['GET'])
def get_movie_videos(movie_id):
    # Mocking trailer structure
    return jsonify({
        "id": movie_id,
        "results": [
            {
                "iso_639_1": "en",
                "iso_3166_1": "US",
                "name": "Official Trailer",
                "key": "yLY20sV553c",  # standard trailer id example
                "site": "YouTube",
                "size": 1080,
                "type": "Trailer",
                "official": True,
                "published_at": "2023-01-01T00:00:00.000Z",
                "id": "12345"
            }
        ]
    })

@app.route('/api/movie/<int:movie_id>/similar', methods=['GET'])
def get_movie_similar(movie_id):
    # Select popular movies excluding the current one as similar recommendations
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM movies WHERE id != %s ORDER BY popularity DESC LIMIT 6;", (movie_id,))
        movies = cur.fetchall()
        cur.close()
        conn.close()
        
        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500

@app.route('/api/movie/<int:movie_id>/watch/providers', methods=['GET'])
def get_movie_watch_providers(movie_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if the watch_providers table exists first
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_name = 'watch_providers'
            );
        """)
        table_exists = cur.fetchone()['exists']
        
        if not table_exists:
            cur.close()
            conn.close()
            return jsonify({"results": {}})
            
        cur.execute("SELECT * FROM watch_providers WHERE movie_id = %s;", (movie_id,))
        providers = cur.fetchall()
        cur.close()
        conn.close()
        
        flatrate = []
        rent = []
        buy = []
        
        for p in providers:
            p_dict = {
                "provider_id": p["provider_id"],
                "provider_name": p["provider_name"],
                "logo_path": p["logo_path"],
                "display_priority": p["display_priority"]
            }
            ptype = p["provider_type"]
            if ptype == "flatrate":
                flatrate.append(p_dict)
            elif ptype == "rent":
                rent.append(p_dict)
            elif ptype == "buy":
                buy.append(p_dict)
                
        # Respond matching the US/IN watch providers structure
        return jsonify({
            "id": movie_id,
            "results": {
                "US": {
                    "flatrate": flatrate,
                    "rent": rent,
                    "buy": buy
                }
            }
        })
    except Exception as e:
        return jsonify({"results": {}}), 200

if __name__ == '__main__':
    print("CineVerse Local Python API Server starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
