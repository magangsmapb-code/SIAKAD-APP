import '../models/schedule_model.dart';
import '../mock/mock_data.dart';

abstract class ScheduleRepository {
  Future<List<ScheduleItem>> getTeacherSchedules(String teacherNip);
  Future<List<ScheduleItem>> getStudentSchedules(String studentId, String className);
  Future<ScheduleItem?> getScheduleById(String id);
}

class MockScheduleRepository implements ScheduleRepository {
  @override
  Future<List<ScheduleItem>> getTeacherSchedules(String teacherNip) async {
    await Future.delayed(const Duration(milliseconds: 150));
    return List.from(MockData.teacherSchedules);
  }

  @override
  Future<List<ScheduleItem>> getStudentSchedules(
    String studentId,
    String className,
  ) async {
    await Future.delayed(const Duration(milliseconds: 150));
    return List.from(MockData.studentSchedules);
  }

  @override
  Future<ScheduleItem?> getScheduleById(String id) async {
    await Future.delayed(const Duration(milliseconds: 100));
    try {
      final all = [...MockData.teacherSchedules, ...MockData.studentSchedules];
      return all.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }
}
