import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestId implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        req['requestId'] = uuidv4();
        next();
    }
}
