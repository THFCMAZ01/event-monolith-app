import { PrismaClient, RSVPStatus } from '@prisma/client';
import wsService from '../services/websocket.service';
import { ApiError } from '../utils/errors';

const prisma = new PrismaClient();

export class RSVPController {
  async createOrUpdateRSVP(
    userId: string,
    eventId: string,
    status: RSVPStatus
  ): Promise<any> {
    if (!Object.values(RSVPStatus).includes(status)) {
      throw new ApiError(400, 'Invalid RSVP status');
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
      throw new ApiError(404, 'Event not found');
    }

    if (!event.approved) {
      throw new ApiError(400, 'Cannot RSVP to unapproved event');
    }

    const existingRsvp = await prisma.rSVP.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });
  
      if (existingRsvp) {
        const updatedRsvp = await prisma.rSVP.update({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
          data: {
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
        wsService.notifyRSVPUpdated(updatedRsvp);
        return updatedRsvp;
      } else {
        const newRsvp = await prisma.rSVP.create({
            data: {
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
          wsService.notifyRSVPCreated(newRsvp);
          return newRsvp;
      }
  }

  async getRSVPsForEvent(eventId: string): Promise<any[]> {
    const rsvps = await prisma.rSVP.findMany({
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
    const rsvps = await prisma.rSVP.findMany({
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
    const existingRSVP = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!existingRSVP) {
      throw new ApiError(404, 'RSVP not found');
    }

    await prisma.rSVP.delete({
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
