import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { isArray } from 'class-validator';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        return next.handle().pipe(
            map((data) => {
                if (request.requestId) {
                    return {
                        data: isArray(data) ? [...data]: data,
                        requestId: request.requestId,
                    };
                }
                return data;
            }),
        );
    }
}
