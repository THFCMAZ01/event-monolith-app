import { Elysia, t } from 'elysia';
import eventController from '../controllers/event.controller';
import rsvpController from '../controllers/rsvp.controller';
import {
  requireAuth,
  requireOrganizerOrAdmin,
  requireAdmin,
} from '../middleware/auth.middleware';
import { RSVPStatus } from '@prisma/client';

export const eventRoutes = new Elysia({ prefix: '/events' })
  .get(
    '/',
    async ({ request, set }) => {
      try {
        requireAuth({ request } as any);
        const events = await eventController.getAllEvents();
        return events;
      } catch (error: any) {
        set.status = 401;
        return { error: error.message };
      }
    },
    {
      detail: {
        summary: 'Get all approved events',
        tags: ['Events'],
        description: 'Fetch all approved events. Requires authentication.',
      },
    }
  )
  .get(
    '/admin/all',
    async ({ request, set }) => {
      try {
        requireAdmin({ request } as any);
        const events = await eventController.getAllEventsAdmin();
        return events;
      } catch (error: any) {
        set.status = error.message.includes('Access denied') ? 403 : 401;
        return { error: error.message };
      }
    },
    {
      detail: {
        summary: 'Get all events (admin only)',
        tags: ['Events'],
        description: 'Fetch all events including unapproved. Admin only.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, request, set }) => {
      try {
        requireAuth({ request } as any);
        const event = await eventController.getEventById(params.id);
        return event;
      } catch (error: any) {
        set.status = error.message === 'Event not found' ? 404 : 401;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Get event by ID',
        tags: ['Events'],
        description: 'Fetch a single event with RSVPs.',
      },
    }
  )
  .post(
    '/',
    async ({ body, request, set }) => {
      try {
        const user = requireOrganizerOrAdmin({ request } as any);
        const event = await eventController.createEvent(user.userId, body);
        set.status = 201;
        return event;
      } catch (error: any) {
        set.status = error.message.includes('Access denied') ? 403 : 400;
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        date: t.String(),
        location: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: 'Create a new event',
        tags: ['Events'],
        description: 'Create event (requires ORGANIZER or ADMIN role). Event needs admin approval.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, request, set }) => {
      try {
        const user = requireOrganizerOrAdmin({ request } as any);
        const event = await eventController.updateEvent(
          params.id,
          user.userId,
          user.role,
          body
        );
        return event;
      } catch (error: any) {
        set.status = error.message.includes('permission') ? 403 : 400;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String({ minLength: 1 })),
        date: t.Optional(t.String()),
        location: t.Optional(t.String({ minLength: 1 })),
      }),
      detail: {
        summary: 'Update an event',
        tags: ['Events'],
        description: 'Update event (organizer who created it or admin).',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, request, set }) => {
      try {
        const user = requireOrganizerOrAdmin({ request } as any);
        const result = await eventController.deleteEvent(
          params.id,
          user.userId,
          user.role
        );
        return result;
      } catch (error: any) {
        set.status = error.message.includes('permission') ? 403 : 400;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Delete an event',
        tags: ['Events'],
        description: 'Delete event (organizer who created it or admin).',
      },
    }
  )
  .put(
    '/:id/approve',
    async ({ params, request, set }) => {
      try {
        requireAdmin({ request } as any);
        const event = await eventController.approveEvent(params.id);
        return event;
      } catch (error: any) {
        set.status = error.message.includes('Access denied') ? 403 : 400;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Approve an event (admin only)',
        tags: ['Events'],
        description: 'Approve event to make it visible to all users.',
      },
    }
  )
  .post(
    '/:id/rsvp',
    async ({ params, body, request, set }) => {
      try {
        const user = requireAuth({ request } as any);
        const rsvp = await rsvpController.createOrUpdateRSVP(
          user.userId,
          params.id,
          body.status
        );
        set.status = 201;
        return rsvp;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Enum(RSVPStatus),
      }),
      detail: {
        summary: 'RSVP to an event',
        tags: ['RSVPs'],
        description: 'Create or update RSVP status for an event.',
      },
    }
  )
  .get(
    '/:id/rsvps',
    async ({ params, request, set }) => {
      try {
        requireAuth({ request } as any);
        const rsvps = await rsvpController.getRSVPsForEvent(params.id);
        return rsvps;
      } catch (error: any) {
        set.status = 401;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Get RSVPs for an event',
        tags: ['RSVPs'],
        description: 'Fetch all RSVPs for a specific event.',
      },
    }
  )
  .get(
    '/user/rsvps',
    async ({ request, set }) => {
      try {
        const user = requireAuth({ request } as any);
        const rsvps = await rsvpController.getRSVPsForUser(user.userId);
        return rsvps;
      } catch (error: any) {
        set.status = 401;
        return { error: error.message };
      }
    },
    {
      detail: {
        summary: 'Get current user RSVPs',
        tags: ['RSVPs'],
        description: 'Fetch all RSVPs for authenticated user.',
      },
    }
  )
  .delete(
    '/:id/rsvp',
    async ({ params, request, set }) => {
      try {
        const user = requireAuth({ request } as any);
        const result = await rsvpController.deleteRSVP(user.userId, params.id);
        return result;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Delete RSVP',
        tags: ['RSVPs'],
        description: 'Remove RSVP from an event.',
      },
    }
  );
