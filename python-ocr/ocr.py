import sys
import os
from pathlib import Path

import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def is_valid_table(table_data):

    if not table_data or len(table_data) < 2:
        return False
    
    col_counts = [len(row) for row in table_data]
    if not col_counts:
        return False
    
    avg_cols = sum(col_counts) / len(col_counts)
    
    if avg_cols < 2:
        return False
    
    variance = sum((c - avg_cols) ** 2 for c in col_counts) / len(col_counts)
    
    if variance > avg_cols:
        return False
    
    total_cells = sum(col_counts)
    empty_cells = sum(1 for row in table_data for cell in row if not cell or str(cell).strip() == '')
    
    if empty_cells / total_cells > 0.7:
        return False
    
    return True


def extract_tables_from_pdf(pdf_path):
    try:
        import pdfplumber
    except ImportError:
        print(" pdfplumber non installé. Installez avec: pip install pdfplumber")
        return None
    
    tables_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables(table_settings={
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "explicit_vertical_lines": page.curves + page.edges,
                "explicit_horizontal_lines": page.curves + page.edges,
                "intersection_tolerance": 3,
            })
            
            valid_tables_count = 0
            for idx, table in enumerate(tables, 1):
                if is_valid_table(table):
                    valid_tables_count += 1
                    tables_data.append({
                        'page': page_num,
                        'table_index': valid_tables_count,
                        'data': table
                    })
    
    return tables_data


def preprocess_image_for_ocr(img):

    import cv2
    import numpy as np
    
    # Conversion en niveaux de gris
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Augmenter le contraste
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Débruitage plus agressif
    denoised = cv2.fastNlMeansDenoising(enhanced, None, h=10, templateWindowSize=7, searchWindowSize=21)
    
    # Binarisation Otsu (meilleure pour les tableaux)
    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Inversion si nécessaire
    if np.mean(binary) > 127:
        binary = cv2.bitwise_not(binary)
    
    return binary


def detect_table_cells(img):

    import cv2
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    
    # Détection lignes horizontales
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    
    # Détection lignes verticales
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
    vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    
    # Combiner pour obtenir la grille
    table_grid = cv2.add(horizontal_lines, vertical_lines)
    
    # Trouver les intersections (coins des cellules)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    table_grid = cv2.dilate(table_grid, kernel, iterations=2)
    
    # Trouver les contours des cellules
    contours, _ = cv2.findContours(cv2.bitwise_not(table_grid), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filtrer et trier les cellules
    cells = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = w * h
        
        # Filtrer les cellules trop petites ou trop grandes
        if 500 < area < (img.shape[0] * img.shape[1] * 0.9):
            cells.append((x, y, w, h))
    
    return cells


def organize_cells_into_grid(cells, tolerance=10):

    if not cells:
        return []
    
    # Trier par Y puis X
    cells = sorted(cells, key=lambda c: (c[1], c[0]))
    
    # Grouper par lignes (Y similaire)
    rows = []
    current_row = [cells[0]]
    
    for cell in cells[1:]:
        # Si Y est proche de la ligne courante
        if abs(cell[1] - current_row[0][1]) < tolerance:
            current_row.append(cell)
        else:
            # Nouvelle ligne
            rows.append(sorted(current_row, key=lambda c: c[0]))  # Trier par X
            current_row = [cell]
    
    if current_row:
        rows.append(sorted(current_row, key=lambda c: c[0]))
    
    return rows


def extract_text_from_cell(img, cell_coords, psm_mode=7):

    from PIL import Image
    
    x, y, w, h = cell_coords
    
    # Ajouter une petite marge
    margin = 5
    x = max(0, x + margin)
    y = max(0, y + margin)
    w = max(1, w - 2 * margin)
    h = max(1, h - 2 * margin)
    
    # Extraire la région
    cell_img = img[y:y+h, x:x+w]
    
    if cell_img.size == 0:
        return ""
    
    # Prétraiter
    processed = preprocess_image_for_ocr(cell_img)
    
    # Convertir pour Tesseract
    pil_img = Image.fromarray(processed)
    
    # Configuration Tesseract pour cellule unique
    custom_config = f'--oem 3 --psm {psm_mode} -c preserve_interword_spaces=1'
    
    # Extraire le texte
    text = pytesseract.image_to_string(pil_img, config=custom_config, lang='fra+eng')
    
    return text.strip()

def extract_tables_from_image(image_path):
    import cv2
    import numpy as np
    from PIL import Image
    import pytesseract

    # Charger l'image
    img = cv2.imread(image_path)
    if img is None:
        print("Impossible de charger l'image")
        return None

    # Redimensionner si trop petite
    height, width = img.shape[:2]
    if width < 2000:
        scale = 2500 / width
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # Convertir en niveaux de gris et binariser
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Détection des lignes horizontales et verticales
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
    horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    # Grille = intersections
    grid = cv2.bitwise_and(horizontal_lines, vertical_lines)
    intersections = cv2.dilate(grid, cv2.getStructuringElement(cv2.MORPH_RECT, (3,3)), iterations=2)

    # Trouver les points d'intersection
    ys, xs = np.where(intersections > 0)
    if len(xs) == 0 or len(ys) == 0:
        print("Aucune intersection détectée")
        return None

    # Créer des coordonnées uniques triées pour la grille
    unique_x = sorted(set(xs))
    unique_y = sorted(set(ys))

    # Fusionner les points très proches (tolérance = 10 px)
    def merge_close(lst, tol=10):
        merged = []
        for val in lst:
            if not merged or val - merged[-1] > tol:
                merged.append(val)
        return merged

    unique_x = merge_close(unique_x)
    unique_y = merge_close(unique_y)

    # Extraire le texte cellule par cellule
    table_data = []
    for i in range(len(unique_y)-1):
        row = []
        for j in range(len(unique_x)-1):
            x1, x2 = unique_x[j], unique_x[j+1]
            y1, y2 = unique_y[i], unique_y[i+1]
            cell_img = img[y1:y2, x1:x2]

            # Prétraitement cellule
            cell_gray = cv2.cvtColor(cell_img, cv2.COLOR_BGR2GRAY)
            _, cell_bin = cv2.threshold(cell_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            cell_bin = cv2.bitwise_not(cell_bin) if np.mean(cell_bin) > 127 else cell_bin

            pil_img = Image.fromarray(cell_bin)
            text = pytesseract.image_to_string(pil_img, config='--oem 3 --psm 7 -c preserve_interword_spaces=1', lang='fra+eng')
            row.append(text.strip())
        # Ajouter la ligne seulement si elle contient du texte
        if any(c.strip() for c in row):
            table_data.append(row)

    if not table_data:
        print("Aucun texte extrait")
        return None

    # Normaliser le nombre de colonnes
    max_cols = max(len(r) for r in table_data)
    for row in table_data:
        while len(row) < max_cols:
            row.append('')

    return [{'table_index': 1, 'data': table_data}]

import re

def clean_text(text):
    if not text:
        return ''
    text = text.strip()
    # Supprimer les barres verticales, tirets et underscores en début/fin
    text = re.sub(r'^[\|\-\_lIJ\[\] ]+', '', text)
    text = re.sub(r'[\|\-\_lIJ\[\] ]+$', '', text)
    # Remplacer multiples espaces par un seul
    text = re.sub(r'\s+', ' ', text)
    return text

def convert_tables_to_json(tables_data):
    import json
    
    result = {
        'total_tables': len(tables_data),
        'tables': []
    }
    
    for table_info in tables_data:
        table_data = table_info['data']
        
        if not table_data or len(table_data) < 1:
            continue
        
        # Premier ligne = headers
        headers = [h.strip() if h else f"col_{i}" for i, h in enumerate(table_data[0])]
        rows = table_data[1:] if len(table_data) > 1 else []
        
        # Convertir en liste de dictionnaires
        structured_data = []
        headers = [clean_text(h) if h else f"col_{i}" for i, h in enumerate(table_data[0])]
        for row in rows:
            row_dict = {}
            for i, header in enumerate(headers):
                value = clean_text(row[i]) if i < len(row) else ''
                row_dict[header] = value
            
            # Ajouter seulement si la ligne n'est pas complètement vide
            if any(v for v in row_dict.values()):
                structured_data.append(row_dict)
        
        table_entry = {
            'headers': headers,
            'rows': structured_data,

        }
        
        result['tables'].append(table_entry)
    
    return result 

def process_file(file_path: str):
    """
    Point d’entrée UNIQUE pour CMD et API
    """
    from pathlib import Path

    file_ext = Path(file_path).suffix.lower()

    if file_ext == '.pdf':
        tables = extract_tables_from_pdf(file_path)
    elif file_ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
        tables = extract_tables_from_image(file_path)
    else:
        raise ValueError(f"Format non supporté: {file_ext}")

    if not tables:
        return {
            "total_tables": 0,
            "tables": []
        }

    return convert_tables_to_json(tables)


def main():
    import sys
    import json

    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = input("Chemin du fichier : ").strip()

    file_path = file_path.strip('"').strip("'")

    if not os.path.exists(file_path):
        print("Fichier introuvable")
        return

    result = process_file(file_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()