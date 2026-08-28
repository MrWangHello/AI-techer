import 'package:langchain/langchain.dart';
import 'package:langchain_openai/langchain_openai.dart';

/// Tool: Get current lesson content
class GetCurrentLessonTool implements Tool {
  @override
  String get name => 'get_current_lesson';

  @override
  String get description =>
      '获取当前课程内容，返回课程名称、单词列表和句型。当需要了解当前要教什么内容时调用此工具。';

  @override
  String get inputParameters => '''
{
  "type": "object",
  "properties": {}
}
''';

  @override
  Future<ToolResult> invoke(ToolInput input, {RunManager? runManager}) async {
    // TODO: Load from actual database
    // For now, return hardcoded lesson data
    final lessonData = '''
{
  "name": "Greetings",
  "words": ["hello", "goodbye", "hi", "bye"],
  "sentences": [
    "Hello! How are you?",
    "Goodbye! See you later!"
  ]
}
''';
    return ToolResult(output: lessonData);
  }
}
