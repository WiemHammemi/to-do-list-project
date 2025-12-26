import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tasks");

  worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Titre", key: "title", width: 25 },
    { header: "Description", key: "description", width: 30 },
    { header: "Statut", key: "status", width: 15 },
    { header: "Priorité", key: "priority", width: 15 },
    { header: "Date d'échéance", key: "due_date", width: 20 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });


  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="structure.xlsx"',
    },
  });
}
