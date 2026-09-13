import type { Request, Response } from 'express';
import app from '../server/src/app.js';

// Vercel Serverless Function entrypoint
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
