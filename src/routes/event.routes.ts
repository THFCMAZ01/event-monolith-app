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
    .use(requireAuth)
    .get('/', () => eventController.getAllEvents(), {
        detail: {
            summary: 'Get all approved events',
            tags: ['Events'],
        },
    })
    .group('/admin', (app) =>
        app
            .use(requireAdmin)
            .get('/all', () => eventController.getAllEvents(true), {
                detail: {
                    summary: 'Get all events (admin only)',
                    tags: ['Events'],
                },
            })
    )
    .get('/:id', ({ params }) => eventController.getEventById(params.id), {
        params: t.Object({
            id: t.String(),
        }),
        detail: {
            summary: 'Get event by ID',
            tags: ['Events'],
        },
    })
    .group('/', (app) =>
        app
            .use(requireOrganizerOrAdmin)
            .post('/', ({ body, user }) => eventController.createEvent(user.userId, body), {
                body: t.Object({
                    title: t.String({ minLength: 1 }),
                    description: t.String({ minLength: 1 }),
                    date: t.Date(), 
                    location: t.String({ minLength: 1 }),
                }),
                detail: {
                    summary: 'Create a new event',
                    tags: ['Events'],
                },
            })
            .put('/:id', ({ params, body, user }) => eventController.updateEvent(params.id, user.userId, user.role, body), {
                params: t.Object({
                    id: t.String(),
                }),
                body: t.Object({
                    title: t.Optional(t.String({ minLength: 1 })),
                    description: t.Optional(t.String({ minLength: 1 })),
                    date: t.Optional(t.Date()),
                    location: t.Optional(t.String({ minLength: 1 })),
                }),
                detail: {
                    summary: 'Update an event',
                    tags: ['Events'],
                },
            })
            .delete('/:id', ({ params, user }) => eventController.deleteEvent(params.id, user.userId, user.role), {
                params: t.Object({
                    id: t.String(),
                }),
                detail: {
                    summary: 'Delete an event',
                    tags: ['Events'],
                },
            })
    )
    .group('/', (app) =>
        app
            .use(requireAdmin)
            .put('/:id/approve', ({ params }) => eventController.approveEvent(params.id), {
                params: t.Object({
                    id: t.String(),
                }),
                detail: {
                    summary: 'Approve an event (admin only)',
                    tags: ['Events'],
                },
            })
    )
    .post('/:id/rsvp', ({ params, body, user }) => rsvpController.createOrUpdateRSVP(user.userId, params.id, body.status), {
        params: t.Object({
            id: t.String(),
        }),
        body: t.Object({
            status: t.Enum(RSVPStatus),
        }),
        detail: {
            summary: 'RSVP to an event',
            tags: ['RSVPs'],
        },
    })
    .get('/:id/rsvps', ({ params }) => rsvpController.getRSVPsForEvent(params.id), {
        params: t.Object({
            id: t.String(),
        }),
        detail: {
            summary: 'Get RSVPs for an event',
            tags: ['RSVPs'],
        },
    })
    .get('/user/rsvps', ({ user }) => rsvpController.getRSVPsForUser(user.userId), {
        detail: {
            summary: 'Get current user RSVPs',
            tags: ['RSVPs'],
        },
    })
    .delete('/:id/rsvp', ({ params, user }) => rsvpController.deleteRSVP(user.userId, params.id), {
        params: t.Object({
            id: t.String(),
        }),
        detail: {
            summary: 'Delete RSVP',
            tags: ['RSVPs'],
        },
    });
