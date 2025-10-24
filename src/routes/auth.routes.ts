import { Elysia, t } from 'elysia';
import authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/signup',
    ({ body }) => authController.signup(body),
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.Enum(UserRole)),
      }),
      detail: {
        summary: 'Register a new user',
        tags: ['Auth'],
      },
    }
  )
  .post(
    '/login',
    ({ body }) => authController.login(body),
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
      detail: {
        summary: 'Login user',
        tags: ['Auth'],
      },
    }
  )
  .use(requireAuth)
  .get(
    '/profile',
    ({ user }) => authController.getProfile(user.userId),
    {
      detail: {
        summary: 'Get current user profile',
        tags: ['Auth'],
      },
    }
  );
