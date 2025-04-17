import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        studentId: string;
        name: string;
        role: 'admin' | 'student';
      };
    }
  }
}

export {}; 