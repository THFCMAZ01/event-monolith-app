import { PrismaClient, UserRole } from '@prisma/client';
import wsService from '../services/websocket.service';
import emailService from '../services/email.service';
import { ApiError } from '../utils/errors';
const prisma = new PrismaClient();
export class EventController {
    async getAllEvents() {
        const events = await prisma.event.findMany({
            where: { approved: true },
            include: {
                organizer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
            orderBy: { date: 'asc' },
        });
        return events;
    }
    async getAllEventsAdmin() {
        const events = await prisma.event.findMany({
            include: {
                organizer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
            orderBy: { date: 'asc' },
        });
        return events;
    }
    async getEventById(eventId) {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                rsvps: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!event) {
            throw new ApiError(404, 'Event not found');
        }
        return event;
    }
    async createEvent(userId, data) {
        const { title, description, date, location } = data;
        if (!title || !description || !date || !location) {
            throw new ApiError(400, 'All fields are required');
        }
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            throw new ApiError(400, 'Invalid date format');
        }
        if (eventDate < new Date()) {
            throw new ApiError(400, 'Event date must be in the future');
        }
        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: eventDate,
                location,
                organizerId: userId,
                approved: false,
            },
            include: {
                organizer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        wsService.notifyEventCreated(event);
        return event;
    }
    async updateEvent(eventId, userId, userRole, data) {
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!existingEvent) {
            throw new ApiError(404, 'Event not found');
        }
        if (existingEvent.organizerId !== userId && userRole !== UserRole.ADMIN) {
            throw new ApiError(403, 'You do not have permission to update this event');
        }
        let eventDate;
        if (data.date) {
            eventDate = new Date(data.date);
            if (isNaN(eventDate.getTime())) {
                throw new ApiError(400, 'Invalid date format');
            }
            if (eventDate < new Date()) {
                throw new ApiError(400, 'Event date must be in the future');
            }
        }
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description && { description: data.description }),
                ...(eventDate && { date: eventDate }),
                ...(data.location && { location: data.location }),
            },
            include: {
                organizer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        wsService.notifyEventUpdated(updatedEvent);
        return updatedEvent;
    }
    async deleteEvent(eventId, userId, userRole) {
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!existingEvent) {
            throw new ApiError(404, 'Event not found');
        }
        if (existingEvent.organizerId !== userId && userRole !== UserRole.ADMIN) {
            throw new ApiError(403, 'You do not have permission to delete this event');
        }
        await prisma.rsvp.deleteMany({
            where: { eventId },
        });
        await prisma.event.delete({
            where: { id: eventId },
        });
        wsService.notifyEventDeleted(eventId);
        return { message: 'Event deleted successfully' };
    }
    async approveEvent(eventId) {
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizer: true,
            },
        });
        if (!existingEvent) {
            throw new ApiError(404, 'Event not found');
        }
        if (existingEvent.approved) {
            throw new ApiError(400, 'Event is already approved');
        }
        const approvedEvent = await prisma.event.update({
            where: { id: eventId },
            data: { approved: true },
            include: {
                organizer: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        emailService.sendEventNotification(existingEvent.organizer.email, existingEvent.title, 'Your event has been approved and is now visible to all users!');
        wsService.notifyEventApproved(approvedEvent);
        return approvedEvent;
    }
}
export default new EventController();
