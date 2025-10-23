import { Context } from 'elysia';
import { UserRole } from '@prisma/client';
import { extractToken, verifyToken, JWTPayload } from '../utils/jwt.utils';

export interface AuthContext extends Context {
  user: JWTPayload;
}

export function authenticateUser(context: Context): JWTPayload {
  const authHeader = context.request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  return payload;
}

export function requireRole(allowedRoles: UserRole[]) {
  return (context: Context) => {
    const user = authenticateUser(context);
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
    }

    return user;
  };
}

export function requireAdmin(context: Context): JWTPayload {
  return requireRole([UserRole.ADMIN])(context);
}

export function requireOrganizerOrAdmin(context: Context): JWTPayload {
  return requireRole([UserRole.ORGANIZER, UserRole.ADMIN])(context);
}

export function requireAuth(context: Context): JWTPayload {
  return authenticateUser(context);
}
