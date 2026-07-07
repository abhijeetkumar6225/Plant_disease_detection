import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import json

# ===========================
# Load model only once
# ===========================

MODEL_PATH = "model/plant_disease_model.keras"

model = tf.keras.models.load_model(MODEL_PATH)

# ===========================
# Load class names
# ===========================

with open("model/class_names.json", "r") as f:
    class_names = json.load(f)

# ===========================
# Image size
# ===========================

IMG_SIZE = (128, 128)
# Change this if your model uses another size
# Example:
# IMG_SIZE = (256,256)

# ===========================
# Preprocessing
# ===========================

def preprocess_image(img_path):

    img = image.load_img(img_path, target_size=IMG_SIZE)

    img_array = image.img_to_array(img)

    # img_array = img_array / 255.0

    img_array = np.expand_dims(img_array, axis=0)

    return img_array


# ===========================
# Prediction
# ===========================

def predict_disease(img_path):

    processed_image = preprocess_image(img_path)

    prediction = model.predict(processed_image, verbose=0)

    predicted_index = np.argmax(prediction)

    confidence = float(np.max(prediction) * 100)

    disease = class_names[predicted_index]

    return disease, confidence

