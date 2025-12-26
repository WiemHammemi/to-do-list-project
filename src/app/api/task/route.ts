import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";


export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
    }

    const tasks = await prisma.task.findMany({
        where: { user_id: Number(session.user.id) },
        orderBy: { created_at: "desc" },
    });

    return new Response(JSON.stringify(tasks), { status: 200 });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
    }

    const body = await request.json();
    const task = await prisma.task.create({
        data: {
            title: body.title,
            description: body.description ? body.description : null,
            status: body.status,
            priority: body.priority,
            due_date: new Date(body.due_date),
            user_id: Number(session.user.id)
        }
    });

    return new Response(JSON.stringify(task), { status: 201 });
}   