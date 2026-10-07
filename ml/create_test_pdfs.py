import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect
from pypdf import PdfReader, PdfWriter

def create_valid_pdf_statement(filename="valid_statement.pdf"):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("<b>GLOBAL TRUST BANK STATEMENT</b>", styles['Heading1']))
    elements.append(Paragraph("Account Holder: John Doe | Account No: 123456789012", styles['Normal']))
    elements.append(Spacer(1, 15))

    data = [
        ["Date", "Description / Narration", "Withdrawal (Dr)", "Deposit (Cr)", "Balance"],
        ["2026-01-01", "Monthly Salary Credit", "", "65000.00", "65000.00"],
        ["2026-01-02", "Apartment Rent", "18000.00", "", "47000.00"],
        ["2026-01-05", "Grocery Store", "3450.00", "", "43550.00"],
        ["2026-01-10", "Utility Bills", "2200.00", "", "41350.00"],
        ["2026-01-15", "Freelance Payment", "", "8500.00", "49850.00"],
        ["2026-02-01", "Monthly Salary Credit", "", "65000.00", "114850.00"],
        ["2026-02-03", "Apartment Rent", "18000.00", "", "96850.00"],
        ["2026-02-12", "E-commerce Purchase", "4500.00", "", "92350.00"],
        ["2026-03-01", "Monthly Salary Credit", "", "65000.00", "157350.00"],
        ["2026-03-05", "Apartment Rent", "18000.00", "", "139350.00"]
    ]

    t = Table(data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    elements.append(t)
    doc.build(elements)
    print(f"Created: {filename}")

def create_protected_pdf(input_pdf="test_files/valid_statement.pdf", output_pdf="test_files/protected_statement.pdf", password="Secret123"):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)
    with open(output_pdf, "wb") as f:
        writer.write(f)
    print(f"Created protected PDF: {output_pdf} (password: {password})")

def create_custom_layout_pdf(filename="custom_layout_statement.pdf"):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("<b>AXIS-STYLE BANK STATEMENT</b>", styles['Heading1']))
    elements.append(Spacer(1, 10))

    data = [
        ["Txn Date", "Transaction Details", "Amount", "Cr/Dr", "Closing Bal"],
        ["01/01/2026", "SALARY CREDIT TECHCORP", "75000.00", "CR", "75000.00"],
        ["03/01/2026", "RENT PAYMENT HOUSING", "20000.00", "DR", "55000.00"],
        ["08/01/2026", "SUPERMARKET SHOPPING", "4200.00", "DR", "50800.00"],
        ["15/01/2026", "INTEREST CREDIT", "1200.00", "CR", "52000.00"],
        ["01/02/2026", "SALARY CREDIT TECHCORP", "75000.00", "CR", "127000.00"],
        ["04/02/2026", "RENT PAYMENT HOUSING", "20000.00", "DR", "107000.00"]
    ]

    t = Table(data)
    t.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black)
    ]))
    elements.append(t)
    doc.build(elements)
    print(f"Created: {filename}")

def create_scanned_image_pdf(filename="scanned_image_statement.pdf"):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    elements = []
    d = Drawing(400, 300)
    d.add(Rect(10, 10, 380, 280, fillColor=colors.lightgrey, strokeColor=colors.darkgray))
    elements.append(d)
    doc.build(elements)
    print(f"Created: {filename}")

def create_corrupt_pdf(filename="corrupt_document.pdf"):
    with open(filename, "wb") as f:
        f.write(b"NOT_A_REAL_PDF_FILE_HEADER_DATA_123456789")
    print(f"Created: {filename}")

if __name__ == "__main__":
    os.makedirs("test_files", exist_ok=True)
    create_valid_pdf_statement("test_files/valid_statement.pdf")
    create_protected_pdf("test_files/valid_statement.pdf", "test_files/protected_statement.pdf", "Secret123")
    create_custom_layout_pdf("test_files/custom_layout_statement.pdf")
    create_scanned_image_pdf("test_files/scanned_image_statement.pdf")
    create_corrupt_pdf("test_files/corrupt_document.pdf")
