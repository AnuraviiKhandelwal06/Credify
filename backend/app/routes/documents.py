import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.schemas.document import DocumentResponse
from app.services.document_parser import parse_document

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {"csv", "pdf"}
MAX_FILE_SIZE_MB = 10

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file filename provided.")

    # Strip relative folder path prefixes if present (e.g. 'folder/file.pdf' or 'folder\file.pdf')
    raw_filename = os.path.basename(file.filename.replace('\\', '/'))
    if not raw_filename:
        raw_filename = file.filename

    ext = raw_filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '.{ext}'. Supported formats: CSV, PDF."
        )

    # Read content to check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE_MB}MB."
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Save to disk using sanitized basename
    unique_filename = f"{uuid.uuid4().hex}_{raw_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)

    # Create Document record with clean file_name
    doc = Document(
        user_id=current_user.id,
        file_name=raw_filename,
        file_type=ext,
        processing_status="PENDING"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Parse transactions
    try:
        df_transactions = parse_document(file_path, ext, password=password)
        
        # Save parsed transactions to DB
        transaction_objects = []
        for _, row in df_transactions.iterrows():
            tx = Transaction(
                document_id=doc.id,
                transaction_date=str(row.get('date', '')),
                description=str(row.get('description', '')),
                amount=float(row.get('amount', 0.0)),
                transaction_type=str(row.get('transaction_type', 'DEBIT')),
                balance=float(row.get('balance', 0.0))
            )
            transaction_objects.append(tx)

        db.bulk_save_objects(transaction_objects)
        doc.processing_status = "PROCESSED"
        db.commit()
        db.refresh(doc)

        return DocumentResponse.model_validate(doc)

    except HTTPException as he:
        doc.processing_status = "FAILED"
        db.commit()
        raise he
    except Exception as e:
        doc.processing_status = "FAILED"
        db.commit()
        err_msg = str(e) if str(e) else "Unable to extract transactions from this document."
        raise HTTPException(status_code=400, detail=f"Unable to extract transactions from this document: {err_msg}")

@router.get("", response_model=List[DocumentResponse])
def get_user_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()
    return [DocumentResponse.model_validate(d) for d in docs]

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_by_id(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentResponse.model_validate(doc)
