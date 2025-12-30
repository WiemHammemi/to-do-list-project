import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 5 MB" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Le fichier ne contient aucune donnée" },
        { status: 400 }
      );
    }

    const firstRow = data[0] as Record<string, any>;
    const detectedColumns = Object.keys(firstRow);

    const suggestedMapping: Record<string, string> = {};

    const patterns = {
      title: /^(titre|title|nom|name|tache|task|sujet|subject|intitulé)$/i,
      description: /^(description|desc|détails|details|commentaire|comment|notes?)$/i,
      status: /^(statut|status|état|state|etat)$/i,
      priority: /^(priorité|priority|priorite|importance|urgent)$/i,
      due_date: /^(date|échéance|echeance|deadline|due[_\s]?date|date[_\s]?limite)$/i,
    };

    detectedColumns.forEach((col) => {
      const colLower = col.toLowerCase().trim();
      
      for (const [field, pattern] of Object.entries(patterns)) {
        if (pattern.test(colLower) && !suggestedMapping[field]) {
          suggestedMapping[field] = col;
        }
      }
    });

    const previewRows = data.slice(0, 3).map((row: any) => {
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
    });

  } catch (error: any) {
    console.error("Erreur lors de l'analyse du fichier:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse du fichier" },
      { status: 500 }
    );
  }
}