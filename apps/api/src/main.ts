import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('SIAKAD_API');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim());

  // Security Middleware
  app.use(helmet());
  app.use(((cookieParser as any).default || cookieParser)());

  // CORS Configuration for Next.js web and mobile applications
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl)
      if (!origin) return callback(null, true);
      const isVercelDomain = /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin);
      if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production' || isVercelDomain) {
        return callback(null, true);
      }
      return callback(new Error('Akses diblokir oleh kebijakan CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // REST API prefix /api/v1
  app.setGlobalPrefix('api/v1');

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Interceptor and Exception Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIAKAD API - SMA Pemberdayaan Bangsa Ngrayun')
    .setDescription(
      'Dokumentasi resmi REST API Sistem Informasi Absensi Kehadiran Akurat Digital (SIAKAD) untuk Web Next.js dan Android Flutter.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 SIAKAD Backend running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/v1/docs`);
  logger.log(`🌏 Timezone Configured: Asia/Jakarta`);
  logger.log(`====================================================`);
}

bootstrap();
// Trigger dev watcher reload: 2026-10-22
