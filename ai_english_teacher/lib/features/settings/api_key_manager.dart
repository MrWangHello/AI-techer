import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// API Key Manager - Secure storage for API keys
class ApiKeyManager {
  static const _storage = FlutterSecureStorage();

  /// Save API key for a provider
  static Future<void> saveApiKey(String provider, String apiKey) async {
    await _storage.write(key: 'api_key_$provider', value: apiKey);
  }

  /// Get API key for a provider
  static Future<String?> getApiKey(String provider) async {
    return await _storage.read(key: 'api_key_$provider');
  }

  /// Delete API key for a provider
  static Future<void> deleteApiKey(String provider) async {
    await _storage.delete(key: 'api_key_$provider');
  }

  /// Check if any API key is configured
  static Future<bool> hasAnyApiKey() async {
    final deepseekKey = await getApiKey('deepseek');
    final qwenKey = await getApiKey('qwen');
    final openaiKey = await getApiKey('openai');

    return (deepseekKey != null && deepseekKey.isNotEmpty) ||
        (qwenKey != null && qwenKey.isNotEmpty) ||
        (openaiKey != null && openaiKey.isNotEmpty);
  }

  /// Get the first available API key (priority: deepseek > qwen > openai)
  static Future<String?> getFirstAvailableApiKey() async {
    final deepseekKey = await getApiKey('deepseek');
    if (deepseekKey != null && deepseekKey.isNotEmpty) {
      return deepseekKey;
    }

    final qwenKey = await getApiKey('qwen');
    if (qwenKey != null && qwenKey.isNotEmpty) {
      return qwenKey;
    }

    final openaiKey = await getApiKey('openai');
    if (openaiKey != null && openaiKey.isNotEmpty) {
      return openaiKey;
    }

    return null;
  }
}
