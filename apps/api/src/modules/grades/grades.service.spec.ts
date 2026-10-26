import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GradePredicate, Semester } from '@prisma/client';

describe('GradesService', () => {
  let service: GradesService;

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
    },
    academicYear: {
      findUnique: jest.fn(),
    },
    teacher: {
      findFirst: jest.fn(),
    },
    studentGrade: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
    jest.clearAllMocks();
  });

  describe('calculateFinalScore (Kurikulum Merdeka)', () => {
    it('harus menghitung bobot nilai (30% formatif, 30% sumatif, 20% pts, 20% pas) dengan presisi', () => {
      // 90*0.3 + 90*0.3 + 90*0.2 + 90*0.2 = 90
      const res = service.calculateFinalScore(90, 90, 90, 90, 75);
      expect(res.finalScore).toBe(90);
      expect(res.predicate).toBe(GradePredicate.A);
      expect(res.isPassed).toBe(true);
    });

    it('harus memetakan predikat A (>=88), B (>=75), C (>=60), D (<60)', () => {
      expect(service.calculateFinalScore(88, 88, 88, 88).predicate).toBe(GradePredicate.A);
      expect(service.calculateFinalScore(80, 80, 80, 80).predicate).toBe(GradePredicate.B);
      expect(service.calculateFinalScore(65, 65, 65, 65).predicate).toBe(GradePredicate.C);
      expect(service.calculateFinalScore(50, 50, 50, 50).predicate).toBe(GradePredicate.D);
    });

    it('harus menentukan kelulusan berdasarkan KKTP', () => {
      // Score 74 dengan KKTP 75 -> isPassed false
      const failed = service.calculateFinalScore(74, 74, 74, 74, 75);
      expect(failed.isPassed).toBe(false);

      // Score 75 dengan KKTP 75 -> isPassed true
      const passed = service.calculateFinalScore(75, 75, 75, 75, 75);
      expect(passed.isPassed).toBe(true);
    });
  });

  describe('generateDefaultCompetencySummary', () => {
    it('harus menghasilkan deskripsi capaian pembelajaran Kurikulum Merdeka yang kontekstual', () => {
      const summaryA = service.generateDefaultCompetencySummary(GradePredicate.A, 'Fisika');
      expect(summaryA).toContain('Fisika');
      expect(summaryA).toContain('sangat istimewa');

      const summaryD = service.generateDefaultCompetencySummary(GradePredicate.D, 'Matematika');
      expect(summaryD).toContain('remedial');
    });
  });

  describe('createOrUpdateGrade', () => {
    it('harus meng-upsert nilai dan mencatat pada AuditLog', () => {
      mockPrismaService.student.findUnique.mockResolvedValue({ id: 's1', classId: 'c1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 'sub1', name: 'Fisika' });
      mockPrismaService.academicYear.findUnique.mockResolvedValue({ id: 'ay1' });
      mockPrismaService.studentGrade.upsert.mockResolvedValue({
        id: 'grade-1',
        finalScore: 86.6,
        predicate: GradePredicate.B,
        student: { fullName: 'Aditya Pratama' },
        subject: { name: 'Fisika' },
        schoolClass: { name: 'X MIPA 1' },
      });

      return service
        .createOrUpdateGrade(
          {
            studentId: 's1',
            subjectId: 'sub1',
            classId: 'c1',
            academicYearId: 'ay1',
            formatif: 88,
            sumatifMateri: 86,
            pts: 85,
            pas: 87,
            kktp: 75,
          },
          { id: 'u1', username: 'guru1', role: 'TEACHER' },
          '127.0.0.1',
          'JestAgent',
        )
        .then((result) => {
          expect(mockPrismaService.studentGrade.upsert).toHaveBeenCalled();
          expect(mockAuditService.record).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'GRADE_RECORDED',
              entity: 'STUDENT_GRADE',
            }),
          );
          expect(result.finalScore).toBe(86.6);
        });
    });
  });
});
