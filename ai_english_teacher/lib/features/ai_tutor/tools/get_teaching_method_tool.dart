import 'package:langchain/langchain.dart';

/// Tool: Get different teaching methods
class GetTeachingMethodTool implements Tool {
  @override
  String get name => 'get_teaching_method';

  @override
  String get description =>
      '获取不同的教学方式建议。当需要换一种方式教孩子时调用此工具。';

  @override
  String get inputParameters => '''
{
  "type": "object",
  "properties": {
    "situation": {
      "type": "string",
      "description": "当前教学情况，如：孩子发音不准、孩子不感兴趣、孩子已经掌握等"
    }
  },
  "required": ["situation"]
}
''';

  @override
  Future<ToolResult> invoke(ToolInput input, {RunManager? runManager}) async {
    final situation = input.input['situation'] as String;
    
    String suggestion;
    if (situation.contains('发音') || situation.contains('pronunciation')) {
      suggestion = '建议：1) 放慢语速，逐音节示范 2) 让孩子看口型 3) 用图片辅助记忆 4) 重复练习3次';
    } else if (situation.contains('不感兴趣') || situation.contains('bored')) {
      suggestion = '建议：1) 切换到小游戏模式 2) 用孩子喜欢的动画角色举例 3) 给予宠物奖励激励 4) 换个话题';
    } else if (situation.contains('掌握') || situation.contains('mastered')) {
      suggestion = '建议：1) 进入下一课内容 2) 增加难度挑战 3) 用已学单词造句 4) 给予额外奖励';
    } else {
      suggestion = '建议：1) 用简单英语打招呼 2) 展示图片让孩子跟读 3) 用鼓励的语气引导 4) 适当给予奖励';
    }
    
    return ToolResult(output: suggestion);
  }
}
