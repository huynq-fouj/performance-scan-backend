import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');
  
  // Configure CORS using ENV
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || '*';
  
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    methods: configService.get<string>('CORS_METHODS') || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: configService.get<boolean>('CORS_CREDENTIALS') ?? true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
