import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { userSchema } from "@/lib/validators/userSchema";



export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name , password} = userSchema.parse(body);

        // check if email already exists
        const existingUser = await prisma.users.findUnique({
            where: { email : email },
        });
        if(existingUser) {
            return NextResponse.json({message: "Email already in use"}, {status: 409});
        }

        const hashedPassword = await hash(password, 10); 

        const newUser = await prisma.users.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        const {password:  newUserPassword, ...rest} = newUser;

        return NextResponse.json({message: "User created successfully", userId: newUser.id}, {status: 201});
    } catch (error) {
        return NextResponse.json({message: "Internal Server Error"}, {status: 500});
    }
}