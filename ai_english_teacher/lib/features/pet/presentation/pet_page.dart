import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/pet_provider.dart';
import 'pet_3d_widget.dart';
import '../../voice/stt/stt_service.dart';
import '../../voice/tts/tts_service.dart';

class PetPage extends ConsumerStatefulWidget {
  const PetPage({super.key});

  @override
  ConsumerState<PetPage> createState() => _PetPageState();
}

class _PetPageState extends ConsumerState<PetPage> {
  final SttService _sttService = SttService();
  final TtsService _ttsService = TtsService();
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _sttService.initialize();
    _ttsService.initialize();
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _sttService.stop();
      setState(() => _isListening = false);
    } else {
      setState(() => _isListening = true);
      await _sttService.listen(
        onResult: (text) {
          setState(() => _isListening = false);
          _handleVoiceCommand(text);
        },
      );
    }
  }

  void _handleVoiceCommand(String text) {
    final lowerText = text.toLowerCase();
    if (lowerText.contains('喂食') || lowerText.contains('feed')) {
      ref.read(petProvider.notifier).feed();
      _ttsService.speak('好的，我来喂食宠物！');
    } else if (lowerText.contains('玩耍') || lowerText.contains('play')) {
      ref.read(petProvider.notifier).play();
      _ttsService.speak('好的，我们一起玩耍！');
    } else {
      _ttsService.speak('你可以说"喂食"或"玩耍"来和宠物互动！');
    }
  }

  @override
  Widget build(BuildContext context) {
    final petState = ref.watch(petProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('我的宠物'),
        actions: [
          IconButton(
            icon: Icon(
              _isListening ? Icons.mic : Icons.mic_none,
              color: _isListening ? Colors.red : null,
            ),
            onPressed: _toggleListening,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 3D宠物显示区域
            Container(
              width: double.infinity,
              height: 350,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.blue.shade100,
                    Colors.purple.shade100,
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Pet3DWidget(
                petState: petState,
                onTap: () {
                  ref.read(petProvider.notifier).play();
                  _ttsService.speak('摸摸我，好开心！');
                },
              ),
            ),
            const SizedBox(height: 16),
            
            // 语音提示
            if (_isListening)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.mic, color: Colors.red),
                    const SizedBox(width: 8),
                    Text(
                      '正在聆听...',
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ],
                ),
              ),

            // 宠物信息
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      petState.name,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Lv. ${petState.level}',
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 状态条
            _buildStatCard(
              '经验值',
              petState.experience,
              petState.experienceForNextLevel,
              Colors.blue,
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              '饱腹度',
              petState.fullness,
              100,
              Colors.orange,
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              '心情',
              petState.mood,
              100,
              Colors.pink,
            ),
            const SizedBox(height: 24),

            // 互动按钮
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ref.read(petProvider.notifier).feed();
                      _ttsService.speak('喂食成功！宠物好开心！');
                    },
                    icon: const Icon(Icons.restaurant),
                    label: const Text('喂食'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      ref.read(petProvider.notifier).play();
                      _ttsService.speak('玩耍成功！宠物更开心了！');
                    },
                    icon: const Icon(Icons.sports_esports),
                    label: const Text('玩耍'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, int current, int max, Color color) {
    final progress = current / max;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$current / $max',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 12,
              borderRadius: BorderRadius.circular(6),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _sttService.stop();
    _ttsService.stop();
    super.dispose();
  }
}
