import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = 'Internal server error';
    
    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      // Nest standard exceptions often return { statusCode, message, error }
      // message can be an array of strings for validation errors
      message = res.message || res.error || res;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      message,
      code: status,
      status: 'error',
      timestamp: new Date().toISOString(),
      url: request.url,
    });
  }
}
