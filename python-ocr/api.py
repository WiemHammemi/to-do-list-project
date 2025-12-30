from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import tempfile
import os
import sys

from ocr import process_file

app = FastAPI(title="OCR Table Extractor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED_EXT = [".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff"]

@app.get("/")
async def root():
    return {
        "message": "OCR API is running",
        "supported_formats": SUPPORTED_EXT
    }

@app.get("/health")
async def health_check():
    """Endpoint pour vérifier que l'API fonctionne"""
    return {"status": "healthy"}

@app.post("/extract")
async def extract_tables(file: UploadFile = File(...)):
    """
    Extrait les tableaux d'un fichier PDF ou image
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté. Formats acceptés: {', '.join(SUPPORTED_EXT)}"
        )
    
    file_content = await file.read()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    try:
        json_result = process_file(tmp_path)
        
        if not json_result["tables"]:
            return {
                "success": False,
                "data": json_result,
                "message": "Aucun tableau détecté dans le fichier"
            }
        
        return {
            "success": True,
            "data": json_result,
            "message": f"{json_result['total_tables']} tableau(x) détecté(s)"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement: {str(e)}"
        )
    
    finally:

        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)