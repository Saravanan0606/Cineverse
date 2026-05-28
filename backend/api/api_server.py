from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import date
import os
from functools import wraps
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash

try:
    from dotenv import load_dotenv
    # Load .env from the project root or current working directory
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
# Enable CORS for all routes so the React frontend on 5173 can access it
CORS(app, resources={r"/*": {"origins": "*"}})

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Admin123@127.0.0.1:5432/movies_db")

SECRET_KEY = os.environ.get("SECRET_KEY", "cineverse-super-secret-key-12345")
serializer = URLSafeTimedSerializer(SECRET_KEY)

def generate_auth_token(user_id):
    return serializer.dumps({"user_id": str(user_id)})

def verify_auth_token(token):
    try:
        data = serializer.loads(token, max_age=86400 * 30)  # Valid for 30 days
        return data["user_id"]
    except Exception:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401
            
        user_id = verify_auth_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_db_tables():
    print("[DB] Ensuring all auth, profile, and watchlist database tables exist...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file_path = os.path.abspath(os.path.join(script_dir, "..", "database", "account_tables.sql"))
    try:
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql_queries = f.read()
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(sql_queries)
        conn.commit()
        conn.close()
        print("[DB] Database tables ensured successfully.")
    except Exception as e:
        print(f"[DB] Error initializing database tables: {e}")

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
    import requests
    try:
        api_key = os.environ.get("TMDB_API_KEY", "a15f89758f4600caacba4bbf03dfdfe7")
        url = f"https://api.themoviedb.org/3/movie/{movie_id}/videos"
        params = {
            "api_key": api_key,
            "language": "en-US"
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            # If TMDB has a valid non-empty list of video results, return it
            if data.get("results"):
                return jsonify(data)
    except Exception:
        pass

    # High-reliability active fallback (Interstellar Official Trailer - zSWdZAIBOBY)
    return jsonify({
        "id": movie_id,
        "results": [
            {
                "iso_639_1": "en",
                "iso_3166_1": "US",
                "name": "Official Trailer (Fallback)",
                "key": "zSWdZAIBOBY",
                "site": "YouTube",
                "size": 1080,
                "type": "Trailer",
                "official": True,
                "published_at": "2023-01-01T00:00:00.000Z",
                "id": "fallback-id"
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

# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        username = data.get("username", "").strip()

        if not email or not password or not username:
            return jsonify({"error": "Email, password, and username are required"}), 400

        password_hash = generate_password_hash(password)

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "User with this email already exists"}), 400

        cur.execute("SELECT id FROM profiles WHERE username = %s;", (username,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Username is already taken"}), 400

        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id;",
            (email, password_hash)
        )
        user_id = cur.fetchone()["id"]

        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}&backgroundColor=b6e3f4"
        cur.execute(
            "INSERT INTO profiles (user_id, username, avatar_url) VALUES (%s, %s, %s);",
            (user_id, username, avatar_url)
        )

        conn.commit()
        cur.close()
        conn.close()

        token = generate_auth_token(user_id)

        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "username": username,
                "avatar_url": avatar_url
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id, password_hash FROM users WHERE email = %s;", (email,))
        user_row = cur.fetchone()

        if not user_row or not check_password_hash(user_row["password_hash"], password):
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid email or password"}), 401

        user_id = user_row["id"]

        cur.execute("SELECT username, full_name, avatar_url, bio, preferences FROM profiles WHERE user_id = %s;", (user_id,))
        profile_row = cur.fetchone()

        cur.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s;", (user_id,))
        conn.commit()

        cur.close()
        conn.close()

        token = generate_auth_token(user_id)

        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "username": profile_row["username"] if profile_row else "",
                "full_name": profile_row["full_name"] if profile_row else None,
                "avatar_url": profile_row["avatar_url"] if profile_row else "",
                "bio": profile_row["bio"] if profile_row else None,
                "preferences": profile_row["preferences"] if profile_row else {}
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# USER PROFILE ENDPOINTS
# ==========================================

@app.route('/api/user/profile', methods=['GET'])
@require_auth
def get_profile():
    try:
        user_id = request.user_id
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT email FROM users WHERE id = %s;", (user_id,))
        user_row = cur.fetchone()

        if not user_row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        cur.execute("SELECT username, full_name, avatar_url, bio, preferences FROM profiles WHERE user_id = %s;", (user_id,))
        profile_row = cur.fetchone()

        cur.close()
        conn.close()

        return jsonify({
            "id": user_id,
            "email": user_row["email"],
            "username": profile_row["username"] if profile_row else "",
            "full_name": profile_row["full_name"] if profile_row else None,
            "avatar_url": profile_row["avatar_url"] if profile_row else "",
            "bio": profile_row["bio"] if profile_row else None,
            "preferences": profile_row["preferences"] if profile_row else {}
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/user/profile/update', methods=['POST'])
@require_auth
def update_profile():
    try:
        user_id = request.user_id
        data = request.get_json() or {}

        username = data.get("username", "").strip()
        full_name = data.get("full_name", "").strip() or None
        avatar_url = data.get("avatar_url", "").strip() or None
        bio = data.get("bio", "").strip() or None
        preferences = data.get("preferences", {})

        if not username:
            return jsonify({"error": "Username is required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM profiles WHERE username = %s AND user_id != %s;", (username, user_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Username is already taken"}), 400

        cur.execute(
            """
            UPDATE profiles 
            SET username = %s, full_name = %s, avatar_url = %s, bio = %s, preferences = %s::jsonb, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s;
            """,
            (username, full_name, avatar_url, bio, json.dumps(preferences), user_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Profile updated successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# WATCHLIST ENDPOINTS
# ==========================================

@app.route('/api/watchlist', methods=['GET'])
@require_auth
def get_watchlist():
    try:
        user_id = request.user_id
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT m.* 
            FROM watchlists w
            JOIN movies m ON w.movie_id = m.id
            WHERE w.user_id = %s
            ORDER BY w.added_at DESC;
            """,
            (user_id,)
        )
        movies = cur.fetchall()
        cur.close()
        conn.close()

        results = [parse_movie_fields(dict(movie)) for movie in movies]
        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/watchlist/add', methods=['POST'])
@require_auth
def add_to_watchlist():
    try:
        user_id = request.user_id
        data = request.get_json() or {}
        movie_id = data.get("movie_id")

        if not movie_id:
            return jsonify({"error": "movie_id is required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM movies WHERE id = %s;", (movie_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Movie does not exist in our database"}), 404

        cur.execute(
            """
            INSERT INTO watchlists (user_id, movie_id) 
            VALUES (%s, %s)
            ON CONFLICT (user_id, movie_id) DO NOTHING;
            """,
            (user_id, movie_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Movie added to watchlist successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/watchlist/remove', methods=['POST'])
@require_auth
def remove_from_watchlist():
    try:
        user_id = request.user_id
        data = request.get_json() or {}
        movie_id = data.get("movie_id")

        if not movie_id:
            return jsonify({"error": "movie_id is required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "DELETE FROM watchlists WHERE user_id = %s AND movie_id = %s;",
            (user_id, movie_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Movie removed from watchlist successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/watchlist/check/<int:movie_id>', methods=['GET'])
@require_auth
def check_watchlist_status(movie_id):
    try:
        user_id = request.user_id
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT 1 FROM watchlists WHERE user_id = %s AND movie_id = %s;",
            (user_id, movie_id)
        )
        is_in = cur.fetchone() is not None

        cur.close()
        conn.close()

        return jsonify({"in_watchlist": is_in})

    except Exception as e:
        return jsonify({"in_watchlist": False})


@app.route('/api/watchlist/clear', methods=['POST'])
@require_auth
def clear_watchlist():
    try:
        user_id = request.user_id
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM watchlists WHERE user_id = %s;", (user_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Watchlist cleared successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db_tables()
    print("CineVerse Local Python API Server starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
