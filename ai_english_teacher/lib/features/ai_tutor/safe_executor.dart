import 'package:flutter/foundation.dart';
import 'package:langchain/langchain.dart';
import 'package:langchain_openai/langchain_openai.dart';
import 'router/ai_router.dart';
import 'fallback/rule_engine.dart';
import 'tools/get_lesson_tool.dart';
import 'tools/record_mistake_tool.dart';
import 'tools/give_reward_tool.dart';
import 'tools/check_progress_tool.dart';
import 'tools/get_teaching_method_tool.dart';
import '../../settings/api_key_manager.dart';
import '../../../core/constants/app_constants.dart';

/// Safe Agent Executor with timeout and error handling
class SafeAgentExecutor {
  static const int _maxIterations = AppConstants.maxAgentIterations;
  static const Duration _timeout = AppConstants.apiTimeout;

  /// Invoke the AI agent with user input
  static Future<String> invoke(String userInput) async {
    try {
      final aiLevel = await AiRouter.decideAiLevel();

      switch (aiLevel) {
        case AiLevel.cloudApi:
          return await _invokeCloudApi(userInput);
        case AiLevel.localModel:
          // Local model not implemented yet, fallback to rule engine
          return RuleEngine.getResponse(userInput);
        case AiLevel.ruleEngine:
          return RuleEngine.getResponse(userInput);
      }
    } on TimeoutException {
      debugPrint('Agent timeout, returning encouragement');
      return '你真棒！继续加油吧～';
    } catch (e) {
      debugPrint('Agent error: $e, falling back to rule engine');
      return RuleEngine.getResponse(userInput);
    }
  }

  static Future<String> _invokeCloudApi(String userInput) async {
    final apiKey = await ApiKeyManager.getApiKey('deepseek');
    if (apiKey == null || apiKey.isEmpty) {
      return RuleEngine.getResponse(userInput);
    }

    try {
      final model = ChatOpenAI(
        apiKey: apiKey,
        baseUrl: AppConstants.deepseekBaseUrl,
        model: AppConstants.deepseekModel,
        temperature: 0.7,
        maxTokens: 200,
      );

      // Define tools
      final tools = [
        GetCurrentLessonTool(),
        RecordMistakeTool(),
        GiveRewardTool(),
        CheckProgressTool(),
        GetTeachingMethodTool(),
      ];

      // Create agent with tools
      final agent = ChatAgent(
        llm: model,
        tools: tools,
      );

      final systemMessage = '''
你是一个友善的一年级英语教师AI助手。你的学生是6-7岁的小学生。
你可以：
1. 获取当前课程内容 (get_current_lesson)
2. 记录孩子的发音错误 (record_mistake)
3. 给予宠物经验奖励 (give_reward)
4. 查看学习进度 (check_progress)
5. 获取教学方式建议 (get_teaching_method)

请根据孩子的回答，智能决定使用哪些工具。
语气要亲切、鼓励为主，使用简单的英语。
每次回复不要太长，适合小学生的理解能力。
''';

      final result = await agent.run(
        ChatMessage.humanText(userInput),
        options: ChatModelOptions(
          systemMessage: systemMessage,
        ),
      );

      return result.content;
    } catch (e) {
      debugPrint('Cloud API error: $e');
      return RuleEngine.getResponse(userInput);
    }
  }
}

/// Simple Chat Agent implementation
class ChatAgent {
  final ChatOpenAI _llm;
  final List<Tool> _tools;

  ChatAgent({
    required ChatOpenAI llm,
    required List<Tool> tools,
  })  : _llm = llm,
        _tools = tools;

  Future<ChatResult> run(
    ChatMessage message, {
    ChatModelOptions? options,
  }) async {
    final messages = <ChatMessage>[
      if (options?.systemMessage != null)
        ChatMessage.system(options!.systemMessage!),
      message,
    ];

    final result = await _llm.generate(messages);
    return result;
  }
}
