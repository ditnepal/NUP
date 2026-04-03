import prisma from '../lib/prisma';

export class SurveyService {
  async createSurvey(data: { title: string; description?: string; questions: any[]; audience?: string; placementType?: string; targetSlug?: string; orgUnitId?: string }) {
    return prisma.survey.create({
      data: {
        title: data.title,
        description: data.description,
        status: 'DRAFT',
        audience: data.audience || 'MEMBER',
        placementType: data.placementType || 'GENERAL',
        targetSlug: data.placementType === 'CONTENT_INLINE' && data.targetSlug ? data.targetSlug : null,
        orgUnitId: data.orgUnitId,
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

  async getSurveys(status?: string, orgUnitIds?: string[] | null, audience?: string | string[]) {
    const where: any = {};
    if (status) where.status = status;
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };
    if (audience) {
      if (Array.isArray(audience)) {
        where.audience = { in: audience };
      } else {
        where.audience = audience;
      }
    }

    return prisma.survey.findMany({
      where,
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSurvey(id: string) {
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!survey) return null;
    return {
      ...survey,
      questions: survey.questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
      })),
    };
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
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      include: { answers: true },
    });

    const questions = await prisma.surveyQuestion.findMany({
      where: { surveyId },
      orderBy: { order: 'asc' },
    });

    const analyticsQuestions = questions.map((q) => {
      const qAnswers = responses.flatMap((r) => r.answers.filter((a) => a.questionId === q.id));
      const counts: Record<string, number> = {};
      qAnswers.forEach((a) => {
        counts[a.value] = (counts[a.value] || 0) + 1;
      });

      return {
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options ? JSON.parse(q.options) : [],
        answers: counts,
      };
    });

    return {
      survey,
      totalResponses: responses.length,
      questions: analyticsQuestions,
    };
  }

  async updateSurveyStatus(id: string, status: string) {
    return prisma.survey.update({
      where: { id },
      data: { status },
    });
  }

  // --- Polls ---
  async createPoll(data: { question: string; options: string[]; audience?: string; placementType?: string; targetSlug?: string; orgUnitId?: string }) {
    return prisma.poll.create({
      data: {
        question: data.question,
        status: 'ACTIVE',
        audience: data.audience || 'MEMBER',
        placementType: data.placementType || 'GENERAL',
        targetSlug: data.placementType === 'CONTENT_INLINE' && data.targetSlug ? data.targetSlug : null,
        orgUnitId: data.orgUnitId,
        options: {
          create: data.options.map((o) => ({ text: o })),
        },
      },
      include: { options: true },
    });
  }

  async getPolls(orgUnitIds?: string[] | null, audience?: string | string[]) {
    const where: any = {};
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };
    if (audience) {
      if (Array.isArray(audience)) {
        where.audience = { in: audience };
      } else {
        where.audience = audience;
      }
    }

    return prisma.poll.findMany({
      where,
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

  async updatePollStatus(id: string, status: string) {
    return prisma.poll.update({
      where: { id },
      data: { status },
    });
  }
}

export const surveyService = new SurveyService();
