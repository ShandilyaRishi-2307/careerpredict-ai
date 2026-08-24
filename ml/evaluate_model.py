"""
Model Evaluation script for CareerPredict AI
Calculates classification report, confusion matrix, ROC-AUC score, and feature weight inspection.
"""
import os
import json
import pickle
from model_classes import Preprocessor, LogisticRegressionModel, TARGET_COLUMN
from train_model import load_data, compute_metrics

def run_evaluation():
    metadata_file = "ml/model/model_metadata.json"
    if not os.path.exists(metadata_file):
        print("Model metadata not found. Please train the model first with: python3 ml/train_model.py")
        return
        
    with open(metadata_file, "r", encoding="utf-8") as f:
        metadata = json.load(f)
        
    print("=" * 60)
    print("CAREERPREDICT AI — LOGISTIC REGRESSION EVALUATION REPORT")
    print("=" * 60)
    print(f"Model Name:       {metadata.get('modelName')}")
    print(f"Model Version:    {metadata.get('modelVersion')}")
    print(f"Algorithm:        {metadata.get('algorithm')}")
    print(f"Training Date:    {metadata.get('trainingDate')}")
    print(f"Dataset Size:     {metadata.get('datasetSize')} records (80% Train / 20% Test)")
    print(f"Decision Boundary: threshold = {metadata.get('classificationThreshold', 0.50)}")
    print("-" * 60)
    
    metrics = metadata.get("metrics", {})
    cm = metrics.get("confusionMatrix", {})
    print(f"Accuracy:         {metrics.get('accuracy', 0) * 100:.2f}%")
    print(f"Precision:        {metrics.get('precision', 0) * 100:.2f}%")
    print(f"Recall:           {metrics.get('recall', 0) * 100:.2f}%")
    print(f"F1-Score:         {metrics.get('f1', 0) * 100:.2f}%")
    print(f"ROC-AUC:          {metrics.get('rocAuc', 0):.4f}")
    print("-" * 60)
    print("Confusion Matrix:")
    print(f"  True Positives (TP):   {cm.get('truePositive', 0)}")
    print(f"  True Negatives (TN):   {cm.get('trueNegative', 0)}")
    print(f"  False Positives (FP):  {cm.get('falsePositive', 0)}")
    print(f"  False Negatives (FN):  {cm.get('falseNegative', 0)}")
    print("-" * 60)
    print("Top Positive Predictive Factors (Logistic Coefficients):")
    for feat in metadata.get("topFeatures", [])[:6]:
        print(f"  + {feat['feature']:<30} {feat['weight']:>+7.4f}")
    print("=" * 60)

if __name__ == "__main__":
    run_evaluation()
