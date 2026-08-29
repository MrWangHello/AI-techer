import 'package:flutter/material.dart';
import 'model_viewer_widget.dart';

void main() {
  runApp(const AIEnglishTeacherApp());
}

class AIEnglishTeacherApp extends StatelessWidget {
  const AIEnglishTeacherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI English Teacher',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.pink,
        useMaterial3: true,
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 2;

  final List<Widget> _pages = const [
    HomePage(),
    StudyPage(),
    PetPage(),
    AchievementPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: '学习'),
          BottomNavigationBarItem(icon: Icon(Icons.pets), label: '宠物'),
          BottomNavigationBarItem(icon: Icon(Icons.emoji_events), label: '成就'),
        ],
      ),
    );
  }
}

// ==================== Pet Page ====================

class PetPage extends StatefulWidget {
  const PetPage({super.key});

  @override
  State<PetPage> createState() => _PetPageState();
}

class _PetPageState extends State<PetPage> with SingleTickerProviderStateMixin {
  String _currentAnimation = 'Idle';
  bool _modelLoaded = false;

  // Pet stats
  int _exp = 60;
  int _hunger = 80;
  int _mood = 90;
  int _level = 3;
  int _totalInteractions = 0;

  // Speech bubble
  String? _bubbleText;
  String _moodEmoji = '😊';

  late AnimationController _bubbleAnim;

  final List<String> _animations = [
    'Idle', 'Wave', 'Dance', 'Jump',
    'Yes', 'No', 'ThumbsUp', 'Punch',
  ];

  final Map<String, String> _animLabels = {
    'Idle': '休息', 'Wave': '挥手', 'Dance': '跳舞', 'Jump': '跳跃',
    'Yes': '点头', 'No': '摇头', 'ThumbsUp': '点赞', 'Punch': '出拳',
  };

  final Map<String, IconData> _animIcons = {
    'Idle': Icons.person, 'Wave': Icons.waving_hand, 'Dance': Icons.music_note,
    'Jump': Icons.arrow_upward, 'Yes': Icons.check_circle, 'No': Icons.cancel,
    'ThumbsUp': Icons.thumb_up, 'Punch': Icons.fitness_center,
  };

  // Pet dialogue lines
  final List<String> _tapLines = [
    'Hey! That tickles! 😄',
    'Hehe, stop it! 🤭',
    'I love playing with you! ',
    "Let's learn English together! 📚",
    'You are my best friend! 🌟',
    'Can you teach me a new word? ',
    'I feel so happy today! 🎉',
    'Wow, you clicked me! 😆',
  ];

  final List<String> _feedLines = [
    'Yummy! Thank you! 🍕',
    'Delicious! More please! 😋',
    'My tummy is full! ',
    "That's the best food ever! 🍰",
  ];

  final List<String> _playLines = [
    'So much fun! 🎮',
    'Again! Again! 🎪',
    'Wheee! I love this! 🎢',
    "You're the best playmate! 🎯",
  ];

  final List<String> _studyLines = [
    "Let's learn English! 📖",
    'I know a new word! 🎓',
    'Teach me more! ',
    'Learning is fun! ✨',
  ];

  @override
  void initState() {
    super.initState();
    _bubbleAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _bubbleAnim.dispose();
    super.dispose();
  }

  void _playAnim(String name) {
    setState(() => _currentAnimation = name);
  }

  void _showBubble(String text) {
    setState(() {
      _bubbleText = text;
      _bubbleAnim.forward(from: 0);
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _bubbleAnim.reverse();
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) setState(() => _bubbleText = null);
        });
      }
    });
  }

  String _randomFrom(List<String> list) {
    return list[DateTime.now().millisecondsSinceEpoch % list.length];
  }

  void _onPetTap() {
    _playAnim('Wave');
    _showBubble(_randomFrom(_tapLines));
    _addMood(2);
    _addExp(1);
  }

  void _onFeed() {
    _playAnim('ThumbsUp');
    _showBubble(_randomFrom(_feedLines));
    _addHunger(15);
    _addMood(5);
    _addExp(5);
    _totalInteractions++;
    _checkLevelUp();
  }

  void _onPlay() {
    _playAnim('Dance');
    _showBubble(_randomFrom(_playLines));
    _addMood(15);
    _addHunger(-5);
    _addExp(8);
    _totalInteractions++;
    _checkLevelUp();
  }

  void _onStudy() {
    _playAnim('Yes');
    _showBubble(_randomFrom(_studyLines));
    _addExp(15);
    _addMood(3);
    _totalInteractions++;
    _checkLevelUp();
  }

  void _addExp(int delta) {
    setState(() {
      _exp = (_exp + delta).clamp(0, 100);
    });
  }

  void _addHunger(int delta) {
    setState(() {
      _hunger = (_hunger + delta).clamp(0, 100);
    });
  }

  void _addMood(int delta) {
    setState(() {
      _mood = (_mood + delta).clamp(0, 100);
      _updateMoodEmoji();
    });
  }

  void _updateMoodEmoji() {
    if (_mood >= 80) {
      _moodEmoji = '😊';
    } else if (_mood >= 60) {
      _moodEmoji = '😐';
    } else if (_mood >= 40) {
      _moodEmoji = '😟';
    } else {
      _moodEmoji = '😢';
    }
  }

  void _checkLevelUp() {
    if (_exp >= 100) {
      setState(() {
        _exp = 0;
        _level++;
      });
      _playAnim('Jump');
      _showBubble('🎉 Level Up! Now Lv.$_level!');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的伙伴'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.mic),
            onPressed: () => _showBubble("Hi! I'm Bella! Let's chat! "),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 3D Pet Display
            Container(
              margin: const EdgeInsets.all(16),
              height: 380,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.cyan.shade100, Colors.pink.shade100],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Stack(
                children: [
                  // Mood indicator
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                      ),
                      child: Text(_moodEmoji, style: const TextStyle(fontSize: 20)),
                    ),
                  ),
                  // Level badge
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.amber,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                      ),
                      child: Text(
                        'Lv.$_level',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  // Speech bubble
                  if (_bubbleText != null)
                    Positioned(
                      top: 60,
                      left: 20,
                      right: 20,
                      child: FadeTransition(
                        opacity: _bubbleAnim,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
                          ),
                          child: Text(
                            _bubbleText!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ),
                    ),
                  // 3D Model
                  Center(
                    child: ModelViewerWidget(
                      key: ValueKey(_currentAnimation),
                      src: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
                      animationName: _currentAnimation,
                      autoRotate: true,
                      cameraControls: true,
                      shadowIntensity: 0.5,
                      backgroundColor: 'transparent',
                      onModelReady: () {
                        setState(() => _modelLoaded = true);
                      },
                      onTap: _onPetTap,
                    ),
                  ),
                  if (!_modelLoaded) _LoadingOverlay(),
                  // Name
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Column(
                      children: [
                        Text(
                          'Bella',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade800,
                            shadows: [Shadow(color: Colors.white, blurRadius: 4)],
                          ),
                        ),
                        Text(
                          'Tap me to interact! ',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Stats
            _buildStatCard('经验值', _exp, 100, Colors.blue, Icons.star),
            const SizedBox(height: 12),
            _buildStatCard('饱腹度', _hunger, 100, Colors.orange, Icons.restaurant),
            const SizedBox(height: 12),
            _buildStatCard('心情', _mood, 100, Colors.pink, Icons.favorite),
            const SizedBox(height: 20),

            // Animation Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: _animations.map((name) {
                  return _animBtn(name, _animIcons[name]!, _animLabels[name]!, () => _playAnim(name));
                }).toList(),
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _actionBtn(Icons.restaurant, '喂食', Colors.orange, _onFeed, '+15 饱腹'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _actionBtn(Icons.sports_esports, '玩耍', Colors.blue, _onPlay, '+15 心情'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _actionBtn(Icons.school, '学习', Colors.green, _onStudy, '+15 经验'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Interaction counter
            Text(
              '今日互动 $_totalInteractions 次',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, int value, int max, Color color, IconData icon) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(icon, size: 20, color: color),
                  const SizedBox(width: 8),
                  Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
              Text('$value / $max', style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: value / max,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _animBtn(String key, IconData icon, String label, VoidCallback onTap) {
    final isActive = _currentAnimation == key;
    return Material(
      color: isActive ? Colors.pink.shade100 : Colors.white,
      borderRadius: BorderRadius.circular(12),
      elevation: isActive ? 2 : 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Column(
            children: [
              Icon(icon, color: isActive ? Colors.pink : Colors.grey.shade700, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: isActive ? Colors.pink : Colors.grey.shade700,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label, Color color, VoidCallback onTap, String bonus) {
    return Material(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 2),
              Text(bonus, style: TextStyle(color: color.withOpacity(0.7), fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingOverlay extends StatefulWidget {
  @override
  State<_LoadingOverlay> createState() => _LoadingOverlayState();
}

class _LoadingOverlayState extends State<_LoadingOverlay> {
  bool _timeout = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) setState(() => _timeout = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white54,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!_timeout) ...[
              const CircularProgressIndicator(color: Colors.pink),
              const SizedBox(height: 12),
              const Text('Loading 3D...', style: TextStyle(color: Colors.pink)),
            ] else ...[
              const Icon(Icons.pets, size: 64, color: Colors.pink),
              const SizedBox(height: 12),
              const Text('3D 模型加载中...', style: TextStyle(color: Colors.pink, fontSize: 16)),
              const SizedBox(height: 8),
              const Text('请确保网络连接正常', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => setState(() => _timeout = false),
                child: const Text('重试'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ==================== Other Pages ====================

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI English Teacher'),
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.pink.shade200, Colors.purple.shade200, Colors.indigo.shade100],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Good Morning!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const Text('Ready to learn English today?', style: TextStyle(fontSize: 14, color: Colors.white70)),
              const SizedBox(height: 20),
              _homeCard(Icons.pets, '我的宠物', 'Bella 在等你哦!'),
              const SizedBox(height: 12),
              _homeCard(Icons.menu_book, '今日课程', '3 个新课程'),
              const SizedBox(height: 12),
              _homeCard(Icons.quiz, '每日测验', '完成今日挑战'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _homeCard(IconData icon, String title, String subtitle) {
    return Material(
      color: Colors.white24,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, size: 36, color: Colors.white),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                Text(subtitle, style: const TextStyle(fontSize: 13, color: Colors.white70)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class StudyPage extends StatelessWidget {
  const StudyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('学习'), centerTitle: true),
      body: const Center(child: Text('学习页面 - 开发中', style: TextStyle(fontSize: 18, color: Colors.grey))),
    );
  }
}

class AchievementPage extends StatelessWidget {
  const AchievementPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('成就'), centerTitle: true),
      body: const Center(child: Text('成就页面 - 开发中', style: TextStyle(fontSize: 18, color: Colors.grey))),
    );
  }
}
