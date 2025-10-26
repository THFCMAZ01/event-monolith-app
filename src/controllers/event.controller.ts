
import { PrismaClient, UserRole } from '@prisma/client';
import wsService from '../services/websocket.service';
import emailService from '../services/email.service';
import { ApiError } from '../utils/errors';

const prisma = new PrismaClient();

export class EventController {
  async getAllEvents(isAdmin: boolean = false): Promise<any[]> {
    const events = await prisma.event.findMany({
      where: isAdmin ? {} : { approved: true },
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

  async getEventById(eventId: string): Promise<any> {
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

  async createEvent(userId: string, data: { title: string; description: string; date: Date; location: string; }): Promise<any> {
    if (!data.title || !data.description || !data.location) {
      throw new ApiError(400, 'Title, description, and location are required');
    }

    const eventDate = new Date(data.date);
    if (isNaN(eventDate.getTime())) {
      throw new ApiError(400, 'Invalid date format');
    }

    if (eventDate < new Date()) {
      throw new ApiError(400, 'Event date must be in the future');
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        date: eventDate,
        organizerId: userId,
        approved: true, // Auto-approve for now
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

  async updateEvent(
    eventId: string,
    userId: string,
    userRole: UserRole,
    data: Partial<{
      title: string;
      description: string;
      date: Date;
      location: string;
    }>
  ): Promise<any> {
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new ApiError(404, 'Event not found');
    }

    if (existingEvent.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ApiError(403, 'You do not have permission to update this event');
    }
    
    if (data.date && data.date < new Date()) {
      throw new ApiError(400, 'Event date must be in the future');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data,
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

  async deleteEvent(
    eventId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{ message: string }> {
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new ApiError(404, 'Event not found');
    }

    if (existingEvent.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ApiError(403, 'You do not have permission to delete this event');
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    wsService.notifyEventDeleted(eventId);

    return { message: 'Event deleted successfully' };
  }

  async approveEvent(eventId: string): Promise<any> {
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

    emailService.sendEventNotification(
      existingEvent.organizer.email,
      existingEvent.title,
      'Your event has been approved and is now visible to all users!'
    );

    wsService.notifyEventApproved(approvedEvent);

    return approvedEvent;
  }
}

export default new EventController();
