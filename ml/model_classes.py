"""
CareerPredict AI — Machine Learning Model Classes
Contains Preprocessor and LogisticRegressionModel for training, inference, and serialization.
"""
import math
import json

CATEGORICAL_FEATURES = ["education_level", "field_of_study"]
NUMERICAL_FEATURES = [
    "age",
    "years_experience",
    "internship_count",
    "previous_jobs",
    "technical_skill_score",
    "web_development_score",
    "database_score",
    "data_structures_score",
    "algorithm_score",
    "machine_learning_score",
    "cloud_score",
    "communication_score",
    "leadership_score",
    "teamwork_score",
    "problem_solving_score",
    "project_count",
    "certification_count",
    "resume_score",
    "interview_score",
    "aptitude_score",
    "github_activity"
]
TARGET_COLUMN = "job_received"

def sigmoid(z):
    z = max(-500.0, min(500.0, z))
    return 1.0 / (1.0 + math.exp(-z))

class Preprocessor:
    def __init__(self):
        self.categories_ = {}
        self.means_ = {}
        self.stds_ = {}
        self.feature_names_ = []
        
    def fit(self, data):
        # 1. Categorical unique values
        for cat in CATEGORICAL_FEATURES:
            vals = sorted(list(set(str(row[cat]) for row in data if row.get(cat))))
            self.categories_[cat] = vals
            
        # 2. Numerical means and stds
        for num in NUMERICAL_FEATURES:
            vals = [float(row[num]) for row in data if row.get(num) is not None and str(row.get(num)).strip() != ""]
            if vals:
                mean = sum(vals) / len(vals)
                var = sum((v - mean) ** 2 for v in vals) / (len(vals) - 1 if len(vals) > 1 else 1)
                std = math.sqrt(var) if var > 1e-8 else 1.0
            else:
                mean = 0.0
                std = 1.0
            self.means_[num] = mean
            self.stds_[num] = std
            
        # 3. Build ordered feature names
        self.feature_names_ = []
        for cat in CATEGORICAL_FEATURES:
            for val in self.categories_[cat]:
                self.feature_names_.append(f"{cat}_{val}")
        for num in NUMERICAL_FEATURES:
            self.feature_names_.append(num)
            
        return self
        
    def transform_row(self, row):
        vector = []
        # One-hot encode categoricals
        for cat in CATEGORICAL_FEATURES:
            row_val = str(row.get(cat, ""))
            for val in self.categories_.get(cat, []):
                vector.append(1.0 if row_val == val else 0.0)
                
        # Standard scale numericals
        for num in NUMERICAL_FEATURES:
            raw_val = float(row.get(num, self.means_.get(num, 0.0)))
            std = self.stds_.get(num, 1.0)
            mean = self.means_.get(num, 0.0)
            scaled = (raw_val - mean) / (std if std > 1e-8 else 1.0)
            vector.append(scaled)
            
        return vector
        
    def transform(self, data):
        return [self.transform_row(r) for r in data]

    def to_dict(self):
        return {
            "categories": self.categories_,
            "means": self.means_,
            "stds": self.stds_,
            "featureNames": self.feature_names_
        }

    @classmethod
    def from_dict(cls, data):
        prep = cls()
        prep.categories_ = data.get("categories", {})
        prep.means_ = data.get("means", {})
        prep.stds_ = data.get("stds", {})
        prep.feature_names_ = data.get("featureNames", data.get("encodedFeatureNames", []))
        return prep

class LogisticRegressionModel:
    def __init__(self, lr=0.08, l2_reg=0.01, epochs=300):
        self.lr = lr
        self.l2_reg = l2_reg
        self.epochs = epochs
        self.weights = []
        self.bias = 0.0
        self.feature_names = []
        
    def fit(self, X, y, feature_names):
        self.feature_names = feature_names
        n_samples = len(X)
        if n_samples == 0:
            return self
        n_features = len(X[0])
        self.weights = [0.0] * n_features
        self.bias = 0.0
        
        for epoch in range(self.epochs):
            dw = [0.0] * n_features
            db = 0.0
            
            for xi, yi in zip(X, y):
                z = sum(w * x for w, x in zip(self.weights, xi)) + self.bias
                p = sigmoid(z)
                err = p - yi
                for j in range(n_features):
                    dw[j] += err * xi[j]
                db += err
                
            decay = 1.0 / (1.0 + 0.0005 * epoch)
            eff_lr = self.lr * decay
            for j in range(n_features):
                reg_grad = (self.l2_reg / n_samples) * self.weights[j]
                self.weights[j] -= eff_lr * (dw[j] / n_samples + reg_grad)
            self.bias -= eff_lr * (db / n_samples)
            
        return self
        
    def predict_proba_row(self, xi):
        z = sum(w * x for w, x in zip(self.weights, xi)) + self.bias
        p1 = sigmoid(z)
        return [1.0 - p1, p1]
        
    def predict_proba(self, X):
        return [self.predict_proba_row(xi) for xi in X]
        
    def predict(self, X, threshold=0.5):
        return [1 if p[1] >= threshold else 0 for p in self.predict_proba(X)]

    def to_dict(self):
        return {
            "weights": self.weights,
            "bias": self.bias,
            "featureNames": self.feature_names,
            "lr": self.lr,
            "l2Reg": self.l2_reg
        }

    @classmethod
    def from_dict(cls, data):
        model = cls()
        model.weights = data.get("weights", [])
        model.bias = data.get("bias", 0.0)
        model.feature_names = data.get("featureNames", data.get("feature_names", []))
        return model
