import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../settings/api_key_manager.dart';
import '../fallback/rule_engine.dart';

/// AI Level enum
enum AiLevel { cloudApi, localModel, ruleEngine }

/// Network Level enum
enum NetworkLevel { fluent, weak, offline }

/// AI Router - Decides which AI inference method to use
class AiRouter {
  /// Decide AI level based on network status and config
  static Future<AiLevel> decideAiLevel() async {
    final networkLevel = await _checkNetwork();
    final hasApiKey = await ApiKeyManager.hasAnyApiKey();

    if (networkLevel == NetworkLevel.offline) {
      // No network -> try local model, fallback to rule engine
      debugPrint('AiRouter: Offline, using rule engine');
      return AiLevel.ruleEngine;
    }

    if (hasApiKey) {
      // Has network + API key -> use cloud API
      debugPrint('AiRouter: Online with API key, using cloud API');
      return AiLevel.cloudApi;
    }

    // Has network but no API key -> rule engine (local model not implemented yet)
    debugPrint('AiRouter: Online but no API key, using rule engine');
    return AiLevel.ruleEngine;
  }

  static Future<NetworkLevel> _checkNetwork() async {
    try {
      final connectivityResult = await Connectivity().checkConnectivity();

      if (connectivityResult.contains(ConnectivityResult.wifi) ||
          connectivityResult.contains(ConnectivityResult.mobile)) {
        return NetworkLevel.fluent;
      }

      if (connectivityResult.contains(ConnectivityResult.none)) {
        return NetworkLevel.offline;
      }

      return NetworkLevel.weak;
    } catch (e) {
      debugPrint('Network check failed: $e');
      return NetworkLevel.offline;
    }
  }

  /// Get fallback response from rule engine
  static String getRuleEngineResponse(String input) {
    return RuleEngine.getResponse(input);
  }
}
