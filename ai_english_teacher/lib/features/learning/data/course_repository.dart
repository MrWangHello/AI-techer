import 'dart:convert';
import 'package:flutter/services.dart';
import 'course_model.dart';

/// Course repository - loads course data from assets
class CourseRepository {
  static final CourseRepository _instance = CourseRepository._internal();
  factory CourseRepository() => _instance;
  CourseRepository._internal();

  List<Course>? _cachedCourses;

  /// Load all courses from assets
  Future<List<Course>> loadAllCourses() async {
    if (_cachedCourses != null) {
      return _cachedCourses!;
    }

    final courses = <Course>[];

    // Load course list
    final courseListJson = await rootBundle.loadString('assets/courses/course_list.json');
    final courseListData = json.decode(courseListJson) as List;

    for (final courseId in courseListData) {
      try {
        final courseJson = await rootBundle.loadString('assets/courses/$courseId.json');
        final courseData = json.decode(courseJson) as Map<String, dynamic>;
        courses.add(Course.fromJson(courseData));
      } catch (e) {
        print('Failed to load course $courseId: $e');
      }
    }

    _cachedCourses = courses;
    return courses;
  }

  /// Get a specific course by ID
  Future<Course?> getCourse(String courseId) async {
    final courses = await loadAllCourses();
    try {
      return courses.firstWhere((c) => c.id == courseId);
    } catch (e) {
      return null;
    }
  }

  /// Get current course (first uncompleted or first course)
  Future<Course?> getCurrentCourse() async {
    final courses = await loadAllCourses();
    if (courses.isEmpty) return null;
    return courses.first;
  }
}
