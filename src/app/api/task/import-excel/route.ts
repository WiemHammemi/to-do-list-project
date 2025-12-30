import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const VALID_STATUSES = ['pending', 'progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

interface ImportError {
    row: number;
    field: string;
    message: string;
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

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const errors: ImportError[] = [];
        const tasksToCreate: any[] = [];
        let skipped = 0;

        data.forEach((row: any, index: number) => {
            const rowNum = index + 2;

            try {
                const title = row[mapping.title]?.toString().trim();
                const status = row[mapping.status]?.toString().toLowerCase().trim();
                const priority = row[mapping.priority]?.toString().toLowerCase().trim();
                const dueDateStr = row[mapping.due_date];
                const description = mapping.description ? row[mapping.description]?.toString().trim() : null;

                if (!title || title.length === 0) {
                    errors.push({
                        row: rowNum,
                        field: 'title',
                        message: 'Le titre est obligatoire'
                    });
                    skipped++;
                    return;
                }

                let validStatus = status;
                if (!status || !VALID_STATUSES.includes(status)) {
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
                    validStatus = statusMapping[status] || 'pending';
                }

                let validPriority = priority;
                if (!priority || !VALID_PRIORITIES.includes(priority)) {
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
                    validPriority = priorityMapping[priority] || 'medium';
                }

                let dueDate: Date;
                try {
                    if (typeof dueDateStr === 'number') {

                        const excelDate = XLSX.SSF.parse_date_code(dueDateStr);
                        if (!excelDate) throw new Error('Impossible de parser la date Excel');

                        dueDate = new Date(
                            excelDate.y,
                            excelDate.m - 1,
                            excelDate.d,
                            excelDate.H || 0,
                            excelDate.M || 0,
                            excelDate.S || 0
                        );
                    } else if (typeof dueDateStr === 'string') {
                        const dateParsed = new Date(dueDateStr);
                        if (isNaN(dateParsed.getTime())) {
                            const parts = dueDateStr.split(/[\/\-\.]/);
                            if (parts.length === 3) {
                                dueDate = new Date(
                                    parseInt(parts[2]),
                                    parseInt(parts[1]) - 1,
                                    parseInt(parts[0])
                                );
                            } else {
                                throw new Error('Format de date invalide');
                            }
                        } else {
                            dueDate = dateParsed;
                        }
                    } else {
                        throw new Error('Date manquante');
                    }

                    if (isNaN(dueDate.getTime())) {
                        throw new Error('Date invalide');
                    }
                } catch (err) {
                    errors.push({
                        row: rowNum,
                        field: 'due_date',
                        message: `Date invalide: ${dueDateStr}`
                    });
                    skipped++;
                    return;
                }

                tasksToCreate.push({
                    title,
                    description,
                    status: validStatus,
                    priority: validPriority,
                    due_date: dueDate,
                    user_id: Number(session.user.id),
                });

            } catch (err: any) {
                errors.push({
                    row: rowNum,
                    field: 'general',
                    message: err.message || 'Erreur inconnue'
                });
                skipped++;
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
            imported,
            skipped,
            total: data.length,
            errors: errors.map(e => `Ligne ${e.row} (${e.field}): ${e.message}`),
        });

    } catch (error: any) {
        console.error("Erreur lors de l'import:", error);
        return NextResponse.json(
            { error: error.message || "Erreur lors de l'import" },
            { status: 500 }
        );
    }
}