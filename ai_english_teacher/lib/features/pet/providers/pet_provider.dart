import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/pet_model.dart';
import '../../../shared/database/database_service.dart';

/// 宠物进化阶段
enum EvolutionStage {
  egg,    // 蛋
  baby,   // 幼年
  teen,   // 成长
  adult,  // 成年
}

/// 宠物状态
class PetState {
  final String name;
  final int level;
  final int experience;
  final int fullness;
  final int mood;
  final EvolutionStage evolutionStage;
  final DateTime lastFeedTime;
  final DateTime lastPlayTime;

  PetState({
    required this.name,
    required this.level,
    required this.experience,
    required this.fullness,
    required this.mood,
    required this.evolutionStage,
    required this.lastFeedTime,
    required this.lastPlayTime,
  });

  factory PetState.fromPet(Pet pet) {
    return PetState(
      name: pet.name,
      level: pet.level,
      experience: pet.experience,
      fullness: pet.fullness,
      mood: pet.mood,
      evolutionStage: EvolutionStage.values[pet.evolutionStage.clamp(0, 3)],
      lastFeedTime: pet.lastFeedTime,
      lastPlayTime: pet.lastPlayTime,
    );
  }

  int get experienceForNextLevel => level * 100;
  bool get isMaxLevel => level >= 50;
}

/// Pet state provider
final petProvider = StateNotifierProvider<PetNotifier, PetState>((ref) {
  return PetNotifier();
});

class PetNotifier extends StateNotifier<PetState> {
  PetNotifier() : super(_createDefaultPet()) {
    _loadPet();
  }

  static PetState _createDefaultPet() {
    return PetState(
      name: 'Buddy',
      level: 1,
      experience: 0,
      fullness: 50,
      mood: 50,
      evolutionStage: EvolutionStage.baby,
      lastFeedTime: DateTime.now(),
      lastPlayTime: DateTime.now(),
    );
  }

  Future<void> _loadPet() async {
    final pet = await DatabaseService.getPet();
    if (pet != null) {
      state = PetState.fromPet(pet);
    }
  }

  Future<void> addExperience(int xp) async {
    state = PetState(
      name: state.name,
      level: state.level,
      experience: state.experience + xp,
      fullness: state.fullness,
      mood: state.mood,
      evolutionStage: state.evolutionStage,
      lastFeedTime: state.lastFeedTime,
      lastPlayTime: state.lastPlayTime,
    );

    // Level up check
    while (state.experience >= state.experienceForNextLevel && !state.isMaxLevel) {
      final newLevel = state.level + 1;
      var newStage = state.evolutionStage;
      
      // Evolution check
      if (newLevel >= 10 && state.evolutionStage == EvolutionStage.baby) {
        newStage = EvolutionStage.teen;
      } else if (newLevel >= 20 && state.evolutionStage == EvolutionStage.teen) {
        newStage = EvolutionStage.adult;
      }
      
      state = PetState(
        name: state.name,
        level: newLevel,
        experience: state.experience - state.experienceForNextLevel,
        fullness: state.fullness,
        mood: state.mood,
        evolutionStage: newStage,
        lastFeedTime: state.lastFeedTime,
        lastPlayTime: state.lastPlayTime,
      );
    }

    await _saveToDatabase();
  }

  Future<void> feed() async {
    state = PetState(
      name: state.name,
      level: state.level,
      experience: state.experience,
      fullness: (state.fullness + 20).clamp(0, 100),
      mood: (state.mood + 10).clamp(0, 100),
      evolutionStage: state.evolutionStage,
      lastFeedTime: DateTime.now(),
      lastPlayTime: state.lastPlayTime,
    );
    await _saveToDatabase();
  }

  Future<void> play() async {
    state = PetState(
      name: state.name,
      level: state.level,
      experience: state.experience,
      fullness: state.fullness,
      mood: (state.mood + 15).clamp(0, 100),
      evolutionStage: state.evolutionStage,
      lastFeedTime: state.lastFeedTime,
      lastPlayTime: DateTime.now(),
    );
    await _saveToDatabase();
  }

  Future<void> updateName(String name) async {
    state = PetState(
      name: name,
      level: state.level,
      experience: state.experience,
      fullness: state.fullness,
      mood: state.mood,
      evolutionStage: state.evolutionStage,
      lastFeedTime: state.lastFeedTime,
      lastPlayTime: state.lastPlayTime,
    );
    await _saveToDatabase();
  }

  Future<void> _saveToDatabase() async {
    final pet = Pet(
      name: state.name,
      level: state.level,
      experience: state.experience,
      fullness: state.fullness,
      mood: state.mood,
      evolutionStage: state.evolutionStage.index,
      lastFeedTime: state.lastFeedTime,
      lastPlayTime: state.lastPlayTime,
    );
    await DatabaseService.savePet(pet);
  }
}
