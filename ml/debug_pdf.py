import pdfplumber
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
from app.services.document_parser import parse_pdf_document, is_header_row, is_junk_or_summary_row

pdf_path = r'backend/uploads/06efbf55a97f414d8a02b6c0eaf03050_Email_Statement_02102026225349407661.PDF'

print("=== INSPECTING REAL USER STATEMENT PDF ===")
with pdfplumber.open(pdf_path) as pdf:
    print(f"Num pages: {len(pdf.pages)}")
    for i, p in enumerate(pdf.pages):
        print(f"\n--- Page {i+1} Tables ---")
        tables = p.extract_tables()
        print(f"Default tables found: {len(tables)}")
        for t_idx, t in enumerate(tables):
            print(f"  Table {t_idx+1} rows: {len(t)}")
            for r_idx, r in enumerate(t):
                print(f"    Row {r_idx}: {r}")

        tables_text = p.extract_tables(table_settings={"vertical_strategy": "text", "horizontal_strategy": "text"})
        print(f"Text-strategy tables found: {len(tables_text)}")
        for t_idx, t in enumerate(tables_text):
            print(f"  Text Table {t_idx+1} rows: {len(t)}")

        print(f"\n--- Page {i+1} Raw Text ---")
        print(p.extract_text())

print("\n=== RUNNING CURRENT parse_pdf_document ===")
try:
    df = parse_pdf_document(pdf_path)
    print("Parsed DataFrame:")
    print(df)
    print(f"Total rows: {len(df)}")
except Exception as e:
    print("Error:", e)
