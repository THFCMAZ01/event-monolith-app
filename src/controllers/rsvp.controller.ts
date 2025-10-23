import { PrismaClient, RSVPStatus } from '@prisma/client';
import wsService from '../services/websocket.service';

const prisma = new PrismaClient();

export class RSVPController {
  async createOrUpdateRSVP(
    userId: string,
    eventId: string,
    status: RSVPStatus
  ): Promise<any> {
    if (!Object.values(RSVPStatus).includes(status)) {
      throw new Error('Invalid RSVP status');
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.approved) {
      throw new Error('Cannot RSVP to unapproved event');
    }

    const rsvp = await prisma.rsvp.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        eventId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
    });

    if (rsvp.createdAt.getTime() === new Date().getTime()) {
      wsService.notifyRSVPCreated(rsvp);
    } else {
      wsService.notifyRSVPUpdated(rsvp);
    }

    return rsvp;
  }

  async getRSVPsForEvent(eventId: string): Promise<any[]> {
    const rsvps = await prisma.rsvp.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rsvps;
  }

  async getRSVPsForUser(userId: string): Promise<any[]> {
    const rsvps = await prisma.rsvp.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rsvps;
  }

  async deleteRSVP(userId: string, eventId: string): Promise<{ message: string }> {
    const existingRSVP = await prisma.rsvp.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!existingRSVP) {
      throw new Error('RSVP not found');
    }

    await prisma.rsvp.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return { message: 'RSVP deleted successfully' };
  }
}

export default new RSVPController();
