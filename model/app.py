import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
import os
import json
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from datetime import datetime, date
import sqlite3
from recommender import SkincareRecommender
from chatbot import get_chatbot_response
from load_model import FastSkinAnalyzer
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

latest_routine = None
latest_detected_issue = None

def format_routine(routine):
    if not routine:
        return ""
    text = ""
    for k, v in routine.items():
        if isinstance(v, list):
            text += f"{k}: {', '.join(v)}\n"
    return text

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_SCRIPT_DIR, "skin_model2.keras")
NORMAL_EMBEDDINGS_FILE = os.path.join(_SCRIPT_DIR, "normal_embeddings.npy")
try:
    analyzer = FastSkinAnalyzer(MODEL_PATH, NORMAL_EMBEDDINGS_FILE)
    print(f"Successfully loaded FastSkinAnalyzer")
except Exception as e:
    print(f"Error loading FastSkinAnalyzer: {e}")
    analyzer = None

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

CATEGORIES = ['acne', 'blackheades', 'dark spots', 'normal', 'pores', 'wrinkles']

recommender = SkincareRecommender()

def prepare_image(image_bytes):
    img_size = 224
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image format.")

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (img_size, img_size))
    img = np.expand_dims(img, axis=0)

    return img

@app.route("/api/predict", methods=["POST"])
def predict():
    if analyzer is None:
        return jsonify({"success": False, "message": "ML Model not loaded."}), 500

    try:
        user_email = request.form.get("user_email", "")
        mode = request.form.get("mode", "skin") # "skin" or "face"
        skin_type = request.form.get("skin_type", "Normal")

        saved_paths = []

        if mode == "face":
            if not all(k in request.files for k in ['image_left', 'image_middle', 'image_right']):
                return jsonify({"success": False, "message": "Missing face images (left, middle, right)"}), 400
            for k in ['image_left', 'image_middle', 'image_right']:
                file = request.files[k]
                filename = secure_filename(f"{user_email}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{k}.png")
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                saved_paths.append(filepath)
        else:
            if 'image' not in request.files:
                return jsonify({"success": False, "message": "No image part in request"}), 400
            file = request.files['image']
            filename = secure_filename(f"{user_email}_{datetime.now().strftime('%Y%m%d%H%M%S')}_skin.png")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_paths.append(filepath)

        conn = get_db_connection()
        c = conn.cursor()
        
        # Ensure skin columns exist
        try:
            c.execute("ALTER TABLE schedule_metadata ADD COLUMN skin_day1_images TEXT DEFAULT '[]'")
            c.execute("ALTER TABLE schedule_metadata ADD COLUMN skin_current_images TEXT DEFAULT '[]'")
        except sqlite3.OperationalError:
            pass
            
        meta = c.execute("SELECT * FROM schedule_metadata WHERE user_email = ?", (user_email,)).fetchone()
        
        day1_paths = []
        if mode == "face":
            if meta and meta['day1_images']:
                try: day1_paths = json.loads(meta['day1_images'])
                except: pass
        else:
            if meta and meta['skin_day1_images']:
                try: day1_paths = json.loads(meta['skin_day1_images'])
                except: pass
        
        if not day1_paths or len(day1_paths) != len(saved_paths):
            day1_paths = saved_paths # First time scan or mode changed

        # Analyze
        if mode == "face":
            analysis = analyzer.analyze(day1_paths, saved_paths)
            detected_issue = analysis["class_name"]
            confidence = round(float(analysis["confidence"]) * 100, 2)
            improvement = analysis["improvement"]
            overall_health = analysis["health_score_new"]
            closeness = analysis.get("closeness_to_normal", overall_health)
            similarity = float(analysis.get("similarity", 0))
        else:
            analysis = analyzer.analyze_body_part(day1_paths[0], saved_paths[0])
            detected_issue = analysis["class_name"]
            confidence = round(float(analysis["confidence"]) * 100, 2)
            improvement = analysis["improvement"]
            overall_health = analysis["health_score_new"]
            closeness = analysis.get("closeness_to_normal", overall_health)
            similarity = float(analysis.get("similarity", 0))

        # Enforce Similarity Check if it's not the first scan
        is_first_scan = False
        if mode == "face":
            is_first_scan = (meta is None or not meta['day1_images'] or meta['day1_images'] == '[]')
        else:
            is_first_scan = (meta is None or not meta['skin_day1_images'] or meta['skin_day1_images'] == '[]')

        # The model's embeddings are highly sensitive to skin conditions. 
        # Clearing up massive acne will radically change the deep features, causing similarity drops.
        # Lowered threshold to 0.15 to prevent false rejections of the same person.
        if not is_first_scan and similarity < 0.15:
            return jsonify({
                "success": False, 
                "message": f"Similarity check failed ({round(similarity*100,2)}%). The scanned person does not match the original user."
            }), 400

        if detected_issue == 'normal':
            routine_issues = []
            detected_issue_display = "No critical issue detected (Normal Skin)"
            confidence_display = f"{confidence}%"
        else:
            routine_issues = [detected_issue]
            detected_issue_display = detected_issue.capitalize()
            if confidence < 35.0:
                confidence_display = f"{confidence}% (Low Confidence)"
            else:
                confidence_display = f"{confidence}%"

        routine = recommender.generate_routine(skin_type, routine_issues)

        global latest_routine, latest_detected_issue
        latest_routine = routine
        latest_detected_issue = detected_issue_display

        # Update DB if user_email is provided
        if user_email:
            total_scans = (meta['total_scans'] + 1) if meta else 1
            
            if mode == "face":
                day1_str = json.dumps(day1_paths)
                current_str = json.dumps(saved_paths)
                scan_img_path = saved_paths[1] if len(saved_paths) > 1 else saved_paths[0]
                filename = os.path.basename(scan_img_path)
                scan_image_url = f"http://localhost:5001/static/uploads/{filename}"
                
                if meta:
                    c.execute("""
                        UPDATE schedule_metadata 
                        SET total_scans = ?, day1_images = ?, current_images = ?, overall_health = ?, overall_improvement = ?, closeness_to_normal = ?, scan_image = ?
                        WHERE user_email = ?
                    """, (total_scans, day1_str, current_str, float(overall_health), float(improvement), float(closeness), scan_image_url, user_email))
                else:
                    c.execute("""
                        INSERT INTO schedule_metadata 
                        (user_email, total_scans, day1_images, current_images, overall_health, overall_improvement, closeness_to_normal, scan_image)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (user_email, 1, day1_str, current_str, float(overall_health), float(improvement), float(closeness), scan_image_url))
            else:
                skin_day1_str = json.dumps(day1_paths)
                skin_current_str = json.dumps(saved_paths)
                scan_img_path = saved_paths[1] if len(saved_paths) > 1 else saved_paths[0]
                filename = os.path.basename(scan_img_path)
                scan_image_url = f"http://localhost:5001/static/uploads/{filename}"
                if meta:
                    c.execute("""
                        UPDATE schedule_metadata 
                        SET total_scans = ?, skin_day1_images = ?, skin_current_images = ?, overall_health = ?, overall_improvement = ?, closeness_to_normal = ?, scan_image = ?
                        WHERE user_email = ?
                    """, (total_scans, skin_day1_str, skin_current_str, float(overall_health), float(improvement), float(closeness), scan_image_url, user_email))
                else:
                    c.execute("""
                        INSERT INTO schedule_metadata 
                        (user_email, total_scans, skin_day1_images, skin_current_images, overall_health, overall_improvement, closeness_to_normal, scan_image)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (user_email, 1, skin_day1_str, skin_current_str, float(overall_health), float(improvement), float(closeness), scan_image_url))
            conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "detected_issue": detected_issue_display,
            "confidence": confidence_display,
            "recommended_routine": routine,
            "overall_health": round(float(overall_health)*100, 2),
            "improvement": round(float(improvement)*100, 2),
            "closeness_to_normal": round(float(closeness)*100, 2),
            "similarity": round(float(analysis.get("similarity", 0))*100, 2),
            "is_first_scan": is_first_scan
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"success": True, "message": "AI Model Server is running!"})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    question = data.get('question')
    api_key = data.get('api_key')
    user_email = data.get('user_email')

    if not question:
        return jsonify({"success": False, "message": "No question provided"}), 400

    routine_str = ""
    detected_issue = ""

    if user_email:
        conn = get_db_connection()
        c = conn.cursor()
        meta = c.execute('SELECT scan_routine, disease FROM schedule_metadata WHERE user_email = ?', (user_email,)).fetchone()
        conn.close()
        
        if meta:
            if meta['scan_routine']:
                try:
                    routine_obj = json.loads(meta['scan_routine'])
                    routine_parts = []
                    for tod in ["Morning", "Night"]:
                        if tod in routine_obj:
                            routine_parts.append(f"**{tod} Routine:**")
                            for i, step in enumerate(routine_obj[tod]):
                                routine_parts.append(f"{i+1}. {step}")
                    routine_str = "\n".join(routine_parts)
                except Exception as e:
                    print("Error formatting routine for chatbot:", e)
            detected_issue = meta['disease']

    answer = get_chatbot_response(
        question,
        user_routine=routine_str,
        detected_issue=detected_issue,
        api_key=api_key
    )

    return jsonify({
        "success": True,
        "answer": answer
    })

def get_db_connection():
    conn = sqlite3.connect('schedule.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute("SELECT user_email FROM schedule_metadata LIMIT 1")
    except sqlite3.OperationalError:
        c.execute("DROP TABLE IF EXISTS tasks")
        c.execute("DROP TABLE IF EXISTS schedule_metadata")

    c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            day INTEGER,
            time_of_day TEXT,
            task_name TEXT,
            completed BOOLEAN
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS schedule_metadata (
            user_email TEXT PRIMARY KEY,
            start_date TEXT,
            is_healthy BOOLEAN DEFAULT 0,
            healthy_message TEXT DEFAULT '',
            skin_type TEXT DEFAULT '',
            disease TEXT DEFAULT '',
            scan_image TEXT DEFAULT '',
            scan_routine TEXT DEFAULT '',
            old_routine TEXT DEFAULT ''
        )
    ''')

    try:
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN old_routine TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    try:
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN age TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    try:
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN total_scans INTEGER DEFAULT 0")
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN day1_images TEXT DEFAULT '[]'")
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN current_images TEXT DEFAULT '[]'")
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN overall_health REAL DEFAULT 0.0")
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN overall_improvement REAL DEFAULT 0.0")
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN closeness_to_normal REAL DEFAULT 0.0")
    except sqlite3.OperationalError:
        pass

    try:
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN skin_day1_images TEXT DEFAULT '[]'")
        c.execute("ALTER TABLE schedule_metadata ADD COLUMN skin_current_images TEXT DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

init_db()

@app.route("/api/schedule", methods=["POST"])
def create_schedule():
    data = request.json
    user_email = data.get('user_email')
    if not user_email:
        return jsonify({"success": False, "message": "user_email is required"}), 400
        
    routine = data.get('routine')
    skin_type = data.get('skin_type', '')
    disease = data.get('disease', '')
    scan_image = data.get('scan_image', '')
    age = data.get('age', '')
    is_update = data.get('is_update', False)

    if not routine:
        return jsonify({"success": False, "message": "No routine provided"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    existing_meta = c.execute('SELECT start_date, skin_type, disease, scan_image, scan_routine, age FROM schedule_metadata WHERE user_email = ?', (user_email,)).fetchone()
    
    start_date_str = date.today().isoformat()
    old_routine_str = ''
    current_day = 1

    if existing_meta:
        if not skin_type: skin_type = existing_meta['skin_type']
        if not disease: disease = existing_meta['disease']
        if not scan_image: scan_image = existing_meta['scan_image']
        if not age: age = existing_meta['age']
        
        if is_update:
            start_date_str = existing_meta['start_date']
            old_routine_str = existing_meta['scan_routine']
            
            start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            current_day = (date.today() - start_date_obj).days + 1
            if current_day < 1: current_day = 1
            if current_day > 30: current_day = 30

    if is_update:
        c.execute('DELETE FROM tasks WHERE user_email = ? AND day >= ?', (user_email, current_day))
    else:
        c.execute('DELETE FROM tasks WHERE user_email = ?', (user_email,))
        
    is_healthy = routine.get('is_healthy', False)
    healthy_message = routine.get('message', '')
    scan_routine_str = json.dumps(routine)

    if existing_meta:
        c.execute('''
            UPDATE schedule_metadata 
            SET start_date=?, is_healthy=?, healthy_message=?, skin_type=?, disease=?, scan_image=?, scan_routine=?, old_routine=?, age=?
            WHERE user_email=?
        ''', (start_date_str, is_healthy, healthy_message, skin_type, disease, scan_image, scan_routine_str, old_routine_str, age, user_email))
    else:
        c.execute(
            'INSERT INTO schedule_metadata (user_email, start_date, is_healthy, healthy_message, skin_type, disease, scan_image, scan_routine, old_routine, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (user_email, start_date_str, is_healthy, healthy_message, skin_type, disease, scan_image, scan_routine_str, old_routine_str, age)
        )

    start_loop = current_day if is_update else 1
    for day in range(start_loop, 31):
        for tod in ["Morning", "Night"]:
            for task_name in routine.get(tod, []):
                c.execute(
                    'INSERT INTO tasks (user_email, day, time_of_day, task_name, completed) VALUES (?, ?, ?, ?, ?)',
                    (user_email, day, tod, task_name, False)
                )

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "30-day schedule created"})

@app.route("/api/schedule/today", methods=["GET"])
def get_today_schedule():
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({"success": False, "message": "user_email required"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    meta = c.execute(
        'SELECT start_date, is_healthy, healthy_message, skin_type, disease, scan_image, scan_routine, old_routine, age FROM schedule_metadata WHERE user_email = ?',
        (user_email,)
    ).fetchone()

    if not meta:
        conn.close()
        return jsonify({"success": False, "message": "No schedule found.", "tasks": [], "day": 0})

    start_date = datetime.strptime(meta['start_date'], '%Y-%m-%d').date()
    current_day = (date.today() - start_date).days + 1

    if current_day < 1 or current_day > 30:
        conn.close()
        return jsonify({"success": False, "message": "Schedule expired.", "tasks": [], "day": current_day})

    tasks = c.execute(
        'SELECT id, time_of_day, task_name, completed FROM tasks WHERE user_email = ? AND day = ?',
        (user_email, current_day)
    ).fetchall()

    conn.close()

    task_list = [
        {
            "id": t["id"],
            "time_of_day": t["time_of_day"],
            "task": t["task_name"],
            "completed": bool(t["completed"])
        }
        for t in tasks
    ]
    
    routine_obj = {}
    if meta['scan_routine']:
        try:
            routine_obj = json.loads(meta['scan_routine'])
        except:
            pass
            
    old_routine_obj = {}
    if meta['old_routine']:
        try:
            old_routine_obj = json.loads(meta['old_routine'])
        except:
            pass

    return jsonify({
        "success": True,
        "tasks": task_list,
        "day": current_day,
        "is_healthy": bool(meta['is_healthy']),
        "healthy_message": meta['healthy_message'],
        "skin_type": meta['skin_type'],
        "disease": meta['disease'],
        "scan_image": meta['scan_image'],
        "scan_routine": routine_obj,
        "old_routine": old_routine_obj,
        "age": meta['age']
    })

@app.route("/api/schedule/day", methods=["GET"])
def get_day_schedule():
    user_email = request.args.get('user_email')
    target_day = request.args.get('day', type=int)
    
    if not user_email or target_day is None:
        return jsonify({"success": False, "message": "user_email and day required"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    tasks = c.execute(
        'SELECT id, time_of_day, task_name, completed FROM tasks WHERE user_email = ? AND day = ?',
        (user_email, target_day)
    ).fetchall()

    conn.close()

    task_list = [
        {
            "id": t["id"],
            "time_of_day": t["time_of_day"],
            "task": t["task_name"],
            "completed": bool(t["completed"])
        }
        for t in tasks
    ]

    return jsonify({
        "success": True,
        "tasks": task_list,
        "day": target_day
    })

@app.route("/api/schedule/task/<int:task_id>", methods=["PUT"])
def toggle_task(task_id):
    conn = get_db_connection()
    c = conn.cursor()

    task = c.execute(
        'SELECT completed FROM tasks WHERE id = ?',
        (task_id,)
    ).fetchone()

    if not task:
        conn.close()
        return jsonify({"success": False, "message": "Task not found"}), 404

    new_status = not bool(task["completed"])

    c.execute(
        'UPDATE tasks SET completed = ? WHERE id = ?',
        (new_status, task_id)
    )

    conn.commit()
    conn.close()

    return jsonify({"success": True, "completed": new_status})

@app.route("/api/schedule/progress", methods=["GET"])
def get_progress():
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({"success": False, "message": "user_email required"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    meta = c.execute(
        'SELECT start_date, total_scans, overall_health, overall_improvement, closeness_to_normal FROM schedule_metadata WHERE user_email = ?',
        (user_email,)
    ).fetchone()

    if not meta:
        conn.close()
        return jsonify({"success": False, "progress": [], "metrics": None})

    start_date = datetime.strptime(meta['start_date'], '%Y-%m-%d').date()
    current_day = (date.today() - start_date).days + 1

    progress = []

    for day in range(1, 31):
        if day > current_day:
            progress.append({"day": f"Day {day}", "progress": 0})
        else:
            total = c.execute('SELECT COUNT(*) FROM tasks WHERE user_email = ? AND day = ?', (user_email, day)).fetchone()[0]
            completed = c.execute(
                'SELECT COUNT(*) FROM tasks WHERE user_email = ? AND day = ? AND completed = 1',
                (user_email, day)
            ).fetchone()[0]

            pct = int((completed / total) * 100) if total > 0 else 0
            progress.append({"day": f"Day {day}", "progress": pct})

    metrics = {
        "scan_count": meta['total_scans'] if meta['total_scans'] else 0,
        "health_score": (meta['overall_health'] * 100) if meta['overall_health'] else 0,
        "improvement": (meta['overall_improvement'] * 100) if meta['overall_improvement'] else 0,
        "closeness_to_normal": (meta['closeness_to_normal'] * 100) if meta['closeness_to_normal'] else 0
    }

    conn.close()

    return jsonify({"success": True, "progress": progress, "metrics": metrics})

@app.route("/api/schedule", methods=["DELETE"])
def delete_schedule():
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({"success": False, "message": "user_email required"}), 400
        
    conn = get_db_connection()
    c = conn.cursor()

    c.execute('DELETE FROM tasks WHERE user_email = ?', (user_email,))
    c.execute('DELETE FROM schedule_metadata WHERE user_email = ?', (user_email,))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Schedule deleted"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)