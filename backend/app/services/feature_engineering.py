import sys
import os

# Ensure ml directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from ml.feature_engineering import extract_features_from_transactions, FEATURE_COLUMNS

def generate_financial_features(df_transactions):
    """
    Wrapper to compute financial features from transactions DataFrame.
    """
    return extract_features_from_transactions(df_transactions)
