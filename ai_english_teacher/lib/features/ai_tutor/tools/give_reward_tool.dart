import 'package:langchain/langchain.dart';
import '../../../shared/database/database_service.dart';
import '../../pet/data/pet_model.dart';

/// Tool: Give pet experience reward
class GiveRewardTool implements Tool {
  @override
  String get name => 'give_reward';

  @override
  String get description =>
      '给予宠物经验值奖励。当孩子表现好、回答正确时调用此工具。';

  @override
  String get inputParameters => '''
{
  "type": "object",
  "properties": {
    "xp": {
      "type": "integer",
      "description": "经验值数量，通常 5-20"
    }
  },
  "required": ["xp"]
}
''';

  @override
  Future<ToolResult> invoke(ToolInput input, {RunManager? runManager}) async {
    final xp = input.input['xp'] as int;
    
    // Get pet and add experience
    final pet = await DatabaseService.getPet();
    if (pet != null) {
      pet.experience += xp;
      
      // Level up check
      while (pet.experience >= pet.experienceForNextLevel && !pet.isMaxLevel) {
        pet.experience -= pet.experienceForNextLevel;
        pet.level += 1;
      }
      
      // Evolution check
      if (pet.canEvolve) {
        pet.evolutionStage += 1;
      }
      
      // Mood boost
      pet.mood = (pet.mood + 5).clamp(0, 100);
      
      await DatabaseService.savePet(pet);
    }
    
    return ToolResult(output: '宠物获得 $xp 经验值');
  }
}
