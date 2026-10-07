from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from ml.feature_engineering import FEATURE_COLUMNS

def get_preprocessing_pipeline() -> ColumnTransformer:
    """
    Creates a scikit-learn ColumnTransformer for numerical feature scaling
    and missing value imputation.
    """
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, FEATURE_COLUMNS)
        ],
        remainder='drop'
    )
    
    return preprocessor
