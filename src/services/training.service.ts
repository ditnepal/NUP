import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export class TrainingService {
  /**
   * Enroll a user in a course
   */
  async enrollUser(courseId: string, userId: string) {
    const enrollment = await prisma.enrollment.upsert({
      where: {
        courseId_userId: { courseId, userId },
      },
      update: { status: 'ENROLLED' },
      create: {
        courseId,
        userId,
        status: 'ENROLLED',
      },
    });

    await auditService.log({
      action: 'COURSE_ENROLLMENT',
      userId,
      entityType: 'Course',
      entityId: courseId,
      details: { enrollmentId: enrollment.id },
    });

    return enrollment;
  }

  /**
   * Update course progress
   */
  async updateProgress(courseId: string, userId: string, progress: number) {
    const enrollment = await prisma.enrollment.update({
      where: {
        courseId_userId: { courseId, userId },
      },
      data: {
        progress,
        status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    if (progress === 100) {
      // Award certificate
      await this.awardCertificate(courseId, userId);
    }

    return enrollment;
  }

  /**
   * Award a certificate for a course
   */
  async awardCertificate(courseId: string, userId: string) {
    const certificate = await prisma.certificate.create({
      data: {
        courseId,
        userId,
        issueDate: new Date(),
        certificateUrl: `/api/v1/training/certificates/${courseId}/${userId}`,
      },
    });

    await auditService.log({
      action: 'CERTIFICATE_AWARDED',
      userId,
      entityType: 'Certificate',
      entityId: certificate.id,
      details: { courseId },
    });

    return certificate;
  }

  /**
   * Submit a quiz attempt
   */
  async submitQuiz(quizId: string, userId: string, answers: number[]) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) throw new Error('Quiz not found');

    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (q.correctOption === answers[index]) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        passed,
      },
    });

    await auditService.log({
      action: 'QUIZ_SUBMITTED',
      userId,
      entityType: 'Quiz',
      entityId: quizId,
      details: { score, passed, attemptId: attempt.id },
    });

    return attempt;
  }

  /**
   * Record attendance for a live session
   */
  async recordAttendance(sessionId: string, userId: string, status: 'PRESENT' | 'ABSENT' | 'EXCUSED') {
    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        userId,
        status,
      },
    });

    await auditService.log({
      action: 'ATTENDANCE_RECORDED',
      userId,
      entityType: 'LiveSession',
      entityId: sessionId,
      details: { status, attendanceId: attendance.id },
    });

    return attendance;
  }

  /**
   * Get learner progress for a course
   */
  async getLearnerProgress(userId: string) {
    return await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            program: true,
            lessons: true,
          },
        },
      },
    });
  }
}

export const trainingService = new TrainingService();
