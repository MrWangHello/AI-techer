import 'package:flutter_tts/flutter_tts.dart';
import 'package:flutter/foundation.dart';

/// Text-to-Speech Service
/// Uses system native TTS as fallback (completely free)
class TtsService {
  final FlutterTts _tts = FlutterTts();
  bool _isInitialized = false;

  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      await _tts.setLanguage('en-US');
      await _tts.setSpeechRate(0.4); // Slower for children
      await _tts.setVolume(1.0);
      await _tts.setPitch(1.2); // Slightly higher pitch for friendliness

      _isInitialized = true;
      return true;
    } catch (e) {
      debugPrint('TTS initialization failed: $e');
      return false;
    }
  }

  Future<void> speak(String text) async {
    if (!_isInitialized) {
      await initialize();
    }

    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
  }

  Future<void> setSpeechRate(double rate) async {
    await _tts.setSpeechRate(rate);
  }

  bool get isSpeaking => _tts.isSpeaking;
}
