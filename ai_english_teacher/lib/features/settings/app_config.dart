import 'package:shared_preferences/shared_preferences.dart';

/// App Configuration - User settings stored in SharedPreferences
class AppConfig {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // AI Provider
  static String get aiProvider => _prefs?.getString('ai_provider') ?? 'deepseek';
  static Future<void> setAiProvider(String value) async {
    await _prefs?.setString('ai_provider', value);
  }

  // AI Mode
  static String get aiMode => _prefs?.getString('ai_mode') ?? 'auto';
  static Future<void> setAiMode(String value) async {
    await _prefs?.setString('ai_mode', value);
  }

  // STT Provider
  static String get sttProvider => _prefs?.getString('stt_provider') ?? 'system';
  static Future<void> setSttProvider(String value) async {
    await _prefs?.setString('stt_provider', value);
  }

  // TTS Provider
  static String get ttsProvider => _prefs?.getString('tts_provider') ?? 'system';
  static Future<void> setTtsProvider(String value) async {
    await _prefs?.setString('tts_provider', value);
  }

  // Daily Goal
  static int get dailyGoalMinutes => _prefs?.getInt('daily_goal') ?? 30;
  static Future<void> setDailyGoalMinutes(int value) async {
    await _prefs?.setInt('daily_goal', value);
  }

  // Difficulty
  static String get difficulty => _prefs?.getString('difficulty') ?? 'normal';
  static Future<void> setDifficulty(String value) async {
    await _prefs?.setString('difficulty', value);
  }

  // Pet Name
  static String get petName => _prefs?.getString('pet_name') ?? 'Pet';
  static Future<void> setPetName(String value) async {
    await _prefs?.setString('pet_name', value);
  }

  // Daily Reminder
  static bool get dailyReminder => _prefs?.getBool('daily_reminder') ?? true;
  static Future<void> setDailyReminder(bool value) async {
    await _prefs?.setBool('daily_reminder', value);
  }

  // Reminder Time
  static String get reminderTime => _prefs?.getString('reminder_time') ?? '19:00';
  static Future<void> setReminderTime(String value) async {
    await _prefs?.setString('reminder_time', value);
  }

  // Local Model Downloaded
  static bool get localModelDownloaded => _prefs?.getBool('local_model_downloaded') ?? false;
  static Future<void> setLocalModelDownloaded(bool value) async {
    await _prefs?.setBool('local_model_downloaded', value);
  }
}
