import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const server: Express = express();
let isReady = false;

// Root & Docs Redirects
server.get('/', (_req, res) => {
  res.redirect('/api/v1');
});
server.get('/docs', (_req, res) => {
  res.redirect('/api/v1/docs');
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Security Middleware
  app.use(helmet());
  app.use(((cookieParser as any).default || cookieParser)());

  // CORS Configuration - allow all origins in Vercel serverless environment
  app.enableCors({
    origin: true,
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

  await app.init();
  isReady = true;
}

export default async function handler(req: any, res: any) {
  if (!isReady) {
    await bootstrap();
  }
  return server(req, res);
}
