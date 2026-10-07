import os
import sys
import joblib
import pandas as pd

# Add root directory to python path if needed
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

from ml.feature_engineering import FEATURE_COLUMNS
from ml.preprocessing import get_preprocessing_pipeline
from ml.data.generate_dataset import generate_synthetic_credit_data

def train_and_save_model():
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, "data")
    data_file = os.path.join(data_dir, "credit_data.csv")

    if not os.path.exists(data_file):
        print("Dataset not found. Generating synthetic dataset...")
        os.makedirs(data_dir, exist_ok=True)
        df = generate_synthetic_credit_data()
        df.to_csv(data_file, index=False)
    else:
        df = pd.read_csv(data_file)

    print(f"Loaded dataset with {len(df)} samples.")

    X = df[FEATURE_COLUMNS]
    y = df["credit_risk"]

    # Train/Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = get_preprocessing_pipeline()
    classifier = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        random_state=42,
        class_weight="balanced"
    )

    # Combine into a full Scikit-Learn Pipeline
    full_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', classifier)
    ])

    print("Training Random Forest model pipeline...")
    full_pipeline.fit(X_train, y_train)

    # Evaluate model
    y_pred = full_pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n--- Model Training Complete ---")
    print(f"Test Accuracy: {accuracy * 100:.2f}%\n")
    print(classification_report(y_test, y_pred))

    # Save complete pipeline
    saved_model_dir = os.path.join(base_dir, "saved_model")
    os.makedirs(saved_model_dir, exist_ok=True)
    model_path = os.path.join(saved_model_dir, "credit_model.joblib")

    joblib.dump(full_pipeline, model_path)
    print(f"Saved complete ML pipeline to: {model_path}")

    return full_pipeline

if __name__ == "__main__":
    train_and_save_model()
