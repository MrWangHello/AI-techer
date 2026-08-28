import 'package:flutter/material.dart';
import '../data/course_repository.dart';
import '../data/course_model.dart';
import '../../voice/tts/tts_service.dart';
import '../../voice/audio/audio_player_service.dart';

class LessonDetailPage extends StatefulWidget {
  final String lessonId;

  const LessonDetailPage({super.key, required this.lessonId});

  @override
  State<LessonDetailPage> createState() => _LessonDetailPageState();
}

class _LessonDetailPageState extends State<LessonDetailPage> {
  final CourseRepository _courseRepo = CourseRepository();
  final TtsService _ttsService = TtsService();
  final AudioPlayerService _audioService = AudioPlayerService();
  Course? _course;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLesson();
  }

  Future<void> _loadLesson() async {
    try {
      final course = await _courseRepo.getCourse(widget.lessonId);
      setState(() {
        _course = course;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      print('Failed to load lesson: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_course?.title ?? '课程详情'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _course == null
              ? const Center(child: Text('课程未找到'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Course header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Theme.of(context).colorScheme.primary,
                              Theme.of(context).colorScheme.secondary,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Text(
                              _course!.title,
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Unit ${_course!.unit} · Grade ${_course!.grade}',
                              style: const TextStyle(
                                fontSize: 16,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Vocabulary section
                      const Text(
                        '单词学习',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ..._course!.vocabularies.map((vocab) => _buildVocabularyCard(vocab)),
                      const SizedBox(height: 24),

                      // Sentences section
                      const Text(
                        '句子练习',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ..._course!.sentences.map((sentence) => _buildSentenceCard(sentence)),
                      const SizedBox(height: 24),

                      // Dialogue section
                      if (_course!.dialogues.isNotEmpty) ...[
                        const Text(
                          '对话练习',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ..._course!.dialogues.map((dialogue) => _buildDialogueCard(dialogue)),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _buildVocabularyCard(Vocabulary vocab) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vocab.word,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    vocab.phonetic,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    vocab.translation,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.volume_up, size: 32),
              onPressed: () {
                _ttsService.speak(vocab.word);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSentenceCard(Sentence sentence) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    sentence.en,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.volume_up),
                  onPressed: () {
                    _ttsService.speak(sentence.en);
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              sentence.zh,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDialogueCard(Dialogue dialogue) {
    final isTeacher = dialogue.role == 'teacher';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: isTeacher ? Colors.blue.shade50 : Colors.green.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isTeacher ? Icons.person : Icons.face,
                  color: isTeacher ? Colors.blue : Colors.green,
                ),
                const SizedBox(width: 8),
                Text(
                  isTeacher ? 'Teacher' : 'You',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isTeacher ? Colors.blue : Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              dialogue.en,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              dialogue.zh,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _audioService.dispose();
    super.dispose();
  }
}
