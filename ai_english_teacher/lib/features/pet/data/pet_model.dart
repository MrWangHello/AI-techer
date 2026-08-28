import 'package:isar/isar.dart';

part 'pet_model.g.dart';

@collection
class Pet {
  Id id = Isar.autoIncrement;
  
  String name;
  int level;
  int experience;
  int fullness;
  int mood;
  int evolutionStage;
  String skinId;
  List<String> unlockedSkins;
  DateTime lastFeedTime;
  DateTime lastPlayTime;

  Pet({
    this.name = 'Pet',
    this.level = 0,
    this.experience = 0,
    this.fullness = 50,
    this.mood = 50,
    this.evolutionStage = 0,
    this.skinId = 'default',
    this.unlockedSkins = const ['default'],
    DateTime? lastFeedTime,
    DateTime? lastPlayTime,
  })  : lastFeedTime = lastFeedTime ?? DateTime.now(),
        lastPlayTime = lastPlayTime ?? DateTime.now();

  // Evolution stages
  static const int stageEgg = 0;
  static const int stageBaby = 1;
  static const int stageTeen = 2;
  static const int stageEvolved = 3;
  static const int stageAdult = 4;

  bool get canEvolve {
    switch (evolutionStage) {
      case stageEgg:
        return level >= 1;
      case stageBaby:
        return level >= 6;
      case stageTeen:
        return level >= 16;
      case stageEvolved:
        return level >= 31;
      default:
        return false;
    }
  }

  int get experienceForNextLevel {
    return level * 100;
  }

  bool get isMaxLevel => level >= 50;
}
