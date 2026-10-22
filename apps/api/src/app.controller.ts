import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root & Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Root & Info Endpoint' })
  getRoot() {
    return {
      name: 'SIAKAD API - SMA Pemberdayaan Bangsa Ngrayun',
      version: '1.0.0',
      status: 'ONLINE',
      environment: process.env.NODE_ENV || 'development',
      documentation: '/api/v1/docs',
      serverTime: new Date().toISOString(),
      timezone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Check Endpoint' })
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
