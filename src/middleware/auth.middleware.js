import { Elysia } from 'elysia';
import { UserRole } from '@prisma/client';
import { verifyToken } from '../utils/jwt.utils';
import { ApiError } from '../utils/errors';
export const isAuthenticated = (app) => app.derive(async ({ cookie, headers }) => {
    const auth = headers.authorization;
    let token;
    if (auth && auth.startsWith('Bearer ')) {
        token = auth.slice(7);
    }
    else if (cookie && cookie.auth) {
        // cookie.auth.value may be unknown per types; coerce to string
        token = String(cookie.auth.value);
    }
    if (!token) {
        throw new ApiError(401, 'Unauthorized: No token provided');
    }
    try {
        const user = await verifyToken(token);
        if (!user) {
            throw new ApiError(401, 'Unauthorized: Invalid token');
        }
        return { user, isAuthenticated: true };
    }
    catch (error) {
        throw new ApiError(401, 'Unauthorized: Invalid token');
    }
});
export const requireRole = (allowedRoles) => (app) => app.use(isAuthenticated).guard({
    beforeHandle(ctx) {
        const user = ctx.user;
        if (!user || !allowedRoles.includes(user.role)) {
            throw new ApiError(403, `Access denied. Required role: ${allowedRoles.join(' or ')}`);
        }
    },
});
export const requireAuth = new Elysia().use(isAuthenticated);
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireOrganizerOrAdmin = requireRole([UserRole.ORGANIZER, UserRole.ADMIN]);
