import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AttendanceModuleStatusGuard } from './attendance-module-status.guard';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, PermissionsGuard, AttendanceModuleStatusGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
