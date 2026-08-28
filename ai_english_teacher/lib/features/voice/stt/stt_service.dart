import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter/foundation.dart';

/// Speech-to-Text Service
/// Uses system native STT as fallback (completely free)
class SttService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isInitialized = false;

  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      _isInitialized = await _speech.initialize(
        onStatus: (status) => debugPrint('STT Status: $status'),
        onError: (error) => debugPrint('STT Error: $error'),
      );
      return _isInitialized;
    } catch (e) {
      debugPrint('STT initialization failed: $e');
      return false;
    }
  }

  Future<void> listen({
    required Function(String) onResult,
    Function(String)? onPartialResult,
  }) async {
    if (!_isInitialized) {
      final success = await initialize();
      if (!success) {
        throw Exception('Speech recognition not available');
      }
    }

    await _speech.listen(
      onResult: (result) {
        if (result.finalResult) {
          onResult(result.recognizedWords);
        } else if (onPartialResult != null) {
          onPartialResult(result.recognizedWords);
        }
      },
      localeId: 'en_US',
      listenMode: stt.ListenMode.confirmation,
      cancelOnError: true,
      partialResults: true,
    );
  }

  Future<void> stop() async {
    await _speech.stop();
  }

  bool get isListening => _speech.isListening;
}
