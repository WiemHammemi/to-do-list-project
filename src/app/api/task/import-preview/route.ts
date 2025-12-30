
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const OCR_API_URL = process.env.OCR_API_URL || "http://localhost:8000";
const VALID_STATUSES = ['pending', 'progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

interface OCRResponse {
  success: boolean;
  data: {
    total_tables: number;
    tables: Array<{
      headers: string[];
      rows: Array<Record<string, string>>;
    }>;
  };
  message?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

async function processWithOCR(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${OCR_API_URL}/extract`, {  
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'OCR");
    }

    const result: OCRResponse = await response.json();

    if (!result.success || !result.data.tables.length) {
      throw new Error(result.message || "Aucun tableau détecté");
    }

    const firstTable = result.data.tables[0];
    const headers = firstTable.headers;
    const rows = firstTable.rows;

    const data = rows.map(row => {
      const formattedRow: Record<string, any> = {};
      headers.forEach((header) => {
        formattedRow[header] = row[header] || '';
      });
      return formattedRow;
    });

    return {
      columns: headers,
      data: data,
    };
  } catch (error) {
    console.error("Erreur OCR:", error);
    throw error;
  }
}

function validateRow(
  row: any, 
  mapping: Record<string, string>, 
  rowNum: number
): ValidationError | null {
  try {

    const title = row[mapping.title]?.toString().trim();
    if (!title || title.length === 0) {
      return {
        row: rowNum,
        field: 'title',
        message: 'Le titre est obligatoire'
      };
    }


    const status = row[mapping.status]?.toString().toLowerCase().trim();
    if (!status) {
      return {
        row: rowNum,
        field: 'status',
        message: 'Le statut est obligatoire'
      };
    }

    const statusMapping: Record<string, string> = {
      'en attente': 'pending',
      'attente': 'pending',
      'todo': 'pending',
      'à faire': 'pending',
      'en cours': 'progress',
      'cours': 'progress',
      'in progress': 'progress',
      'doing': 'progress',
      'terminé': 'completed',
      'terminée': 'completed',
      'done': 'completed',
      'fini': 'completed',
      'complete': 'completed',
    };

    const validStatus = VALID_STATUSES.includes(status) ? status : statusMapping[status];
    if (!validStatus) {
      return {
        row: rowNum,
        field: 'status',
        message: `Statut invalide: "${status}". Valeurs acceptées: pending, progress, completed`
      };
    }

    const priority = row[mapping.priority]?.toString().toLowerCase().trim();
    if (!priority) {
      return {
        row: rowNum,
        field: 'priority',
        message: 'La priorité est obligatoire'
      };
    }

    const priorityMapping: Record<string, string> = {
      'haute': 'high',
      'élevée': 'high',
      'elevee': 'high',
      'urgent': 'high',
      'importante': 'high',
      'moyenne': 'medium',
      'normal': 'medium',
      'normale': 'medium',
      'moyen': 'medium',
      'basse': 'low',
      'faible': 'low',
      'bas': 'low',
    };

    const validPriority = VALID_PRIORITIES.includes(priority) ? priority : priorityMapping[priority];
    if (!validPriority) {
      return {
        row: rowNum,
        field: 'priority',
        message: `Priorité invalide: "${priority}". Valeurs acceptées: low, medium, high`
      };
    }

    const dueDateStr = row[mapping.due_date];
    if (!dueDateStr) {
      return {
        row: rowNum,
        field: 'due_date',
        message: 'La date d\'échéance est obligatoire'
      };
    }

    let dueDate: Date;
    try {
      if (typeof dueDateStr === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(dueDateStr);
        if (!excelDate) throw new Error('Format Excel invalide');

        dueDate = new Date(
          excelDate.y,
          excelDate.m - 1,
          excelDate.d,
          excelDate.H || 0,
          excelDate.M || 0,
          excelDate.S || 0
        );
      } else if (typeof dueDateStr === 'string') {
        const cleanDate = dueDateStr.trim();
        const dateParsed = new Date(cleanDate);
        
        if (!isNaN(dateParsed.getTime())) {
          dueDate = dateParsed;
        } else {
          const parts = cleanDate.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              dueDate = new Date(year, month, day);
            } else {
              throw new Error('Format invalide');
            }
          } else {
            throw new Error('Format invalide');
          }
        }
      } else {
        throw new Error('Type de date non supporté');
      }

      if (isNaN(dueDate.getTime())) {
        throw new Error('Date invalide');
      }
    } catch (err) {
      return {
        row: rowNum,
        field: 'due_date',
        message: `Date invalide: "${dueDateStr}". Format attendu: JJ/MM/AAAA`
      };
    }

    return null;
  } catch (err: any) {
    return {
      row: rowNum,
      field: 'general',
      message: err.message || 'Erreur inconnue'
    };
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mappingStr = formData.get("mapping") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 10 MB" },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let detectedColumns: string[] = [];
    let data: any[] = [];

    if (fileExtension && ['pdf', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'].includes(fileExtension)) {
      const ocrResult = await processWithOCR(file);
      detectedColumns = ocrResult.columns;
      data = ocrResult.data;
    } else if (fileExtension && ['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return NextResponse.json(
          { error: "Le fichier ne contient aucune donnée" },
          { status: 400 }
        );
      }

      const firstRow = data[0] as Record<string, any>;
      detectedColumns = Object.keys(firstRow);
    } else {
      return NextResponse.json(
        { error: "Format de fichier non supporté" },
        { status: 400 }
      );
    }

    const suggestedMapping: Record<string, string> = {};
    const patterns = {
      title: /^(titre|title|nom|name|tache|task|sujet|subject|intitulé|objet)$/i,
      description: /^(description|desc|détails|details|commentaire|comment|notes?)$/i,
      status: /^(statut|status|état|state|etat)$/i,
      priority: /^(priorité|priority|priorite|importance|urgent)$/i,
      due_date: /^(date|échéance|echeance|deadline|due[_\s]?date|date[_\s]?limite|date[_\s]?fin)$/i,
    };

    detectedColumns.forEach((col) => {
      const colLower = col.toLowerCase().trim();
      for (const [field, pattern] of Object.entries(patterns)) {
        if (pattern.test(colLower) && !suggestedMapping[field]) {
          suggestedMapping[field] = col;
        }
      }
    });

    let validationErrors: ValidationError[] = [];
    let validRowsCount = 0;

    if (mappingStr) {
      const mapping = JSON.parse(mappingStr);

      const requiredFields = ['title', 'status', 'priority', 'due_date'];
      const missingFields = requiredFields.filter(field => !mapping[field]);

      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Champs requis manquants dans le mapping: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }

      data.forEach((row, index) => {
        const error = validateRow(row, mapping, index + 1);
        if (error) {
          validationErrors.push(error);
        } else {
          validRowsCount++;
        }
      });
    }

    const previewRows = data.slice(0, 5).map((row: any) => {
      const previewRow: Record<string, any> = {};
      detectedColumns.forEach((col) => {
        previewRow[col] = row[col];
      });
      return previewRow;
    });

    return NextResponse.json({
      columns: detectedColumns,
      suggestedMapping,
      preview: {
        rows: previewRows,
        totalRows: data.length,
      },
      validation: mappingStr ? {
        isValid: validationErrors.length === 0,
        validRowsCount,
        errors: validationErrors.map(e => 
          `Ligne ${e.row} (${e.field}): ${e.message}`
        ),
      } : null,
    });

  } catch (error: any) {
    console.error("Erreur lors de l'analyse du fichier:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse du fichier" },
      { status: 500 }
    );
  }
}