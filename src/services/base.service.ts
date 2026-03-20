import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

export abstract class BaseService {
  protected db: PrismaClient;

  constructor() {
    this.db = prisma;
  }
}
