"""
Python Machine Learning Prediction Service for CareerPredict AI
Loads trained Logistic Regression model & preprocessor, outputs exact probabilities and classifications.
Supports both HTTP server mode (port 8000) and direct CLI JSON invocation.
"""
import sys
import os
import json
import pickle
from http.server import HTTPServer, BaseHTTPRequestHandler
from preprocess import clean_input_features
from model_classes import Preprocessor, LogisticRegressionModel

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "logistic_regression.pkl")
PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), "model", "preprocessor.pkl")
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "model", "model_weights.json")
FEATURE_COLUMNS_PATH = os.path.join(os.path.dirname(__file__), "model", "feature_columns.json")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "model", "model_metadata.json")

model = None
preprocessor = None
metadata = {}

def load_artifacts():
    global model, preprocessor, metadata
    
    # Train model if artifacts don't exist yet
    if not (os.path.exists(MODEL_PATH) or os.path.exists(WEIGHTS_PATH)):
        print("Model artifacts not found. Initiating model training...")
        from train_model import train_and_save
        train_and_save()
        
    loaded = False
    # Attempt 1: Load from binary pickle
    if os.path.exists(MODEL_PATH) and os.path.exists(PREPROCESSOR_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)
            with open(PREPROCESSOR_PATH, "rb") as f:
                preprocessor = pickle.load(f)
            loaded = True
            print("Logistic Regression model and preprocessor loaded successfully from pickle.")
        except Exception as err:
            print(f"Pickle unpickling notice ({err}). Switching to direct parameter loader...", file=sys.stderr)
            model = None
            preprocessor = None

    # Attempt 2: Load directly from JSON model weights & feature columns
    if not loaded:
        if os.path.exists(WEIGHTS_PATH) and os.path.exists(FEATURE_COLUMNS_PATH):
            with open(WEIGHTS_PATH, "r", encoding="utf-8") as f:
                weights_data = json.load(f)
            with open(FEATURE_COLUMNS_PATH, "r", encoding="utf-8") as f:
                feat_data = json.load(f)
            model = LogisticRegressionModel.from_dict(weights_data)
            preprocessor = Preprocessor.from_dict(feat_data)
            loaded = True
            print("Logistic Regression model and preprocessor loaded successfully from JSON weights.")
        else:
            from train_model import train_and_save
            train_and_save()
            return load_artifacts()

    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        except Exception:
            metadata = {}

def predict_candidate(raw_features):
    if model is None or preprocessor is None:
        load_artifacts()
        
    cleaned = clean_input_features(raw_features)
    vector = preprocessor.transform_row(cleaned)
    probs = model.predict_proba_row(vector)
    
    no_job_prob = round(probs[0] * 100, 2)
    job_prob = round(probs[1] * 100, 2)
    
    # Threshold = 50%
    prediction_class = 1 if job_prob >= 50.0 else 0
    
    if job_prob >= 80.0:
        confidence = "Strong Potential"
    elif job_prob >= 60.0:
        confidence = "Good Potential"
    elif job_prob >= 40.0:
        confidence = "Moderate"
    else:
        confidence = "Needs Improvement"
        
    return {
        "prediction": prediction_class,
        "predictionLabel": "Likely to Get Job" if prediction_class == 1 else "Needs Profile Improvement",
        "jobProbability": job_prob,
        "noJobProbability": no_job_prob,
        "confidence": confidence,
        "modelVersion": metadata.get("modelVersion", "1.0.0"),
        "rawVectorLength": len(vector)
    }

class MLRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            response = {
                "status": "ok",
                "modelLoaded": model is not None,
                "modelVersion": metadata.get("modelVersion", "1.0.0"),
                "metrics": metadata.get("metrics", {})
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/predict":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body) if body else {}
                result = predict_candidate(data)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run_server(port=8000):
    load_artifacts()
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, MLRequestHandler)
    print(f"ML Service running on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--server":
            port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
            run_server(port)
        elif sys.argv[1] == "--json":
            load_artifacts()
            raw_input = sys.argv[2] if len(sys.argv) > 2 else "{}"
            parsed = json.loads(raw_input)
            result = predict_candidate(parsed)
            print(json.dumps(result))
        elif sys.argv[1] == "--stdin":
            load_artifacts()
            stdin_data = sys.stdin.read()
            parsed = json.loads(stdin_data) if stdin_data else {}
            result = predict_candidate(parsed)
            print(json.dumps(result))
    else:
        load_artifacts()
        # Sample test
        sample = {
            "age": 22,
            "education_level": "Bachelor's",
            "years_experience": 1.5,
            "technical_skill_score": 85,
            "communication_score": 75,
            "problem_solving_score": 82,
            "project_count": 4,
            "certification_count": 2,
            "resume_score": 80,
            "interview_score": 78,
            "aptitude_score": 80
        }
        res = predict_candidate(sample)
        print("Sample prediction output:", json.dumps(res, indent=2))
