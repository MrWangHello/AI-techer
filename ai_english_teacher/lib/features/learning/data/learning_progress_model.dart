import 'package:isar/isar.dart';

part 'learning_progress_model.g.dart';

@collection
class LearningProgress {
  Id id = Isar.autoIncrement;
  
  String courseId;
  bool completed;
  int score;
  int studyTimeSeconds;
  DateTime lastStudyDate;
  List<String> masteredWords;

  LearningProgress({
    required this.courseId,
    this.completed = false,
    this.score = 0,
    this.studyTimeSeconds = 0,
    DateTime? lastStudyDate,
    this.masteredWords = const [],
  }) : lastStudyDate = lastStudyDate ?? DateTime.now();
}

@collection
class MistakeRecord {
  Id id = Isar.autoIncrement;
  
  String word;
  int count;
  DateTime lastMistakeTime;

  MistakeRecord({
    required this.word,
    this.count = 1,
    DateTime? lastMistakeTime,
  }) : lastMistakeTime = lastMistakeTime ?? DateTime.now();
}
