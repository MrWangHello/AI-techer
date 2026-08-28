import 'package:langchain/langchain.dart';
import '../../../shared/database/database_service.dart';

/// Tool: Check child's learning progress
class CheckProgressTool implements Tool {
  @override
  String get name => 'check_progress';

  @override
  String get description =>
      '查询孩子的学习进度，包括已学课程、掌握程度等信息。';

  @override
  String get inputParameters => '''
{
  "type": "object",
  "properties": {}
}
''';

  @override
  Future<ToolResult> invoke(ToolInput input, {RunManager? runManager}) async {
    final mistakes = await DatabaseService.getMistakes();
    
    final mistakeList = mistakes
        .map((m) => '${m.word}(${m.count}次)')
        .join(', ');
    
    final progressData = '''
{
  "mistake_count": ${mistakes.length},
  "frequent_mistakes": "$mistakeList"
}
''';
    return ToolResult(output: progressData);
  }
}
