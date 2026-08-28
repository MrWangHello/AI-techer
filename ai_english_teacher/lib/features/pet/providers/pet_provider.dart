import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/pet_model.dart';
import '../../../shared/database/database_service.dart';

/// Pet state provider
final petProvider = StateNotifierProvider<PetNotifier, Pet?>((ref) {
  return PetNotifier();
});

class PetNotifier extends StateNotifier<Pet?> {
  PetNotifier() : super(null) {
    _loadPet();
  }

  Future<void> _loadPet() async {
    final pet = await DatabaseService.getPet();
    if (pet != null) {
      state = pet;
    } else {
      // Create default pet
      final newPet = Pet(name: 'Pet');
      await DatabaseService.savePet(newPet);
      state = newPet;
    }
  }

  Future<void> addExperience(int xp) async {
    if (state == null) return;

    state!.experience += xp;

    // Level up check
    while (state!.experience >= state!.experienceForNextLevel && !state!.isMaxLevel) {
      state!.experience -= state!.experienceForNextLevel;
      state!.level += 1;
    }

    // Evolution check
    if (state!.canEvolve) {
      state!.evolutionStage += 1;
    }

    await DatabaseService.savePet(state!);
    state = state; // Trigger rebuild
  }

  Future<void> feed() async {
    if (state == null) return;

    state!.fullness = (state!.fullness + 20).clamp(0, 100);
    state!.mood = (state!.mood + 10).clamp(0, 100);
    state!.lastFeedTime = DateTime.now();

    await DatabaseService.savePet(state!);
    state = state;
  }

  Future<void> play() async {
    if (state == null) return;

    state!.mood = (state!.mood + 15).clamp(0, 100);
    state!.lastPlayTime = DateTime.now();

    await DatabaseService.savePet(state!);
    state = state;
  }

  Future<void> updateName(String name) async {
    if (state == null) return;

    state!.name = name;
    await DatabaseService.savePet(state!);
    state = state;
  }
}
