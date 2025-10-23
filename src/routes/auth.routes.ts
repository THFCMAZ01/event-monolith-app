import { Elysia, t } from 'elysia';
import authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/signup',
    async ({ body, set }) => {
      try {
        const result = await authController.signup(body);
        set.status = 201;
        return result;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.Enum(UserRole)),
      }),
      detail: {
        summary: 'Register a new user',
        tags: ['Auth'],
        description: 'Create a new user account. Default role is ATTENDEE. Sends welcome email via Ethereal.',
      },
    }
  )
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const result = await authController.login(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        set.status = 401;
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
      detail: {
        summary: 'Login user',
        tags: ['Auth'],
        description: 'Authenticate user and receive JWT token.',
      },
    }
  )
  .get(
    '/profile',
    async ({ request, set }) => {
      try {
        const user = requireAuth({ request } as any);
        const profile = await authController.getProfile(user.userId);
        return profile;
      } catch (error: any) {
        set.status = 401;
        return { error: error.message };
      }
    },
    {
      detail: {
        summary: 'Get current user profile',
        tags: ['Auth'],
        description: 'Get authenticated user information. Requires Bearer token.',
      },
    }
  );
