import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

/// Audio Player Service
/// Plays local audio files from assets
class AudioPlayerService {
  final AudioPlayer _player = AudioPlayer();

  Future<void> playAsset(String assetPath) async {
    try {
      // Load audio from assets
      final byteData = await rootBundle.load(assetPath);
      final bytes = byteData.buffer.asUint8List();
      
      await _player.play(BytesSource(bytes));
    } catch (e) {
      debugPrint('Audio playback failed: $e');
      rethrow;
    }
  }

  Future<void> stop() async {
    await _player.stop();
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> resume() async {
    await _player.resume();
  }

  void dispose() {
    _player.dispose();
  }
}
