'use server';

import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface ActionResponse {
  error?: string;
  success?: boolean;
}

export async function loginAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  try {
    // Find user in database
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    if (userRes.rows.length === 0) {
      return { error: 'Invalid email or password.' };
    }

    const user = userRes.rows[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { error: 'Invalid email or password.' };
    }

    // Sign JWT
    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Set cookie
    await setSessionCookie(token);
  } catch (error) {
    console.error('Login action error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  // Redirect to home page which will route to appropriate dashboard based on role
  redirect('/');
}

export async function logoutAction() {
  const { clearSessionCookie } = await import('@/lib/auth');
  await clearSessionCookie();
  redirect('/login');
}
