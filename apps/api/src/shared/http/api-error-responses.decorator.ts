import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

/** Documenta en Swagger respuestas de error con el formato común. */
export const ApiErrorResponses = (...statuses: number[]) =>
  applyDecorators(...statuses.map((status) => ApiResponse({ status, type: ErrorResponseDto })));
