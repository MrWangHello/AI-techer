import 'package:langchain/langchain.dart';
import '../../../shared/database/database_service.dart';

/// Tool: Record a child's pronunciation mistake
class RecordMistakeTool implements Tool {
  @override
  String get name => 'record_mistake';

  @override
  String get description =>
      '记录孩子某个单词的发音错误。当孩子读错某个单词时调用此工具。';

  @override
  String get inputParameters => '''
{
  "type": "object",
  "properties": {
    "word": {
      "type": "string",
      "description": "孩子读错的单词"
    }
  },
  "required": ["word"]
}
''';

  @override
  Future<ToolResult> invoke(ToolInput input, {RunManager? runManager}) async {
    final word = input.input['word'] as String;
    await DatabaseService.recordMistake(word);
    return ToolResult(output: '已记录单词 "$word" 的错误');
  }
}
