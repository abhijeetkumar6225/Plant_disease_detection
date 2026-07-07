from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
import os
from utils import predict_disease
import json


with open("model/disease_info.json", "r", encoding="utf-8") as f:
    disease_info = json.load(f)

app = Flask(__name__)

UPLOAD_FOLDER = "static/uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return render_template(
            "index.html",
            error="Please upload an image."
        )

    file = request.files["image"]

    if file.filename == "":
        return render_template(
            "index.html",
            error="No image selected."
        )

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    file.save(filepath)

    disease, confidence = predict_disease(filepath)
    info = disease_info.get(disease)

    return render_template(
        "index.html",
        uploaded_image=filepath,
        disease=disease,
        confidence=f"{confidence:.2f}%",
        info=info
    )


if __name__ == "__main__":
    app.run(debug=True)

