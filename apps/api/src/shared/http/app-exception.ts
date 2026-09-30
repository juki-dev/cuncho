import { HttpException, HttpStatus } from '@nestjs/common';

/** Excepción con `details` estructurados, que el filtro global serializa tal cual. */
export class AppException extends HttpException {
  constructor(status: HttpStatus, message: string, details?: unknown) {
    super({ message, details }, status);
  }
}
