import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method.toUpperCase();

    if (
      !request.user ||
      !['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) ||
      request.path.startsWith('/audit-logs')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const resource = request.path.split('/').filter(Boolean)[0] || 'unknown';
        const action =
          { POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE' }[
            method
          ] || method;
        void this.auditLogsService.record({
          action,
          resource,
          resourceId: this.extractResourceId(request, result),
          method,
          path: request.path,
          statusCode: response.statusCode,
          actorEmail: request.user!.email,
          message: this.extractMessage(result),
          userId: request.user!.sub,
          organizationId: request.user!.organizationId,
        });
      }),
    );
  }

  private extractResourceId(
    request: Request,
    result: unknown,
  ): string | undefined {
    const response = result as Record<string, unknown> | undefined;
    const candidates = response
      ? [
          response.id,
          ...(Object.values(response).filter(
            (value) => value && typeof value === 'object',
          ) as Array<Record<string, unknown>>).map((value) => value.id),
        ]
      : [];
    const routeId = request.params.id;
    return (
      candidates.find((value) => typeof value === 'string') as
        | string
        | undefined
    ) || (typeof routeId === 'string' ? routeId : undefined);
  }

  private extractMessage(result: unknown): string | undefined {
    if (!result || typeof result !== 'object') return undefined;
    const message = (result as { message?: unknown }).message;
    return typeof message === 'string' ? message.slice(0, 500) : undefined;
  }
}
