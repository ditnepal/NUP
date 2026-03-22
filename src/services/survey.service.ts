import prisma from '../lib/prisma';

export class SurveyService {
  async createSurvey(data: { title: string; description?: string; questions: any[] }) {
    return prisma.survey.create({
      data: {
        title: data.title,
        description: data.description,
        status: 'DRAFT',
        questions: {
          create: data.questions.map((q, idx) => ({
            text: q.text,
            type: q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            order: idx,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async getSurveys(status?: string) {
    return prisma.survey.findMany({
      where: status ? { status } : {},
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSurvey(id: string) {
    return prisma.survey.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async submitResponse(data: { surveyId: string; userId?: string; answers: { questionId: string; value: string }[] }) {
    return prisma.surveyResponse.create({
      data: {
        surveyId: data.surveyId,
        userId: data.userId,
        answers: {
          create: data.answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });
  }

  async getSurveyAnalytics(surveyId: string) {
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      include: { answers: true },
    });

    const questions = await prisma.surveyQuestion.findMany({
      where: { surveyId },
      orderBy: { order: 'asc' },
    });

    const analytics = questions.map((q) => {
      const qAnswers = responses.flatMap((r) => r.answers.filter((a) => a.questionId === q.id));
      const counts: Record<string, number> = {};
      qAnswers.forEach((a) => {
        counts[a.value] = (counts[a.value] || 0) + 1;
      });

      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        totalResponses: qAnswers.length,
        data: counts,
      };
    });

    return {
      surveyId,
      totalResponses: responses.length,
      analytics,
    };
  }

  // --- Polls ---
  async createPoll(data: { question: string; options: string[] }) {
    return prisma.poll.create({
      data: {
        question: data.question,
        status: 'ACTIVE',
        options: {
          create: data.options.map((o) => ({ text: o })),
        },
      },
      include: { options: true },
    });
  }

  async getPolls() {
    return prisma.poll.findMany({
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async votePoll(pollId: string, optionId: string, userId?: string) {
    return prisma.pollVote.create({
      data: { pollId, optionId, userId },
    });
  }
}

export const surveyService = new SurveyService();
