import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogAuditParams {
  userId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  // Sanitize object to remove sensitive secrets (passwords, tokens)
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const clean = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = ['password', 'passwordHash', 'refreshToken', 'token', 'secret'];

    for (const key of Object.keys(clean)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        clean[key] = '[REDACTED]';
      } else if (typeof clean[key] === 'object' && clean[key] !== null) {
        clean[key] = this.sanitizeData(clean[key]);
      }
    }

    return clean;
  }

  async record(params: LogAuditParams) {
    try {
      const sanitizedOld = params.oldValue ? this.sanitizeData(params.oldValue) : undefined;
      const sanitizedNew = params.newValue ? this.sanitizeData(params.newValue) : undefined;

      const log = await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          actorName: params.actorName,
          actorRole: params.actorRole,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          oldValue: sanitizedOld,
          newValue: sanitizedNew,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      return log;
    } catch (error) {
      this.logger.error(`Failed to record audit log: ${error.message}`, error.stack);
      // Audit log failures should not bring down the main user operation
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    entity?: string;
    action?: string;
    userId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;
    if (params.userId) where.userId = params.userId;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
