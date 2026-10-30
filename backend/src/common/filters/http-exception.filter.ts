import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// Respuestas que interesan para detectar abuso: se registran sin cuerpo ni credenciales.
const AUDITED_STATUSES = new Set<number>([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.TOO_MANY_REQUESTS,
]);

/** Errores de body-parser (JSON roto, cuerpo demasiado grande): su mensaje describe el parser, no la API. */
function bodyParserError(exception: unknown): { status: number; message: string } | null {
  const candidates = [exception, (exception as { cause?: unknown })?.cause];
  for (const candidate of candidates) {
    const type = (candidate as { type?: unknown } | null)?.type;
    if (type === 'entity.parse.failed') {
      return { status: HttpStatus.BAD_REQUEST, message: 'La solicitud está mal formada' };
    }
    if (type === 'entity.too.large') {
      return { status: HttpStatus.PAYLOAD_TOO_LARGE, message: 'El cuerpo de la solicitud es demasiado grande' };
    }
  }
  // Nest convierte el SyntaxError/URIError de Express en BadRequestException(err.message) y pierde el tipo.
  if (exception instanceof BadRequestException && /JSON|URI malformed|Failed to decode param/.test(exception.message)) {
    return { status: HttpStatus.BAD_REQUEST, message: 'La solicitud está mal formada' };
  }
  return null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Security');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let errors: unknown;

    const parseError = bodyParserError(exception);
    if (parseError) {
      status = parseError.status;
      message = parseError.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const parsed = body as { message?: string | string[]; errors?: unknown };
        message = parsed.message ?? message;
        errors = parsed.errors;
      }
    } else {
      // Nunca exponer detalles internos; se registra del lado del servidor.
      console.error('[unhandled]', exception);
    }

    if (AUDITED_STATUSES.has(status)) {
      this.logger.warn(`${status} ${request.method} ${request.path} ip=${request.ip}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
