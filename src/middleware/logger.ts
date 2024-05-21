import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';

@Injectable()
export class Logger implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const log = `${new Date().toISOString()} - ${req.method} - ${req.originalUrl}\n`;
    fs.appendFileSync('request.log', log);
    next();
  }
}
