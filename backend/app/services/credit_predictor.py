import os
import joblib
import pandas as pd
from app.config import settings

_cached_pipeline = None

def get_ml_pipeline():
    global _cached_pipeline
    model_path = settings.MODEL_PATH
    
    if _cached_pipeline is not None:
        return _cached_pipeline

    if not os.path.exists(model_path):
        # Auto train model if not present yet
        print("Trained model not found at startup. Training model now...")
        from ml.train_model import train_and_save_model
        _cached_pipeline = train_and_save_model()
    else:
        _cached_pipeline = joblib.load(model_path)
        
    return _cached_pipeline

def predict_credit_risk_and_score(features: dict) -> dict:
    """
    Takes engineered financial features dictionary, runs saved Scikit-Learn Pipeline,
    predicts risk class + probabilities, and calculates deterministic Credify Score (300-850).
    """
    pipeline = get_ml_pipeline()
    
    # Prepare single row DataFrame matching feature names
    df_features = pd.DataFrame([features])

    # Model prediction & probabilities
    probabilities = pipeline.predict_proba(df_features)[0]
    classes = list(pipeline.named_steps['classifier'].classes_)
    
    prob_dict = {"Low": 0.0, "Medium": 0.0, "High": 0.0}
    for cls_name, prob_val in zip(classes, probabilities):
        prob_dict[cls_name] = round(float(prob_val), 4)

    # Predicted risk category (class with max probability)
    risk_category = max(prob_dict, key=prob_dict.get)

    # -------------------------------------------------------------
    # Credify Score Calculation (300 - 850)
    # -------------------------------------------------------------
    # Base weighted score from ML probabilities
    base_ml_score = (
        prob_dict["Low"] * 820 +
        prob_dict["Medium"] * 630 +
        prob_dict["High"] * 380
    )

    # Feature adjustments
    savings_rate = features.get("savings_rate", 0.0)
    expense_ratio = features.get("expense_ratio", 1.0)
    income_stability = features.get("income_stability", 0.5)
    negative_balance_count = features.get("negative_balance_count", 0)
    avg_balance = features.get("average_balance", 0.0)

    # Adjustments (-50 to +50 points total)
    sav_adj = max(-25.0, min(30.0, savings_rate * 50.0))
    exp_adj = max(-30.0, min(25.0, (0.65 - expense_ratio) * 45.0))
    stab_adj = (income_stability - 0.5) * 20.0
    neg_bal_penalty = min(50.0, negative_balance_count * 20.0)
    bal_bonus = 15.0 if avg_balance > 30000 else (5.0 if avg_balance > 10000 else -10.0)

    raw_score = base_ml_score + sav_adj + exp_adj + stab_adj + bal_bonus - neg_bal_penalty
    
    # Clamp final score between 300 and 850
    final_score = int(round(max(300, min(850, raw_score))))

    # -------------------------------------------------------------
    # Dynamic Explanation Generation
    # -------------------------------------------------------------
    low_pct = int(prob_dict["Low"] * 100)
    med_pct = int(prob_dict["Medium"] * 100)
    high_pct = int(prob_dict["High"] * 100)

    explanation_parts = []
    
    if risk_category == "Low":
        explanation_parts.append(
            f"Your predicted risk category is LOW ({low_pct}% confidence). "
            f"The uploaded statement demonstrates consistent monthly income and healthy savings behavior."
        )
    elif risk_category == "Medium":
        explanation_parts.append(
            f"Your predicted risk category is MEDIUM ({med_pct}% confidence). "
            f"The statement shows moderate monthly cash flow, with elevated expense-to-income ratios."
        )
    else:
        explanation_parts.append(
            f"Your predicted risk category is HIGH ({high_pct}% confidence). "
            f"The statement indicates potential financial distress, limited cash reserves, or frequent high debits relative to income."
        )

    if savings_rate > 0.25:
        explanation_parts.append(f"Strong savings rate of {savings_rate * 100:.1f}% positively boosts your score.")
    elif savings_rate < 0.10:
        explanation_parts.append(f"Low savings rate of {savings_rate * 100:.1f}% lowers your overall rating.")

    if negative_balance_count > 0:
        explanation_parts.append(f"Encountered {negative_balance_count} negative balance instance(s), resulting in a penalty.")

    explanation = " ".join(explanation_parts)

    return {
        "credit_score": final_score,
        "risk_category": risk_category,
        "risk_probabilities": prob_dict,
        "score_explanation": explanation
    }
