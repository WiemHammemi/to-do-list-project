import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const VALID_STATUSES = ['pending', 'progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const OCR_API_URL = process.env.OCR_API_URL || "http://localhost:8000";

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

async function extractDataFromFile(file: File) {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension && ['pdf', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'].includes(fileExtension)) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${OCR_API_URL}/extract`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'extraction OCR");
    }

    const result: OCRResponse = await response.json();

    if (!result.success || !result.data.tables.length) {
      throw new Error(result.message || "Aucun tableau détecté dans le fichier");
    }

    const firstTable = result.data.tables[0];
    return firstTable.rows.map(row => {
      const formattedRow: Record<string, any> = {};
      firstTable.headers.forEach(header => {
        formattedRow[header] = row[header] || '';
      });
      return formattedRow;
    });
  } else {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }
}

function normalizeValue(value: string, type: 'status' | 'priority'): string {
  const valueLower = value.toLowerCase().trim();
  
  if (type === 'status') {
    if (VALID_STATUSES.includes(valueLower)) return valueLower;
    
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
    return statusMapping[valueLower] || 'pending';
  }
  
  if (type === 'priority') {
    if (VALID_PRIORITIES.includes(valueLower)) return valueLower;
    
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
    return priorityMapping[valueLower] || 'medium';
  }
  
  return valueLower;
}

function parseDate(dueDateStr: any): Date {
  if (typeof dueDateStr === 'number') {
    const excelDate = XLSX.SSF.parse_date_code(dueDateStr);
    if (!excelDate) throw new Error('Impossible de parser la date Excel');

    return new Date(
      excelDate.y,
      excelDate.m - 1,
      excelDate.d,
      excelDate.H || 0,
      excelDate.M || 0,
      excelDate.S || 0
    );
  }
  
  if (typeof dueDateStr === 'string') {
    const cleanDate = dueDateStr.trim();
    const dateParsed = new Date(cleanDate);
    
    if (!isNaN(dateParsed.getTime())) {
      return dateParsed;
    }
    
    const parts = cleanDate.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  
  throw new Error('Format de date invalide');
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mappingStr = formData.get("mapping") as string;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!mappingStr) {
      return NextResponse.json({ error: "Mapping des colonnes manquant" }, { status: 400 });
    }

    const mapping = JSON.parse(mappingStr);
    const data = await extractDataFromFile(file);

    const tasksToCreate: any[] = [];

    data.forEach((row: any) => {
      try {
        const title = row[mapping.title]?.toString().trim();
        const status = normalizeValue(row[mapping.status]?.toString() || '', 'status');
        const priority = normalizeValue(row[mapping.priority]?.toString() || '', 'priority');
        const dueDate = parseDate(row[mapping.due_date]);
        const description = mapping.description ? row[mapping.description]?.toString().trim() : null;

        if (title && status && priority && dueDate) {
          tasksToCreate.push({
            title,
            description,
            status,
            priority,
            due_date: dueDate,
            user_id: Number(session.user.id),
          });
        }
      } catch (err) {
        console.warn('Ligne ignorée lors de l\'import:', err);
      }
    });

    let imported = 0;
    if (tasksToCreate.length > 0) {
      const result = await prisma.task.createMany({
        data: tasksToCreate,
        skipDuplicates: true,
      });
      imported = result.count;
    }

    return NextResponse.json({
      success: true,
      imported,
      total: data.length,
      skipped: data.length - imported,
    });

  } catch (error: any) {
    console.error("Erreur lors de l'import:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}

