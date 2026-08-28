import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/pet_provider.dart';

class PetPage extends ConsumerWidget {
  const PetPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pet = ref.watch(petProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('我的宠物'),
      ),
      body: pet == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Pet display
                  Container(
                    width: double.infinity,
                    height: 300,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.blue.shade100,
                          Colors.purple.shade100,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _getPetIcon(pet.evolutionStage),
                            size: 120,
                            color: Colors.white,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            pet.name,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            'Lv. ${pet.level}',
                            style: const TextStyle(
                              fontSize: 18,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Stats
                  _buildStatCard(
                    '经验值',
                    pet.experience,
                    pet.experienceForNextLevel,
                    Colors.blue,
                  ),
                  const SizedBox(height: 12),
                  _buildStatCard(
                    '饱腹度',
                    pet.fullness,
                    100,
                    Colors.orange,
                  ),
                  const SizedBox(height: 12),
                  _buildStatCard(
                    '心情',
                    pet.mood,
                    100,
                    Colors.pink,
                  ),
                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => ref.read(petProvider.notifier).feed(),
                          icon: const Icon(Icons.restaurant),
                          label: const Text('喂食'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => ref.read(petProvider.notifier).play(),
                          icon: const Icon(Icons.sports_esports),
                          label: const Text('玩耍'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, int current, int max, Color color) {
    final progress = current / max;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$current / $max',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 12,
              borderRadius: BorderRadius.circular(6),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getPetIcon(int evolutionStage) {
    switch (evolutionStage) {
      case 0:
        return Icons.egg;
      case 1:
        return Icons.pets;
      case 2:
        return Icons.cruelty_free;
      case 3:
        return Icons.flutter_dash;
      case 4:
        return Icons.star;
      default:
        return Icons.pets;
    }
  }
}
