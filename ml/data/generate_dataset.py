import os
import pandas as pd
import numpy as np

def generate_synthetic_credit_data(num_samples: int = 1200, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    
    data = []
    
    # Risk distributions: 40% Low, 35% Medium, 25% High
    samples_low = int(num_samples * 0.40)
    samples_medium = int(num_samples * 0.35)
    samples_high = num_samples - samples_low - samples_medium

    # Helper function with noise
    def sample_low_risk(n):
        rows = []
        for _ in range(n):
            inc = np.random.uniform(45000, 160000)
            exp_ratio = np.random.uniform(0.30, 0.62)
            exp = inc * exp_ratio
            sav_rate = (inc - exp) / inc
            avg_bal = inc * np.random.uniform(0.7, 3.5)
            tx_cnt = np.random.randint(20, 65)
            credit_cnt = np.random.randint(2, 6)
            debit_cnt = tx_cnt - credit_cnt
            inc_stab = np.random.uniform(0.75, 0.98)
            large_tx = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1])
            neg_bal = 0
            
            rows.append({
                "monthly_income": round(inc, 2),
                "monthly_expenses": round(exp, 2),
                "savings_rate": round(sav_rate, 4),
                "average_balance": round(avg_bal, 2),
                "transaction_count": tx_cnt,
                "credit_transaction_count": credit_cnt,
                "debit_transaction_count": debit_cnt,
                "income_stability": round(inc_stab, 4),
                "expense_ratio": round(exp_ratio, 4),
                "large_transaction_count": large_tx,
                "negative_balance_count": neg_bal,
                "credit_risk": "Low"
            })
        return rows

    def sample_medium_risk(n):
        rows = []
        for _ in range(n):
            inc = np.random.uniform(22000, 75000)
            exp_ratio = np.random.uniform(0.65, 0.88)
            exp = inc * exp_ratio
            sav_rate = (inc - exp) / inc
            avg_bal = inc * np.random.uniform(0.15, 0.70)
            tx_cnt = np.random.randint(15, 50)
            credit_cnt = np.random.randint(1, 4)
            debit_cnt = tx_cnt - credit_cnt
            inc_stab = np.random.uniform(0.40, 0.75)
            large_tx = np.random.choice([1, 2, 3, 4], p=[0.4, 0.3, 0.2, 0.1])
            neg_bal = np.random.choice([0, 1], p=[0.8, 0.2])
            
            rows.append({
                "monthly_income": round(inc, 2),
                "monthly_expenses": round(exp, 2),
                "savings_rate": round(sav_rate, 4),
                "average_balance": round(avg_bal, 2),
                "transaction_count": tx_cnt,
                "credit_transaction_count": credit_cnt,
                "debit_transaction_count": debit_cnt,
                "income_stability": round(inc_stab, 4),
                "expense_ratio": round(exp_ratio, 4),
                "large_transaction_count": large_tx,
                "negative_balance_count": neg_bal,
                "credit_risk": "Medium"
            })
        return rows

    def sample_high_risk(n):
        rows = []
        for _ in range(n):
            inc = np.random.uniform(10000, 42000)
            exp_ratio = np.random.uniform(0.89, 1.35)
            exp = inc * exp_ratio
            sav_rate = (inc - exp) / inc
            avg_bal = np.random.uniform(100, 7000)
            tx_cnt = np.random.randint(12, 55)
            credit_cnt = np.random.randint(1, 3)
            debit_cnt = tx_cnt - credit_cnt
            inc_stab = np.random.uniform(0.10, 0.45)
            large_tx = np.random.randint(2, 7)
            neg_bal = np.random.randint(1, 7)
            
            rows.append({
                "monthly_income": round(inc, 2),
                "monthly_expenses": round(exp, 2),
                "savings_rate": round(sav_rate, 4),
                "average_balance": round(avg_bal, 2),
                "transaction_count": tx_cnt,
                "credit_transaction_count": credit_cnt,
                "debit_transaction_count": debit_cnt,
                "income_stability": round(inc_stab, 4),
                "expense_ratio": round(exp_ratio, 4),
                "large_transaction_count": large_tx,
                "negative_balance_count": neg_bal,
                "credit_risk": "High"
            })
        return rows

    data.extend(sample_low_risk(samples_low))
    data.extend(sample_medium_risk(samples_medium))
    data.extend(sample_high_risk(samples_high))

    df = pd.DataFrame(data)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(__file__)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "credit_data.csv")
    df = generate_synthetic_credit_data()
    df.to_csv(out_path, index=False)
    print(f"Generated synthetic credit dataset with {len(df)} rows at: {out_path}")
