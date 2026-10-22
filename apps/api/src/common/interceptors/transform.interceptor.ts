import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        // If handler already returned custom format with data/meta/message
        if (res && typeof res === 'object' && ('data' in res || 'message' in res)) {
          return {
            success: res.success !== undefined ? res.success : true,
            message: res.message || 'Operasi berhasil',
            data: res.data !== undefined ? res.data : res,
            ...(res.meta !== undefined ? { meta: res.meta } : {}),
          };
        }

        return {
          success: true,
          message: 'Operasi berhasil',
          data: res,
        };
      }),
    );
  }
}
