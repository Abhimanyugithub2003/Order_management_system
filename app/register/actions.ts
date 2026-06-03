'use server';

import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ActionResponse } from '../login/actions';

export async function registerAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: 'All fields are required.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    // Check if user already exists
    const existingRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingRes.rows.length > 0) {
      return { error: 'An account with this email already exists.' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (default role: SELLER)
    const insertRes = await query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, 'SELLER') 
       RETURNING id, name, email, role`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const newUser = insertRes.rows[0];

    // Sign session token
    const token = signToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    // Set cookie
    await setSessionCookie(token);
  } catch (error) {
    console.error('Registration action error:', error);
    return { error: 'An error occurred during registration. Please try again.' };
  }

  // Redirect to dashboard
  redirect('/');
}
