import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'
import numpy as np
import tensorflow as tf
from PIL import Image
import cv2
import zipfile

# ===================================
# 🔹 CONFIG (EDIT THESE)
# ===================================
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_SCRIPT_DIR, "skin_model.keras")
NORMAL_EMBEDDINGS_FILE = os.path.join(_SCRIPT_DIR, "normal_embeddings.npy")

IMG_SIZE = 224
CATEGORIES = ['acne', 'blackheades', 'dark spots', 'normal', 'pores', 'wrinkles']

# ===================================
# 🔹 FINE-TUNING PARAMETERS PER DISEASE
# ===================================
# You can tweak these values to get the best prediction behavior for each disease!
DISEASE_PARAMS = {
    # threshold: Minimum probability required to keep predicting the disease (0.05 = 5%).
    # noise_split: How much hallucinated noise is given back to the disease (0.50 = 50%).
    # hist_weight: Importance of color histogram vs deep embeddings in similarity check (0.60 = 60% color).
    0: {"threshold": 0.05, "noise_split": 0.50, "hist_weight": 0.60}, # Acne (Redness, heavily color based)
    1: {"threshold": 0.08, "noise_split": 0.40, "hist_weight": 0.40}, # Blackheades (Small dark dots, mix of color and texture)
    2: {"threshold": 0.05, "noise_split": 0.45, "hist_weight": 0.80}, # Dark Spots (Pigmentation, relies very heavily on color)
    4: {"threshold": 0.10, "noise_split": 0.40, "hist_weight": 0.15}, # Pores (Texture based, color doesn't matter much)
    5: {"threshold": 0.10, "noise_split": 0.40, "hist_weight": 0.10}, # Wrinkles (Purely structural, relies on embeddings)
}


def _load_model_safe(path):
    """
    Load a Keras model using TF_USE_LEGACY_KERAS.
    """
    path = os.path.abspath(path)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")

    return tf.keras.models.load_model(path)

# Initialize face detection cascades
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')

def is_probably_skin(img):
    """
    Heuristic to check if the image contains a significant amount of skin-like colors.
    Helps distinguish between a blurry face and a random object (like a bottle).
    """
    # Convert to YCrCb color space (better for skin detection)
    img_ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    # Standard skin color range in YCrCb
    lower = np.array([0, 133, 77], dtype=np.uint8)
    upper = np.array([255, 173, 127], dtype=np.uint8)
    mask = cv2.inRange(img_ycrcb, lower, upper)
    
    # Calculate percentage of skin pixels
    skin_pix = cv2.countNonZero(mask)
    total_pix = img.shape[0] * img.shape[1]
    skin_percentage = (skin_pix / total_pix) * 100
    return skin_percentage > 25  # 25% is a safe threshold for close-up skin

def preprocess_image(path, is_face=True):
    img = cv2.imread(path)
    if img is None:
        img_pil = Image.open(path).convert("RGB")
        img = np.array(img_pil)
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    if is_face:
        # 1. Face Detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Try multiple detectors and parameter sets
        faces = []
        
        # Pass 1: Frontal Face (Normal)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)
        
        # Pass 2: Profile Face (Normal)
        if len(faces) == 0:
            faces = profile_cascade.detectMultiScale(gray, 1.1, 5)
            
        # Pass 3: Profile Face (Flipped)
        if len(faces) == 0:
            flipped_gray = cv2.flip(gray, 1)
            faces_flipped = profile_cascade.detectMultiScale(flipped_gray, 1.1, 5)
            if len(faces_flipped) > 0:
                faces = []
                for (x, y, w, h) in faces_flipped:
                    faces.append([img.shape[1] - x - w, y, w, h])

        # Pass 4: Desperate Detection (Very Loose)
        if len(faces) == 0:
            # Lower minNeighbors to 1 - catches blurry or partially obscured faces
            faces = face_cascade.detectMultiScale(gray, 1.1, 1)

        # FINAL FALLBACK: If detection fails but it looks like skin (e.g. tight crop)
        if len(faces) == 0:
            if is_probably_skin(img):
                # It's a face/skin but the detector failed (common for tight crops like yours)
                # We'll skip the crop and proceed with the full image
                pass
            else:
                # It's not a face and doesn't look like skin (Bottle/Object)
                raise ValueError(f"Face Detection Failed: The image '{path}' does not appear to be a human face. "
                                 f"Please provide a clear skin image.")

        # Apply cropping only if a face was actually located
        if len(faces) > 0:
            (x, y, w, h) = faces[0]
            margin = int(0.2 * w)
            x_min = max(0, x - margin)
            y_min = max(0, y - margin)
            x_max = min(img.shape[1], x + w + margin)
            y_max = min(img.shape[0], y + h + margin)
            img = img[y_min:y_max, x_min:x_max]
    else:
        # If not face, we skip face detection and just verify it's skin to reject non-skin objects
        if not is_probably_skin(img):
            raise ValueError(f"Skin Detection Failed: The image '{path}' does not appear to contain skin. "
                             f"Please provide a clear skin image.")

    # 2. Lighting Correction (CLAHE)
    # lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    # l_channel, a_channel, b_channel = cv2.split(lab)
    # clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    # cl = clahe.apply(l_channel)
    # merged_lab = cv2.merge((cl, a_channel, b_channel))
    # img = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2RGB)
    
    # Just standard BGR to RGB since we disabled CLAHE
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 3. Resize
    img_pil = Image.fromarray(img)
    img_pil = img_pil.resize((IMG_SIZE, IMG_SIZE))
    
    # 4. MobileNetV2 Preprocessing (scales [0, 255] to [-1, 1])
    # This is CRITICAL because skin_model2.keras expects [-1, 1] but doesn't have the layer baked in!
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    img_array = np.array(img_pil).astype(np.float32)
    img_array = preprocess_input(img_array)
    return img_array

class FastSkinAnalyzer:
    """
    A highly optimized class that loads the model and normal embeddings only once.
    It processes multiple images (Left, Middle, Right) in a single batch pass for the whole face.
    """
    def __init__(self, model_path, embeddings_path):
        print("Loading models and embeddings (This only happens once)...")
        # Load base model (handles HDF5 files with .keras extension)
        self.model = _load_model_safe(model_path)
        
        # Create a multi-output model to get both embeddings and final predictions at the same time
        self.multi_model = tf.keras.Model(
            inputs=self.model.input, 
            outputs=[self.model.layers[-2].output, self.model.output]
        )
        
        # Load normal embeddings and pre-normalize them as a constant tensor for instant matrix multiplication
        embs = np.load(embeddings_path)
        if len(embs.shape) == 3:
            embs = np.squeeze(embs, axis=1)
            
        self.embs_norm = tf.nn.l2_normalize(tf.constant(embs, dtype=tf.float32), axis=1)
        print("Initialization complete.")

    def analyze(self, day1_paths, current_paths):
        """
        day1_paths: List of 3 paths [left, middle, right]
        current_paths: List of 3 paths [left, middle, right]
        """
        # 1. Preprocess all 6 images
        all_paths = day1_paths + current_paths
        imgs = [preprocess_image(p) for p in all_paths]
        
        # 2. Batch them together to run the model ONLY ONCE for the whole face
        batch_imgs = np.stack(imgs) # Shape: (6, 224, 224, 3)
        
        # 3. Get embeddings and predictions in one shot
        embs, preds = self.multi_model.predict(batch_imgs, verbose=0)
        
        # Split results back (first 3 are Day 1, last 3 are Current)
        embs_day1 = embs[:3]
        embs_curr = embs[3:]
        preds_day1 = preds[:3] # Predictions for Day 1
        preds_curr = preds[3:] # Predictions for Current
        
        # 4. Calculate Health Score using Probability of 'normal' class (Index 3)
        normal_idx = 3
        h1_list = preds_day1[:, normal_idx]
        h2_list = preds_curr[:, normal_idx]
        
        # Get Day 1 Disease to anchor progress tracking
        max_pred_day1 = np.max(preds_day1, axis=0)
        avg_pred_day1 = max_pred_day1 / np.sum(max_pred_day1)
        day1_idx = int(np.argmax(avg_pred_day1))
        
        # Retrieve fine-tuned parameters for this specific disease
        params = DISEASE_PARAMS.get(day1_idx, {"threshold": 0.10, "noise_split": 0.50, "hist_weight": 0.50})
        
        avg_h1 = float(np.mean(h1_list))
        avg_h2 = float(np.mean(h2_list))
        
        # Smooth boost with a guaranteed baseline (40%)
        # Even worst cases should not show 2% closeness, which is demoralizing. 
        # This maps [0, 1] to [0.40, 1.0] with a nice curve.
        def calc_health(raw_val):
            return float(min(1.0, 0.40 + (max(0.0, raw_val) ** 0.4) * 0.60))
            
        boosted_h1 = calc_health(avg_h1)
        boosted_h2 = calc_health(avg_h2)
        
        # 5. Similarity between corresponding sides (Identity Check using Embeddings)
        embs_day1_c = embs_day1 - tf.reduce_mean(embs_day1, axis=1, keepdims=True)
        embs_curr_c = embs_curr - tf.reduce_mean(embs_curr, axis=1, keepdims=True)
        
        sim_list = tf.reduce_sum(
            tf.nn.l2_normalize(embs_day1_c, axis=1) * tf.nn.l2_normalize(embs_curr_c, axis=1), 
            axis=1
        ).numpy()
        avg_sim = float(max(0.0, np.mean(sim_list))) # Clamp negative correlations to 0
        
        # Add color histogram similarity for face to make it robust to condition changes
        try:
            hist_sims = []
            for p1, p2 in zip(day1_paths, current_paths):
                img1 = cv2.imread(p1)
                img2 = cv2.imread(p2)
                if img1 is not None and img2 is not None:
                    hist1 = cv2.calcHist([img1], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                    hist2 = cv2.calcHist([img2], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                    cv2.normalize(hist1, hist1)
                    cv2.normalize(hist2, hist2)
                    hist_sims.append(cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL))
            if hist_sims:
                avg_hist_sim = max(0.0, float(np.mean(hist_sims)))
                # Use the disease-specific weight for histogram vs embeddings
                hw = params["hist_weight"]
                avg_sim = float((avg_sim * (1.0 - hw)) + (avg_hist_sim * hw))
        except Exception as e:
            print("Histogram error:", e)
        
        # 6. Ensemble Prediction for Current
        max_pred_matrix = np.max(preds_curr, axis=0)
        avg_pred_matrix = max_pred_matrix / np.sum(max_pred_matrix)
        
        # CONTEXT-AWARE FILTERING (THE HEALING SPLIT):
        noise_sum = 0.0
        for i in range(len(avg_pred_matrix)):
            if i != 3 and i != day1_idx: # If it's not Normal and not the original disease
                noise_sum += avg_pred_matrix[i]
                avg_pred_matrix[i] = 0.0
                
        # Split the hallucinated noise based on the disease-specific fine-tuned parameter
        split_ratio = params["noise_split"]
        avg_pred_matrix[day1_idx] += (noise_sum * split_ratio)
        avg_pred_matrix[3] += (noise_sum * (1.0 - split_ratio))

        idx = np.argmax(avg_pred_matrix)
        
        # Smart Disease Thresholding: 
        if idx == 3 and day1_idx != 3:
            if avg_pred_matrix[day1_idx] > params["threshold"]:
                idx = day1_idx
                
        conf = avg_pred_matrix[idx]
        
        avg_closeness = boosted_h2
        
        # Make Health Score Cumulative & Smooth
        improvement = boosted_h2 - boosted_h1
        if improvement < 0:
            improvement = 0.0 # Don't penalize minor fluctuations
            health_score_new = boosted_h1 # Keep the highest achieved health score
        else:
            health_score_new = boosted_h2
            
        return {
            "class_index": int(idx),
            "class_name": CATEGORIES[idx],
            "confidence": float(conf),
            "health_score_new": float(health_score_new),
            "health_score_old": float(boosted_h1),
            "improvement": float(improvement),
            "similarity": avg_sim,
            "closeness_to_normal": float(avg_closeness),
            "raw_prediction": avg_pred_matrix.tolist(),
            "individual_health": h2_list.tolist()
        }

    def predict(self, image_path, is_face=True):
        """
        Runs a prediction on a single image. Optionally disable face detection.
        Returns: (class_index, confidence, raw_matrix)
        """
        img = preprocess_image(image_path, is_face=is_face)
        img_batch = np.expand_dims(img, axis=0)
        
        preds = self.model.predict(img_batch, verbose=0)
        idx = np.argmax(preds[0])
        conf = preds[0][idx]
        
        return idx, CATEGORIES[idx], conf, preds[0]

    def analyze_body_part(self, day1_path, current_path):
        """
        Analyzes a single region of the body (e.g., hand, arm, leg) from Day 1 to Current.
        Bypasses face detection and 3-view aggregation.
        Returns prediction, health scores, and similarity for the given body part.
        """
        # 1. Preprocess the 2 images with is_face=False
        imgs = [
            preprocess_image(day1_path, is_face=False), 
            preprocess_image(current_path, is_face=False)
        ]
        
        # 2. Batch them together
        batch_imgs = np.stack(imgs) # Shape: (2, 224, 224, 3)
        
        # 3. Get embeddings and predictions in one shot
        embs, preds = self.multi_model.predict(batch_imgs, verbose=0)
        
        embs_day1 = embs[0:1]
        embs_curr = embs[1:2]
        pred_day1 = preds[0] # Prediction for the Day 1 view
        pred_curr = preds[1] # Prediction for the current view
        
        # Get Day 1 Disease
        day1_idx = int(np.argmax(pred_day1))
        
        # Retrieve fine-tuned parameters for this specific disease
        params = DISEASE_PARAMS.get(day1_idx, {"threshold": 0.10, "noise_split": 0.50, "hist_weight": 0.50})
        
        # 4. Calculate Health Score using Probability of 'normal' class (Index 3)
        normal_idx = 3
        h1 = float(pred_day1[normal_idx])
        h2 = float(pred_curr[normal_idx])
        
        def calc_health(raw_val):
            return float(min(1.0, 0.40 + (max(0.0, raw_val) ** 0.4) * 0.60))
            
        boosted_h1 = calc_health(h1)
        boosted_h2 = calc_health(h2)
        
        # 5. Similarity between Day 1 and Current (Identity Check using Embeddings)
        embs_day1_c = embs_day1 - tf.reduce_mean(embs_day1, axis=1, keepdims=True)
        embs_curr_c = embs_curr - tf.reduce_mean(embs_curr, axis=1, keepdims=True)
        
        sim = tf.reduce_sum(
            tf.nn.l2_normalize(embs_day1_c, axis=1) * tf.nn.l2_normalize(embs_curr_c, axis=1)
        ).numpy()
        sim = float(max(0.0, sim)) # Clamp negative correlations to 0
        
        # Add color histogram similarity for skin since deep features are too generic
        try:
            img1 = cv2.imread(day1_path)
            img2 = cv2.imread(current_path)
            if img1 is not None and img2 is not None:
                hist1 = cv2.calcHist([img1], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                hist2 = cv2.calcHist([img2], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                cv2.normalize(hist1, hist1)
                cv2.normalize(hist2, hist2)
                hist_sim = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
                
                # Combine Pearson correlation with color histogram using fine-tuned weight
                hw = params["hist_weight"]
                sim = float((sim * (1.0 - hw)) + (max(0.0, hist_sim) * hw))
        except Exception as e:
            print("Histogram error:", e)
        
        # 6. Prediction result
        # CONTEXT-AWARE FILTERING (THE HEALING SPLIT):
        noise_sum = 0.0
        for i in range(len(pred_curr)):
            if i != 3 and i != day1_idx:
                noise_sum += pred_curr[i]
                pred_curr[i] = 0.0
                
        split_ratio = params["noise_split"]
        pred_curr[day1_idx] += (noise_sum * split_ratio)
        pred_curr[3] += (noise_sum * (1.0 - split_ratio))

        idx = np.argmax(pred_curr)
        
        # Smart Disease Thresholding: 
        if idx == 3 and day1_idx != 3:
            if pred_curr[day1_idx] > params["threshold"]:
                idx = day1_idx
                
        conf = pred_curr[idx]
        
        avg_closeness = boosted_h2
        
        # Make Health Score Cumulative & Smooth
        improvement = boosted_h2 - boosted_h1
        if improvement < 0:
            improvement = 0.0
            health_score_new = boosted_h1
        else:
            health_score_new = boosted_h2
            
        return {
            "class_index": int(idx),
            "class_name": CATEGORIES[idx],
            "confidence": float(conf),
            "health_score_new": float(health_score_new),
            "health_score_old": float(boosted_h1),
            "improvement": float(improvement),
            "similarity": sim,
            "closeness_to_normal": float(avg_closeness),
            "raw_prediction": pred_curr.tolist()
        }

# Removed RUN TEST block to allow clean importing
