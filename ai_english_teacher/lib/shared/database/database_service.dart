import 'package:isar/isar.dart';
import '../../features/pet/data/pet_model.dart';
import '../../features/learning/data/learning_progress_model.dart';

class DatabaseService {
  static Isar? _isar;

  static Future<Isar> get database async {
    if (_isar != null) return _isar!;
    
    _isar = await Isar.open(
      [
        PetSchema,
        LearningProgressSchema,
        MistakeRecordSchema,
      ],
      name: 'ai_english_teacher_db',
    );
    
    return _isar!;
  }

  // Pet operations
  static Future<Pet?> getPet() async {
    final db = await database;
    return db.pets.where().findFirst();
  }

  static Future<void> savePet(Pet pet) async {
    final db = await database;
    await db.writeTxn(() async {
      await db.pets.put(pet);
    });
  }

  // Learning progress operations
  static Future<LearningProgress?> getProgress(String courseId) async {
    final db = await database;
    return db.learningProgresss
        .where()
        .filter()
        .courseIdEqualTo(courseId)
        .findFirst();
  }

  static Future<void> saveProgress(LearningProgress progress) async {
    final db = await database;
    await db.writeTxn(() async {
      await db.learningProgresss.put(progress);
    });
  }

  // Mistake operations
  static Future<void> recordMistake(String word) async {
    final db = await database;
    final existing = await db.mistakeRecords
        .where()
        .filter()
        .wordEqualTo(word)
        .findFirst();

    await db.writeTxn(() async {
      if (existing != null) {
        existing.count += 1;
        existing.lastMistakeTime = DateTime.now();
        await db.mistakeRecords.put(existing);
      } else {
        await db.mistakeRecords.put(MistakeRecord(word: word));
      }
    });
  }

  static Future<List<MistakeRecord>> getMistakes() async {
    final db = await database;
    return db.mistakeRecords.where().findAll();
  }
}
