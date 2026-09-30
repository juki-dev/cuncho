import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ErrorBody } from './error-response.dto';

const reason = (status: number): string =>
  (HttpStatus[status] ?? 'Error')
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** Normaliza todas las respuestas de error a `{ statusCode, error, message, details? }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: reason(HttpStatus.INTERNAL_SERVER_ERROR),
        message: 'Error interno del servidor',
      };
    }
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    const body: ErrorBody = { statusCode, error: reason(statusCode), message: exception.message };
    if (typeof payload === 'string') {
      body.message = payload;
    } else if (payload && typeof payload === 'object') {
      const p = payload as { message?: unknown; details?: unknown };
      if (Array.isArray(p.message)) {
        body.message = 'Datos de entrada inválidos';
        body.details = p.message;
      } else if (typeof p.message === 'string') {
        body.message = p.message;
      }
      if (p.details !== undefined) body.details = p.details;
    }
    return body;
  }
}
