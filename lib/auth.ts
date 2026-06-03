import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'aasa-medchem-fallback-secret-key-12345';
const COOKIE_NAME = 'aasa_auth_token';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
}

/**
 * Signs a JWT with the user payload.
 */
export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT and returns the user payload.
 */
export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch (error) {
    return null;
  }
}

/**
 * Gets the current authenticated user from session cookies.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Sets the auth token in HTTP-only cookies.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clears the auth session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
}
