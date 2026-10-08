# 💳 Credify

### ML-Based Financial Document Analysis & Credit Risk Estimation

Credify is a full-stack Machine Learning application that analyzes financial documents such as bank statements and generates an estimated credit risk assessment and **Credify Score**.

It combines **document processing, data preprocessing, feature engineering, Machine Learning, FastAPI, PostgreSQL, and React** into one complete application.

> ⚠️ Credify is an educational project. The Credify Score is an estimated score and is not an official credit bureau score.

---

# 🚀 Key Features

- 📄 PDF and CSV financial document upload
- 🔐 Password-protected PDF processing
- 📁 Multiple document and folder upload
- 🔎 Transaction extraction and normalization
- 📊 Financial feature engineering
- 🤖 Random Forest-based risk prediction
- 🟢 Low / Medium / High risk classification
- 💯 Estimated Credify Score (300–850)
- 📈 Interactive dashboard
- 🗄️ PostgreSQL data storage
- 🔑 JWT authentication
- 📜 Analysis history

---

# 🔄 Complete Flow of Credify

    User
      ↓
    React Frontend
      ↓
    FastAPI Backend
      ↓
    PDF / CSV Processing
      ↓
    Transaction Extraction
      ↓
    Data Cleaning & Normalization
      ↓
    Feature Engineering
      ↓
    ML Preprocessing
      ↓
    Random Forest Classifier
      ↓
    Risk Prediction
      ↓
    Low / Medium / High Risk
      ↓
    Credify Score (300–850)
      ↓
    Dashboard
      ↓
    PostgreSQL

---

# 📄 Document Processing

Credify supports:

- CSV files
- Text-based PDFs
- Password-protected PDFs
- Multiple PDF/CSV files
- Folder uploads

Extracted transactions are converted into a common structure containing:

- Date
- Description
- Amount
- Transaction type
- Balance

Scanned/image-only PDFs are currently unsupported.

---

# 📊 Feature Engineering

Credify converts raw transactions into financial features such as:

- Monthly income
- Monthly expenses
- Savings rate
- Average balance
- Expense ratio
- Transaction count
- Credit/debit transaction count
- Income stability
- Large transaction count
- Negative balance count

---

# 🤖 Machine Learning

Credify uses a **Random Forest Classifier** for financial risk classification.

    Dataset
       ↓
    Data Cleaning
       ↓
    Feature Engineering
       ↓
    Train/Test Split
       ↓
    Preprocessing
       ↓
    Random Forest
       ↓
    Risk Prediction

The trained model is saved using **Joblib** and reused for user predictions.

User-uploaded documents are used for prediction and are not used to retrain the model during normal analysis.

---

# 💯 Credify Score

Credify generates an estimated score between **300 and 850** based on the financial analysis and predicted risk.

    300 ───────────────────────── 850
    High Risk       Medium       Low Risk

The score is a project-specific estimate and is **not equivalent to CIBIL, FICO, or any official credit score**.

---

# 🖥️ Dashboard

The dashboard presents:

- Credify Score
- Risk classification
- Income
- Expenses
- Savings rate
- Average balance
- Expense ratio
- Transaction information
- Previous analyses

---

# 🗄️ Database

Credify uses **PostgreSQL** with **SQLAlchemy**.

| Table | Purpose |
|---|---|
| `users` | User information |
| `documents` | Uploaded documents |
| `transactions` | Extracted transactions |
| `credit_analyses` | Risk analysis and scores |

---

# 🛠️ Technology Stack

### Frontend
React, Vite, Tailwind CSS, Axios, React Router, Recharts

### Backend
Python, FastAPI, SQLAlchemy, Pydantic, JWT

### Machine Learning
Pandas, NumPy, Scikit-learn, Joblib

### Document Processing
pdfplumber, Pandas

### Database
PostgreSQL

### Development
Git, GitHub, VS Code

---

# 📁 Project Structure

    Credify/
    ├── backend/
    ├── frontend/
    ├── ml/
    ├── test_files/
    ├── sample_bank_statement.csv
    └── README.md

---

# ⚙️ Setup

### Clone Repository

    git clone https://github.com/AnuraviiKhandelwal06/Credify.git
    cd Credify

### Backend

    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt

Create a `.env` file inside `backend`:

    DATABASE_URL=postgresql://username:password@localhost:5432/credify
    SECRET_KEY=your_secret_key

Run the backend:

    uvicorn app.main:app --reload

### Frontend

Open another terminal:

    cd frontend
    npm install
    npm run dev

---

# 🧪 Testing

Credify includes testing for:

- CSV processing
- PDF processing
- Password-protected PDFs
- Incorrect passwords
- Multiple documents
- Folder uploads
- PostgreSQL persistence
- ML prediction
- Analysis history

---

# ⚠️ Limitations

- Credify is not an official credit scoring system.
- The score should not be used for real lending decisions.
- Scanned PDFs are currently unsupported.
- Bank statement formats vary between institutions.
- ML results depend on the training dataset and document quality.

---

# 🚀 Future Scope

- OCR for scanned documents
- More bank statement formats
- Additional ML algorithms
- Advanced financial analytics
- Cloud deployment
- Improved security
- Mobile-friendly improvements

---

# 🎯 Objective

Credify demonstrates an end-to-end integration of:

**Document Processing + Data Preprocessing + Feature Engineering + Machine Learning + FastAPI + PostgreSQL + React**

It transforms raw financial documents into structured financial information, risk predictions, and an estimated Credify Score.

---

# 📜 Disclaimer

**Credify Score is an estimated score generated using financial information extracted from uploaded documents and an ML-based risk assessment model. It is intended for educational and analytical purposes only and is not an official credit bureau score or a financial lending recommendation.**