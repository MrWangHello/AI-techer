class AppConstants {
  // AI Providers
  static const String deepseekBaseUrl = 'https://api.deepseek.com/v1';
  static const String deepseekModel = 'deepseek-chat';
  
  static const String qwenBaseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  static const String qwenModel = 'qwen-plus';

  // Network
  static const Duration apiTimeout = Duration(seconds: 15);
  static const int maxAgentIterations = 5;

  // Pet
  static const int maxPetLevel = 50;
  static const int maxFullness = 100;
  static const int maxMood = 100;

  // Learning
  static const int defaultDailyGoalMinutes = 30;
  
  // Storage Keys
  static const String keyAiProvider = 'ai_provider';
  static const String keyAiMode = 'ai_mode';
  static const String keySttProvider = 'stt_provider';
  static const String keyTtsProvider = 'tts_provider';
  static const String keyDailyGoal = 'daily_goal';
  static const String keyDifficulty = 'difficulty';
}
