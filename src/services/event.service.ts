import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export class EventService {
  async createEvent(data: {
    title: string;
    description?: string;
    type: string;
    startDate: Date;
    endDate?: Date;
    location: string;
    isVirtual?: boolean;
    meetingUrl?: string;
    capacity?: number;
    organizerId?: string;
  }) {
    const event = await prisma.event.create({
      data,
    });

    await auditService.log({
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: event.id,
      details: { title: event.title },
    });

    return event;
  }

  async registerForEvent(data: {
    eventId: string;
    userId?: string;
    fullName: string;
    email: string;
    phone?: string;
    notes?: string;
  }) {
    const registration = await prisma.eventRegistration.create({
      data,
    });

    await auditService.log({
      action: 'EVENT_REGISTERED',
      userId: data.userId,
      entityType: 'EventRegistration',
      entityId: registration.id,
      details: { eventId: data.eventId },
    });

    return registration;
  }

  async markAttendance(registrationId: string, status: 'ATTENDED' | 'NO_SHOW') {
    const registration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        attendanceDate: status === 'ATTENDED' ? new Date() : null,
      },
    });

    await auditService.log({
      action: 'EVENT_ATTENDANCE_MARKED',
      entityType: 'EventRegistration',
      entityId: registrationId,
      details: { status },
    });

    return registration;
  }

  async addSpeaker(eventId: string, data: { name: string; title?: string; bio?: string; photoUrl?: string }) {
    return await prisma.eventSpeaker.create({
      data: {
        eventId,
        ...data,
      },
    });
  }

  async addAgendaItem(eventId: string, data: { startTime: Date; endTime: Date; title: string; description?: string }) {
    return await prisma.eventAgenda.create({
      data: {
        eventId,
        ...data,
      },
    });
  }

  async getEventDetails(eventId: string) {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        speakers: true,
        agenda: { orderBy: { startTime: 'asc' } },
        registrations: {
          include: { user: true },
        },
      },
    });
  }
}

export const eventService = new EventService();
