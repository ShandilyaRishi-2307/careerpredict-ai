"""
Train Logistic Regression Model for CareerPredict AI
Trains binary classification pipeline, computes real evaluation metrics, and saves artifacts.
"""
import os
import csv
import math
import json
import random
import pickle

from model_classes import (
    Preprocessor,
    LogisticRegressionModel,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    TARGET_COLUMN,
    sigmoid,
)

def load_data(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        data = list(reader)
    return data

def train_test_split(data, test_ratio=0.2, seed=42):
    random.seed(seed)
    shuffled = data[:]
    random.shuffle(shuffled)
    split_idx = int(len(shuffled) * (1 - test_ratio))
    return shuffled[:split_idx], shuffled[split_idx:]

def compute_metrics(y_true, y_pred, y_probs):
    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)
    
    total = len(y_true)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    # Calculate ROC-AUC using trapezoidal Riemann approximation on sorted probabilities
    pairs = sorted(zip(y_probs, y_true), key=lambda x: x[0], reverse=True)
    n_pos = sum(y_true)
    n_neg = total - n_pos
    
    auc = 0.5
    if n_pos > 0 and n_neg > 0:
        rank_sum = 0
        for rank, (_, yt) in enumerate(sorted(zip(y_probs, y_true), key=lambda x: x[0]), 1):
            if yt == 1:
                rank_sum += rank
        auc = (rank_sum - (n_pos * (n_pos + 1)) / 2.0) / (n_pos * n_neg)
        auc = round(auc, 4)
        
    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "rocAuc": round(auc, 4),
        "confusionMatrix": {
            "truePositive": tp,
            "trueNegative": tn,
            "falsePositive": fp,
            "falseNegative": fn
        },
        "testSamples": total
    }

def train_and_save():
    dataset_path = "ml/dataset/job_prediction_dataset.csv"
    if not os.path.exists(dataset_path):
        from generate_dataset import generate_dataset
        generate_dataset(5000, dataset_path)
        
    data = load_data(dataset_path)
    train_data, test_data = train_test_split(data, test_ratio=0.2, seed=42)
    
    print(f"Training on {len(train_data)} samples, testing on {len(test_data)} samples...")
    
    preprocessor = Preprocessor().fit(train_data)
    X_train = preprocessor.transform(train_data)
    y_train = [int(r[TARGET_COLUMN]) for r in train_data]
    
    X_test = preprocessor.transform(test_data)
    y_test = [int(r[TARGET_COLUMN]) for r in test_data]
    
    model = LogisticRegressionModel(lr=0.15, l2_reg=0.005, epochs=400)
    model.fit(X_train, y_train, preprocessor.feature_names_)
    
    # Evaluate
    test_probs = [p[1] for p in model.predict_proba(X_test)]
    test_preds = model.predict(X_test, threshold=0.5)
    metrics = compute_metrics(y_test, test_preds, test_probs)
    
    print("--- Model Evaluation Metrics ---")
    print(f"Accuracy:  {metrics['accuracy'] * 100:.2f}%")
    print(f"Precision: {metrics['precision'] * 100:.2f}%")
    print(f"Recall:    {metrics['recall'] * 100:.2f}%")
    print(f"F1-Score:  {metrics['f1'] * 100:.2f}%")
    print(f"ROC-AUC:   {metrics['rocAuc']:.4f}")
    print(f"Confusion Matrix: {metrics['confusionMatrix']}")
    
    # Feature importance / weights breakdown
    feature_importance = []
    for name, weight in zip(model.feature_names, model.weights):
        feature_importance.append({"feature": name, "weight": round(weight, 4), "impact": "Positive" if weight > 0 else "Negative"})
    feature_importance.sort(key=lambda x: abs(x["weight"]), reverse=True)
    
    # Save artifacts
    os.makedirs("ml/model", exist_ok=True)
    
    # 1. Pickle model & preprocessor
    with open("ml/model/logistic_regression.pkl", "wb") as f:
        pickle.dump(model, f)
    with open("ml/model/preprocessor.pkl", "wb") as f:
        pickle.dump(preprocessor, f)
        
    # 2. JSON model weights & parameters
    with open("ml/model/model_weights.json", "w", encoding="utf-8") as f:
        json.dump(model.to_dict(), f, indent=2)

    # 3. JSON feature columns
    feature_columns_info = {
        "categoricalFeatures": CATEGORICAL_FEATURES,
        "numericalFeatures": NUMERICAL_FEATURES,
        "encodedFeatureNames": preprocessor.feature_names_,
        "categories": preprocessor.categories_,
        "means": preprocessor.means_,
        "stds": preprocessor.stds_,
        "target": TARGET_COLUMN
    }
    with open("ml/model/feature_columns.json", "w", encoding="utf-8") as f:
        json.dump(feature_columns_info, f, indent=2)
        
    # 4. Model metadata
    metadata = {
        "modelName": "Logistic Regression Classifier",
        "algorithm": "Ridge Logistic Regression (L2 Regularized)",
        "modelVersion": "1.0.0",
        "trainingDate": "2026-08-23",
        "datasetSize": len(data),
        "trainTestSplit": "80/20",
        "randomState": 42,
        "classificationThreshold": 0.50,
        "metrics": metrics,
        "bias": round(model.bias, 4),
        "topFeatures": feature_importance[:12],
        "allFeatures": feature_importance
    }
    with open("ml/model/model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print("Model artifacts successfully saved to ml/model/")

if __name__ == "__main__":
    train_and_save()
