import { z } from 'zod';

//Define a schema for user registration data validation

export const userSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    name: z.string().min(2,'Name is required').max(100),
    password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password don't match",
});