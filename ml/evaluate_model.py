import os
import sys
import joblib
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from ml.feature_engineering import FEATURE_COLUMNS

def evaluate():
    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, "saved_model", "credit_model.joblib")
    data_path = os.path.join(base_dir, "data", "credit_data.csv")

    if not os.path.exists(model_path):
        print(f"Error: Model file not found at {model_path}. Please run train_model.py first.")
        return

    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}.")
        return

    pipeline = joblib.load(model_path)
    df = pd.read_csv(data_path)

    X = df[FEATURE_COLUMNS]
    y = df["credit_risk"]

    y_pred = pipeline.predict(X)
    acc = accuracy_score(y, y_pred)

    print("==================================================")
    print("           CREDIFY ML MODEL EVALUATION            ")
    print("==================================================")
    print(f"Overall Dataset Accuracy: {acc * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y, y_pred))

    print("Confusion Matrix:")
    labels = pipeline.named_steps['classifier'].classes_
    cm = confusion_matrix(y, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=[f"Actual {l}" for l in labels], columns=[f"Pred {l}" for l in labels])
    print(cm_df)
    print("\n--------------------------------------------------")
    print("Feature Importances:")
    importances = pipeline.named_steps['classifier'].feature_importances_
    feature_imp = pd.Series(importances, index=FEATURE_COLUMNS).sort_values(ascending=False)
    for feat, imp in feature_imp.items():
        print(f"  {feat:<28}: {imp:.4f}")
    print("==================================================")

if __name__ == "__main__":
    evaluate()
