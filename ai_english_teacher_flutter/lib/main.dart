import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'model_viewer_widget.dart';
import 'pet_data.dart';

void main() {
  registerModelViewer();
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
  late final PetData _petData;

  @override
  void initState() {
    super.initState();
    _petData = PetData.load();
  }

  void _onPetUpdated() {
    _petData.save();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          HomePage(petData: _petData, onNavigate: (i) => setState(() => _currentIndex = i)),
          StudyPage(petData: _petData, onUpdated: _onPetUpdated),
          PetPage(petData: _petData, onUpdated: _onPetUpdated),
          AchievementPage(petData: _petData),
        ],
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
  final PetData petData;
  final VoidCallback onUpdated;

  PetPage({super.key, required this.petData, required this.onUpdated});

  @override
  State<PetPage> createState() => _PetPageState();
}

class _PetPageState extends State<PetPage> with SingleTickerProviderStateMixin {
  String _currentAnimation = 'idle';
  bool _modelLoaded = false;
  String? _bubbleText;
  bool _showMiniGame = false;
  int _miniGameScore = 0;
  int _miniGameTarget = 0;
  String _miniGameEmoji = '';

  // 装扮系统
  static const List<Map<String, dynamic>> _accessories = [
    {'id': 'hat_crown', 'name': '皇冠', 'icon': '👑', 'price': 50, 'type': 'hat'},
    {'id': 'hat_cap', 'name': '鸭舌帽', 'icon': '🧢', 'price': 30, 'type': 'hat'},
    {'id': 'hat_tophat', 'name': '礼帽', 'icon': '🎩', 'price': 80, 'type': 'hat'},
    {'id': 'glasses_sun', 'name': '太阳镜', 'icon': '🕶️', 'price': 40, 'type': 'glasses'},
    {'id': 'glasses_round', 'name': '圆框眼镜', 'icon': '👓', 'price': 25, 'type': 'glasses'},
    {'id': 'bow_tie', 'name': '领结', 'icon': '🎀', 'price': 35, 'type': 'accessory'},
    {'id': 'scarf', 'name': '围巾', 'icon': '🧣', 'price': 45, 'type': 'accessory'},
    {'id': 'flower', 'name': '小花', 'icon': '🌸', 'price': 20, 'type': 'accessory'},
  ];

  late AnimationController _bubbleAnim;

  final List<String> _animations = ['idle', 'walk', 'run', 'dance', 'sit', 'wave'];
  final Map<String, String> _animLabels = {
    'idle': '闲逛', 'walk': '走路', 'run': '奔跑', 'dance': '跳舞', 'sit': '坐下', 'wave': '挥手',
  };
  final Map<String, IconData> _animIcons = {
    'idle': Icons.visibility, 'walk': Icons.directions_walk, 'run': Icons.directions_run,
    'dance': Icons.music_note, 'sit': Icons.event_seat, 'wave': Icons.pan_tool,
  };

  final List<String> _tapLines = [
    'Hey! That tickles! 😄', 'Hehe, stop it! 🤭', 'I love playing with you! ',
    "Let's learn English together! 📚", 'You are my best friend! 🌟',
    'Can you teach me a new word? ', 'I feel so happy today! 🎉', 'Wow, you clicked me! 😆',
    'Play a mini-game with me! 🎮', 'You make me smile! 😊',
  ];
  final List<String> _feedLines = [
    'Yummy! Thank you! 🍕', 'Delicious! More please! ', 'My tummy is full! ',
    "That's the best food ever! 🍰", 'Nom nom nom! 😋',
  ];
  final List<String> _playLines = [
    'So much fun! 🎮', 'Again! Again! 🎪', 'Wheee! I love this! ', "You're the best playmate! 🎯",
    'This is awesome! 🌟',
  ];
  final List<String> _studyLines = [
    "Let's learn English! 📖", 'I know a new word! 🎓', 'Teach me more! 📝', 'Learning is fun! ✨',
    'English is easy! 📚',
  ];

  @override
  void initState() {
    super.initState();
    _bubbleAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    widget.petData.recordInteraction();
  }

  @override
  void dispose() {
    _bubbleAnim.dispose();
    super.dispose();
  }

  String get _moodEmoji => widget.petData.petMoodEmoji;

  void _playAnim(String name) {
    // 直接更新动画，不重建 Widget（移除 ValueKey 后不再需要 setState 切换）
    ModelViewerWidget.setAnimation(name);
    setState(() => _currentAnimation = name);
  }

  void _showBubble(String text) {
    setState(() { _bubbleText = text; _bubbleAnim.forward(from: 0); });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _bubbleAnim.reverse();
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) setState(() => _bubbleText = null);
        });
      }
    });
  }

  String _randomFrom(List<String> list) => list[DateTime.now().millisecondsSinceEpoch % list.length];

  void _onPetTap() {
    _playAnim('interact');
    _showBubble(_randomFrom(_tapLines));
    widget.petData.addMood(2);
    widget.petData.addExp(1);
    widget.petData.totalInteractions++;
    widget.petData.recordInteraction();
    widget.onUpdated();
    setState(() {});
  }

  void _onFeed() {
    _playAnim('cheer');
    _showBubble(_randomFrom(_feedLines));
    widget.petData.addHunger(15);
    widget.petData.addMood(5);
    widget.petData.addExp(5);
    widget.petData.totalFeedings++;
    widget.petData.totalInteractions++;
    widget.petData.recordInteraction();
    widget.petData.advanceDailyTask('feed');
    if (widget.petData.checkLevelUp()) {
      _playAnim('celebrate');
      _showBubble('🎉 Level Up! Now Lv.${widget.petData.level}!');
    }
    widget.onUpdated();
    setState(() {});
  }

  void _onPlay() {
    _playAnim('dance');
    _showBubble(_randomFrom(_playLines));
    widget.petData.addMood(15);
    widget.petData.addHunger(-5);
    widget.petData.addExp(8);
    widget.petData.totalPlays++;
    widget.petData.totalInteractions++;
    widget.petData.recordInteraction();
    if (widget.petData.checkLevelUp()) {
      _playAnim('celebrate');
      _showBubble('🎉 Level Up! Now Lv.${widget.petData.level}!');
    }
    widget.onUpdated();
    setState(() {});
  }

  void _onStudy() {
    _playAnim('sit_talk');
    _showBubble(_randomFrom(_studyLines));
    widget.petData.addExp(15);
    widget.petData.addMood(3);
    widget.petData.totalStudies++;
    widget.petData.totalInteractions++;
    widget.petData.recordInteraction();
    if (widget.petData.checkLevelUp()) {
      _playAnim('celebrate');
      _showBubble('🎉 Level Up! Now Lv.${widget.petData.level}!');
    }
    widget.onUpdated();
    setState(() {});
  }

  void _showDressUpShop() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DressUpShopSheet(
        petData: widget.petData,
        accessories: _accessories,
        onUpdated: widget.onUpdated,
      ),
    );
  }

  void _startMiniGame() {
    setState(() {
      _showMiniGame = true;
      _miniGameScore = 0;
      _generateMiniGameTarget();
    });
  }

  void _generateMiniGameTarget() {
    final emojis = ['🎈', '🎁', '🍎', '⭐', '🌟', '💎', '🎯', '🎪'];
    setState(() {
      _miniGameTarget = DateTime.now().millisecondsSinceEpoch % 10;
      _miniGameEmoji = emojis[DateTime.now().millisecondsSinceEpoch % emojis.length];
    });
  }

  void _onMiniGameTap(int number) {
    if (number == _miniGameTarget) {
      setState(() => _miniGameScore++);
      _playAnim('dance');
      _showBubble('Correct! +1 🎉');
      widget.petData.addExp(2);
      widget.petData.addMood(1);
      widget.petData.coins += 1;
      widget.onUpdated();
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) _generateMiniGameTarget();
      });
    } else {
      _playAnim('idle');
      _showBubble('Try again! 💪');
    }
  }

  void _endMiniGame() {
    setState(() => _showMiniGame = false);
    if (_miniGameScore > 0) {
      widget.petData.addExp(_miniGameScore * 3);
      widget.petData.addMood(_miniGameScore * 2);
      widget.petData.coins += _miniGameScore * 2;
      widget.petData.addLog('小游戏获得 $_miniGameScore 分');
      widget.onUpdated();
      _showBubble('Great job! +${_miniGameScore * 3} EXP! 🌟');
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
            icon: const Icon(Icons.checkroom),
            tooltip: '装扮',
            onPressed: _showDressUpShop,
          ),
          IconButton(
            icon: const Icon(Icons.videogame_asset),
            tooltip: '小游戏',
            onPressed: _startMiniGame,
          ),
          IconButton(
            icon: const Icon(Icons.mic),
            tooltip: '语音对话',
            onPressed: () => _showBubble("Hi! I'm Bella! Let's chat! 🎤"),
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
                        'Lv.${widget.petData.level}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
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
                  // 3D 模型填满整个卡片区域，使用 Positioned.fill
                  Positioned.fill(
                    child: ModelViewerWidget(
                      src: 'assets/models/poppy-the-mouse.glb',
                      animationName: _currentAnimation,
                      autoRotate: true,
                      cameraControls: true,
                      shadowIntensity: 0.5,
                      backgroundColor: 'transparent',
                      onModelReady: () => setState(() => _modelLoaded = true),
                      onTap: _onPetTap,
                    ),
                  ),
                  if (!_modelLoaded)
                    const Positioned.fill(
                      child: _LoadingOverlay(),
                    ),
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Column(
                      children: [
                        Text(
                          widget.petData.petName,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade800,
                            shadows: [Shadow(color: Colors.white, blurRadius: 4)],
                          ),
                        ),
                        Text(
                          'Tap me to interact! 💕',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Current Accessory Display
            if (widget.petData.accessory != 'none')
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.purple.shade200, Colors.pink.shade200],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Text(
                      _getAccessoryIcon(widget.petData.accessory),
                      style: const TextStyle(fontSize: 32),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '当前装扮: ${_getAccessoryName(widget.petData.accessory)}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            '点击装扮按钮更换配饰',
                            style: const TextStyle(fontSize: 12, color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (widget.petData.accessory != 'none') const SizedBox(height: 12),

            // Pet Mood Status
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getMoodColor(widget.petData.petMoodState).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _getMoodColor(widget.petData.petMoodState), width: 2),
              ),
              child: Row(
                children: [
                  Text(
                    widget.petData.petMoodEmoji,
                    style: const TextStyle(fontSize: 32),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '宠物状态: ${widget.petData.petMoodLabel}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _getMoodColor(widget.petData.petMoodState),
                          ),
                        ),
                        Text(
                          _getMoodDescription(widget.petData.petMoodState),
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Stats
            _buildStatCard('经验值', widget.petData.exp, 100, Colors.blue, Icons.star),
            const SizedBox(height: 12),
            _buildStatCard('饱腹度', widget.petData.hunger, 100, Colors.orange, Icons.restaurant),
            const SizedBox(height: 12),
            _buildStatCard('心情', widget.petData.mood, 100, Colors.pink, Icons.favorite),
            const SizedBox(height: 20),

            // Animation Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: _animations
                    .map((name) => _animBtn(
                          name,
                          _animIcons[name]!,
                          _animLabels[name]!,
                          () => _playAnim(name),
                        ))
                    .toList(),
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
            Text(
              '今日互动 ${widget.petData.totalInteractions} 次 | 💰 ${widget.petData.coins}',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
      // Mini-game overlay
      floatingActionButton: _showMiniGame
          ? FloatingActionButton.extended(
              onPressed: _endMiniGame,
              icon: const Icon(Icons.close),
              label: Text('结束 (得分: $_miniGameScore)'),
              backgroundColor: Colors.pink,
            )
          : null,
      bottomSheet: _showMiniGame
          ? Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '🎮 数字小游戏',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '点击数字 $_miniGameTarget $_miniGameEmoji',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true,
                    crossAxisCount: 4,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    children: List.generate(12, (index) {
                      final number = (index + 1) % 10;
                      return GestureDetector(
                        onTap: () => _onMiniGameTap(number),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.pink.shade200, Colors.purple.shade200],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                          ),
                          child: Center(
                            child: Text(
                              '$number',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            )
          : null,
    );
  }

  Widget _buildStatCard(String label, int value, int max, Color color, IconData icon) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [Icon(icon, size: 20, color: color), const SizedBox(width: 8), Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))]),
          Text('$value / $max', style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
        ]),
        const SizedBox(height: 8),
        ClipRRect(borderRadius: BorderRadius.circular(6), child: LinearProgressIndicator(value: value / max, backgroundColor: Colors.grey.shade200, valueColor: AlwaysStoppedAnimation<Color>(color), minHeight: 10)),
      ]),
    );
  }

  String _getAccessoryIcon(String id) {
    final acc = _accessories.firstWhere((a) => a['id'] == id, orElse: () => {'icon': '❓'});
    return acc['icon'] as String;
  }

  String _getAccessoryName(String id) {
    final acc = _accessories.firstWhere((a) => a['id'] == id, orElse: () => {'name': '未知'});
    return acc['name'] as String;
  }

  Color _getMoodColor(String state) {
    switch (state) {
      case 'happy': return Colors.green;
      case 'hungry': return Colors.red;
      case 'bored': return Colors.grey;
      case 'sad': return Colors.blue;
      case 'angry': return Colors.deepOrange;
      default: return Colors.amber;
    }
  }

  String _getMoodDescription(String state) {
    switch (state) {
      case 'happy': return '宠物很开心，继续互动吧！';
      case 'hungry': return '宠物饿了，快喂食！';
      case 'bored': return '宠物有点无聊，和它玩耍吧！';
      case 'sad': return '宠物有点难过，多陪陪它！';
      case 'angry': return '宠物生气了！快互动！';
      default: return '宠物状态一般。';
    }
  }

  Widget _animBtn(String key, IconData icon, String label, VoidCallback onTap) {
    final isActive = _currentAnimation == key;
    return Material(color: isActive ? Colors.pink.shade100 : Colors.white, borderRadius: BorderRadius.circular(12), elevation: isActive ? 2 : 0,
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(12),
        child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Column(children: [
            Icon(icon, color: isActive ? Colors.pink : Colors.grey.shade700, size: 22),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, color: isActive ? Colors.pink : Colors.grey.shade700, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
          ]),
        ),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label, Color color, VoidCallback onTap, String bonus) {
    return Material(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16),
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(16),
        child: Container(padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 2),
            Text(bonus, style: TextStyle(color: color.withOpacity(0.7), fontSize: 11)),
          ]),
        ),
      ),
    );
  }
}

// ==================== Study Page ====================

class StudyPage extends StatefulWidget {
  final PetData petData;
  final VoidCallback onUpdated;

  StudyPage({super.key, required this.petData, required this.onUpdated});

  @override
  State<StudyPage> createState() => _StudyPageState();
}

class _StudyPageState extends State<StudyPage> {
  int _currentTab = 0; // 0=words, 1=quiz, 2=spelling, 3=listening, 4=review

  // Word database
  final List<Map<String, String>> _words = [
    {'word': 'Apple', 'meaning': '苹果', 'example': 'I eat an apple every day.', 'emoji': '🍎'},
    {'word': 'Book', 'meaning': '书', 'example': 'She is reading a book.', 'emoji': '📚'},
    {'word': 'Cat', 'meaning': '猫', 'example': 'The cat is sleeping.', 'emoji': '🐱'},
    {'word': 'Dog', 'meaning': '狗', 'example': 'My dog likes to play.', 'emoji': '🐶'},
    {'word': 'Elephant', 'meaning': '大象', 'example': 'The elephant is very big.', 'emoji': '🐘'},
    {'word': 'Flower', 'meaning': '花', 'example': 'The flower is beautiful.', 'emoji': '🌸'},
    {'word': 'Guitar', 'meaning': '吉他', 'example': 'He plays the guitar.', 'emoji': '🎸'},
    {'word': 'House', 'meaning': '房子', 'example': 'We live in a big house.', 'emoji': '🏠'},
    {'word': 'Ice cream', 'meaning': '冰淇淋', 'example': 'I love ice cream!', 'emoji': '🍦'},
    {'word': 'Juice', 'meaning': '果汁', 'example': 'She drinks orange juice.', 'emoji': '🧃'},
    {'word': 'Kite', 'meaning': '风筝', 'example': 'Let us fly a kite!', 'emoji': '🪁'},
    {'word': 'Lion', 'meaning': '狮子', 'example': 'The lion is the king.', 'emoji': '🦁'},
    {'word': 'Moon', 'meaning': '月亮', 'example': 'The moon is bright tonight.', 'emoji': '🌙'},
    {'word': 'Nest', 'meaning': '鸟巢', 'example': 'Birds live in a nest.', 'emoji': '🪺'},
    {'word': 'Orange', 'meaning': '橙子', 'example': 'This orange is sweet.', 'emoji': '🍊'},
    {'word': 'Pencil', 'meaning': '铅笔', 'example': 'I write with a pencil.', 'emoji': '✏️'},
    {'word': 'Queen', 'meaning': '女王', 'example': 'The queen wears a crown.', 'emoji': '👑'},
    {'word': 'Rainbow', 'meaning': '彩虹', 'example': 'Look at the rainbow!', 'emoji': '🌈'},
    {'word': 'Star', 'meaning': '星星', 'example': 'The star is shining.', 'emoji': '⭐'},
    {'word': 'Tree', 'meaning': '树', 'example': 'The tree is very tall.', 'emoji': '🌳'},
  ];

  // Quiz questions
  List<Map<String, dynamic>> _generateQuiz() {
    final shuffled = List<Map<String, String>>.from(_words)..shuffle();
    final questions = <Map<String, dynamic>>[];
    for (int i = 0; i < 5 && i < shuffled.length; i++) {
      final correct = shuffled[i];
      final wrongOptions = _words.where((w) => w['word'] != correct['word']).toList()..shuffle();
      final options = [correct['meaning'], wrongOptions[0]['meaning'], wrongOptions[1]['meaning'], wrongOptions[2]['meaning']]..shuffle();
      questions.add({
        'word': correct['word'],
        'emoji': correct['emoji'],
        'answer': correct['meaning'],
        'options': options,
      });
    }
    return questions;
  }

  // Spelling practice
  List<Map<String, dynamic>> _generateSpelling() {
    final shuffled = List<Map<String, String>>.from(_words)..shuffle();
    return shuffled.take(5).map((w) {
      final word = w['word']!;
      final hint = word[0] + '_' * (word.length - 2) + word[word.length - 1];
      return {
        'word': word,
        'meaning': w['meaning'],
        'emoji': w['emoji'],
        'hint': hint,
      };
    }).toList();
  }

  // Listening practice
  List<Map<String, dynamic>> _generateListening() {
    final shuffled = List<Map<String, String>>.from(_words)..shuffle();
    return shuffled.take(5).map((w) {
      final correct = w['word'];
      final wrongOptions = _words.where((word) => word['word'] != correct).toList()..shuffle();
      final options = [correct, wrongOptions[0]['word'], wrongOptions[1]['word'], wrongOptions[2]['word']]..shuffle();
      return {
        'sentence': w['example'],
        'answer': correct,
        'options': options,
      };
    }).toList();
  }

  List<Map<String, dynamic>>? _quiz;
  int _quizIndex = 0;
  int _quizScore = 0;
  bool _quizFinished = false;
  String? _selectedAnswer;
  bool _answered = false;

  // Spelling state
  List<Map<String, dynamic>>? _spelling;
  int _spellingIndex = 0;
  int _spellingScore = 0;
  bool _spellingFinished = false;
  final _spellingController = TextEditingController();

  // Listening state
  List<Map<String, dynamic>>? _listening;
  int _listeningIndex = 0;
  int _listeningScore = 0;
  bool _listeningFinished = false;
  String? _listeningAnswer;
  bool _listeningAnswered = false;

  // Review state
  List<String> _reviewWords = [];
  int _reviewIndex = 0;
  int _reviewScore = 0;
  bool _reviewFinished = false;
  String? _reviewAnswer;
  bool _reviewAnswered = false;

  @override
  void initState() {
    super.initState();
    _startNewQuiz();
    _startNewSpelling();
    _startNewListening();
    _startReview();
  }

  @override
  void dispose() {
    _spellingController.dispose();
    super.dispose();
  }

  void _startNewQuiz() {
    _quiz = _generateQuiz();
    _quizIndex = 0;
    _quizScore = 0;
    _quizFinished = false;
    _selectedAnswer = null;
    _answered = false;
  }

  void _startNewSpelling() {
    _spelling = _generateSpelling();
    _spellingIndex = 0;
    _spellingScore = 0;
    _spellingFinished = false;
    _spellingController.clear();
  }

  void _startNewListening() {
    _listening = _generateListening();
    _listeningIndex = 0;
    _listeningScore = 0;
    _listeningFinished = false;
    _listeningAnswer = null;
    _listeningAnswered = false;
  }

  void _startReview() {
    _reviewWords = widget.petData.getWordsDueForReview();
    _reviewIndex = 0;
    _reviewScore = 0;
    _reviewFinished = false;
    _reviewAnswer = null;
    _reviewAnswered = false;
  }

  void _checkReviewAnswer(String answer) {
    if (_reviewAnswered) return;
    setState(() {
      _reviewAnswer = answer;
      _reviewAnswered = true;
    });
    final word = _reviewWords[_reviewIndex];
    final wordData = _words.firstWhere((w) => w['word'] == word, orElse: () => {'meaning': ''});
    final isCorrect = answer == wordData['meaning'];
    if (isCorrect) {
      _reviewScore++;
      widget.petData.markWordReviewed(word);
      widget.petData.addExp(3);
      widget.petData.coins += 2;
    }

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      if (_reviewIndex + 1 < _reviewWords.length) {
        setState(() {
          _reviewIndex++;
          _reviewAnswer = null;
          _reviewAnswered = false;
        });
      } else {
        setState(() => _reviewFinished = true);
        widget.petData.addMood(_reviewScore * 2);
        widget.petData.addLog('复习完成，答对 $_reviewScore 题');
        widget.onUpdated();
      }
    });
  }

  void _checkAnswer(String answer) {
    if (_answered) return;
    setState(() {
      _selectedAnswer = answer;
      _answered = true;
    });
    final isCorrect = answer == _quiz![_quizIndex]['answer'];
    if (isCorrect) _quizScore++;

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      if (_quizIndex + 1 < _quiz!.length) {
        setState(() {
          _quizIndex++;
          _selectedAnswer = null;
          _answered = false;
        });
      } else {
        setState(() => _quizFinished = true);
        widget.petData.quizzesPassed++;
        widget.petData.addExp(_quizScore * 5);
        widget.petData.addMood(_quizScore * 3);
        if (_quizScore > widget.petData.highScoreQuiz) {
          widget.petData.highScoreQuiz = _quizScore;
        }
        widget.petData.addLog('测验获得 $_quizScore 分');
        widget.petData.advanceDailyTask('quiz');
        widget.onUpdated();
      }
    });
  }

  void _checkSpelling() {
    if (_spellingIndex >= _spelling!.length) return;
    final answer = _spellingController.text.trim().toLowerCase();
    final correct = (_spelling![_spellingIndex]['word'] as String).toLowerCase();
    
    if (answer == correct) {
      _spellingScore++;
      widget.petData.learnWord(_spelling![_spellingIndex]['word']);
      widget.petData.addExp(3);
      widget.petData.coins += 2;
    }

    if (_spellingIndex + 1 < _spelling!.length) {
      setState(() {
        _spellingIndex++;
        _spellingController.clear();
      });
    } else {
      setState(() => _spellingFinished = true);
      widget.petData.spellingPassed++;
      widget.petData.addMood(_spellingScore * 2);
      widget.petData.addLog('拼写练习获得 $_spellingScore 分');
      widget.onUpdated();
    }
  }

  void _checkListening(String answer) {
    if (_listeningAnswered) return;
    setState(() {
      _listeningAnswer = answer;
      _listeningAnswered = true;
    });
    final isCorrect = answer == _listening![_listeningIndex]['answer'];
    if (isCorrect) {
      _listeningScore++;
      widget.petData.addExp(3);
      widget.petData.coins += 2;
    }

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      if (_listeningIndex + 1 < _listening!.length) {
        setState(() {
          _listeningIndex++;
          _listeningAnswer = null;
          _listeningAnswered = false;
        });
      } else {
        setState(() => _listeningFinished = true);
        widget.petData.addMood(_listeningScore * 2);
        widget.petData.addLog('听力练习获得 $_listeningScore 分');
        widget.onUpdated();
      }
    });
  }

  void _speakWord(String word) {
    // Use Web Speech API
    final script = "if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance('$word');u.lang='en-US';u.rate=0.8;speechSynthesis.speak(u);}";
    final scriptEl = html.ScriptElement()..text = script;
    html.document.body!.append(scriptEl);
    scriptEl.remove();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('学习'), centerTitle: true),
      body: Column(children: [
        // Tab bar
        Container(
          margin: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Expanded(child: _tabBtn('单词', 0)),
            Expanded(child: _tabBtn('测验', 1)),
            Expanded(child: _tabBtn('拼写', 2)),
            Expanded(child: _tabBtn('听力', 3)),
            Expanded(child: _tabBtn('复习', 4)),
          ]),
        ),
        Expanded(
          child: _currentTab == 0
              ? _buildWordCards()
              : _currentTab == 1
                  ? _buildQuiz()
                  : _currentTab == 2
                      ? _buildSpelling()
                      : _currentTab == 3
                          ? _buildListening()
                          : _buildReview(),
        ),
      ]),
    );
  }

  Widget _tabBtn(String label, int index) {
    final isActive = _currentTab == index;
    return GestureDetector(
      onTap: () => setState(() => _currentTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? Colors.pink : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: isActive ? Colors.white : Colors.grey.shade700, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildWordCards() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _words.length,
      itemBuilder: (context, i) {
        final w = _words[i];
        final learned = widget.petData.learnedWords.contains(w['word']);
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              // 点击单词时朗读单词
              _speakWord(w['word']!);
              widget.petData.learnWord(w['word']!);
              widget.petData.advanceDailyTask('learn');
              widget.onUpdated();
              setState(() {});
            },
            child: Padding(padding: const EdgeInsets.all(16),
              child: Row(children: [
                Text(w['emoji']!, style: const TextStyle(fontSize: 36)),
                const SizedBox(width: 16),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text(w['word']!, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    if (learned) const Icon(Icons.check_circle, color: Colors.green, size: 18),
                  ]),
                  Text(w['meaning']!, style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(w['example']!, style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontStyle: FontStyle.italic)),
                ])),
                Icon(Icons.touch_app, color: Colors.pink.shade200, size: 24),
              ]),
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuiz() {
    if (_quizFinished) {
      final pct = (_quizScore / _quiz!.length * 100).round();
      return Center(
        child: Padding(padding: const EdgeInsets.all(32),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪', style: const TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            Text('测验完成!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
            const SizedBox(height: 8),
            Text('得分: $_quizScore / ${_quiz!.length} ($pct%)', style: TextStyle(fontSize: 18, color: Colors.grey.shade600)),
            const SizedBox(height: 8),
            Text('获得 ${_quizScore * 5} 经验值!', style: TextStyle(fontSize: 16, color: Colors.blue.shade600)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () { setState(() => _startNewQuiz()); },
              icon: const Icon(Icons.refresh), label: const Text('再来一轮'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            ),
          ]),
        ),
      );
    }

    final q = _quiz![_quizIndex];
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        // Progress
        LinearProgressIndicator(value: (_quizIndex + 1) / _quiz!.length, backgroundColor: Colors.grey.shade200, valueColor: AlwaysStoppedAnimation<Color>(Colors.pink), minHeight: 6),
        const SizedBox(height: 8),
        Text('第 ${_quizIndex + 1} / ${_quiz!.length} 题', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
        const SizedBox(height: 32),
        // Question
        Text(q['emoji'] as String, style: const TextStyle(fontSize: 64)),
        const SizedBox(height: 16),
        InkWell(
          onTap: () => _speakWord(q['word'] as String),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('「${q['word']}」是什么意思?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
              const SizedBox(width: 8),
              Icon(Icons.volume_up, color: Colors.pink, size: 24),
            ],
          ),
        ),
        const SizedBox(height: 32),
        // Options
        ...(q['options'] as List<String>).map((opt) {
          Color? bgColor;
          Color? textColor;
          if (_answered) {
            if (opt == q['answer']) { bgColor = Colors.green.shade100; textColor = Colors.green.shade800; }
            else if (opt == _selectedAnswer) { bgColor = Colors.red.shade100; textColor = Colors.red.shade800; }
          }
          return Padding(padding: const EdgeInsets.only(bottom: 12),
            child: SizedBox(width: double.infinity,
              child: ElevatedButton(
                onPressed: _answered ? null : () => _checkAnswer(opt),
                style: ElevatedButton.styleFrom(
                  backgroundColor: bgColor, foregroundColor: textColor ?? Colors.grey.shade800,
                  padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 1,
                ),
                child: Text(opt, style: const TextStyle(fontSize: 16)),
              ),
            ),
          );
        }),
      ]),
    );
  }

  Widget _buildSpelling() {
    if (_spellingFinished) {
      final pct = (_spellingScore / _spelling!.length * 100).round();
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪',
                style: const TextStyle(fontSize: 64),
              ),
              const SizedBox(height: 16),
              Text(
                '拼写完成!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
              ),
              const SizedBox(height: 8),
              Text(
                '得分: $_spellingScore / ${_spelling!.length} ($pct%)',
                style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 8),
              Text(
                '获得 ${_spellingScore * 3} 经验值!',
                style: TextStyle(fontSize: 16, color: Colors.blue.shade600),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() => _startNewSpelling());
                },
                icon: const Icon(Icons.refresh),
                label: const Text('再来一轮'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final item = _spelling![_spellingIndex];
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          LinearProgressIndicator(
            value: (_spellingIndex + 1) / _spelling!.length,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
            minHeight: 6,
          ),
          const SizedBox(height: 8),
          Text(
            '第 ${_spellingIndex + 1} / ${_spelling!.length} 题',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
          const SizedBox(height: 32),
          Text(
            item['emoji'] as String,
            style: const TextStyle(fontSize: 64),
          ),
          const SizedBox(height: 16),
          Text(
            item['meaning'] as String,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _speakWord(item['word'] as String),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.volume_up, color: Colors.green, size: 20),
                const SizedBox(width: 4),
                Text(
                  '听发音',
                  style: TextStyle(fontSize: 14, color: Colors.green),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '提示: ${item['hint']}',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _spellingController,
            decoration: InputDecoration(
              hintText: '输入英文单词',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              prefixIcon: const Icon(Icons.edit),
            ),
            style: const TextStyle(fontSize: 18),
            onSubmitted: (_) => _checkSpelling(),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _checkSpelling,
              icon: const Icon(Icons.check),
              label: const Text('提交'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListening() {
    if (_listeningFinished) {
      final pct = (_listeningScore / _listening!.length * 100).round();
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪',
                style: const TextStyle(fontSize: 64),
              ),
              const SizedBox(height: 16),
              Text(
                '听力完成!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
              ),
              const SizedBox(height: 8),
              Text(
                '得分: $_listeningScore / ${_listening!.length} ($pct%)',
                style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 8),
              Text(
                '获得 ${_listeningScore * 3} 经验值!',
                style: TextStyle(fontSize: 16, color: Colors.blue.shade600),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() => _startNewListening());
                },
                icon: const Icon(Icons.refresh),
                label: const Text('再来一轮'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final item = _listening![_listeningIndex];
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          LinearProgressIndicator(
            value: (_listeningIndex + 1) / _listening!.length,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.purple),
            minHeight: 6,
          ),
          const SizedBox(height: 8),
          Text(
            '第 ${_listeningIndex + 1} / ${_listening!.length} 题',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
          const SizedBox(height: 32),
          const Icon(Icons.volume_up, size: 64, color: Colors.purple),
          const SizedBox(height: 16),
          Text(
            '听句子，选择正确的单词',
            style: TextStyle(fontSize: 18, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => _speakWord(item['sentence'] as String),
            icon: const Icon(Icons.play_arrow),
            label: const Text('播放句子'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 32),
          ...(item['options'] as List<String>).map((opt) {
            Color? bgColor;
            Color? textColor;
            if (_listeningAnswered) {
              if (opt == item['answer']) {
                bgColor = Colors.green.shade100;
                textColor = Colors.green.shade800;
              } else if (opt == _listeningAnswer) {
                bgColor = Colors.red.shade100;
                textColor = Colors.red.shade800;
              }
            }
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _listeningAnswered ? null : () => _checkListening(opt),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: bgColor,
                    foregroundColor: textColor ?? Colors.grey.shade800,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 1,
                  ),
                  child: Text(opt, style: const TextStyle(fontSize: 16)),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildReview() {
    if (_reviewWords.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, size: 80, color: Colors.green),
              const SizedBox(height: 16),
              Text(
                '暂无需要复习的单词',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
              ),
              const SizedBox(height: 8),
              Text(
                '先去学习页面学习新单词吧！',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => setState(() => _currentTab = 0),
                icon: const Icon(Icons.menu_book),
                label: const Text('去学习单词'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_reviewFinished) {
      final pct = (_reviewScore / _reviewWords.length * 100).round();
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪', style: const TextStyle(fontSize: 64)),
              const SizedBox(height: 16),
              Text(
                '复习完成!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
              ),
              const SizedBox(height: 8),
              Text(
                '得分: $_reviewScore / ${_reviewWords.length} ($pct%)',
                style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 8),
              Text(
                '获得 ${_reviewScore * 3} 经验值 + ${_reviewScore * 2} 金币!',
                style: TextStyle(fontSize: 16, color: Colors.blue.shade600),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _startReview();
                  });
                },
                icon: const Icon(Icons.refresh),
                label: const Text('再复习一轮'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final word = _reviewWords[_reviewIndex];
    final wordData = _words.firstWhere((w) => w['word'] == word, orElse: () => {'word': word, 'meaning': '未知', 'emoji': '📝'});
    final wrongOptions = _words.where((w) => w['word'] != word).toList()..shuffle();
    final options = [
      wordData['meaning']!,
      wrongOptions[0]['meaning']!,
      wrongOptions[1]['meaning']!,
      wrongOptions[2]['meaning']!,
    ]..shuffle();

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Info banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.indigo.shade300, Colors.purple.shade400],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.psychology, color: Colors.white, size: 24),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    '艾宾浩斯遗忘曲线复习',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                Text(
                  '待复习: ${_reviewWords.length}',
                  style: const TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          LinearProgressIndicator(
            value: (_reviewIndex + 1) / _reviewWords.length,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.indigo),
            minHeight: 6,
          ),
          const SizedBox(height: 8),
          Text(
            '第 ${_reviewIndex + 1} / ${_reviewWords.length} 题',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
          const SizedBox(height: 32),
          Text(wordData['emoji'] as String, style: const TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          InkWell(
            onTap: () => _speakWord(wordData['word'] as String),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '「${wordData['word']}」是什么意思?',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                ),
                const SizedBox(width: 8),
                Icon(Icons.volume_up, color: Colors.indigo, size: 24),
              ],
            ),
          ),
          const SizedBox(height: 32),
          ...options.map((opt) {
            Color? bgColor;
            Color? textColor;
            if (_reviewAnswered) {
              if (opt == wordData['meaning']) {
                bgColor = Colors.green.shade100;
                textColor = Colors.green.shade800;
              } else if (opt == _reviewAnswer) {
                bgColor = Colors.red.shade100;
                textColor = Colors.red.shade800;
              }
            }
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _reviewAnswered ? null : () => _checkReviewAnswer(opt),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: bgColor,
                    foregroundColor: textColor ?? Colors.grey.shade800,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 1,
                  ),
                  child: Text(opt, style: const TextStyle(fontSize: 16)),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ==================== Achievement Page ====================

class AchievementPage extends StatefulWidget {
  final PetData petData;

  AchievementPage({super.key, required this.petData});

  @override
  State<AchievementPage> createState() => _AchievementPageState();
}

class _AchievementPageState extends State<AchievementPage> {
  int _currentTab = 0; // 0=badges, 1=stats

  final List<Map<String, dynamic>> _allBadges = [
    {'id': 'first_feed', 'name': '初次喂食', 'desc': '第一次喂宠物', 'icon': '🍕', 'threshold': 1, 'field': 'totalFeedings'},
    {'id': 'feed_10', 'name': '美食家', 'desc': '喂食 10 次', 'icon': '🍱', 'threshold': 10, 'field': 'totalFeedings'},
    {'id': 'feed_50', 'name': '烹饪大师', 'desc': '喂食 50 次', 'icon': '👨‍🍳', 'threshold': 50, 'field': 'totalFeedings'},
    {'id': 'play_5', 'name': '玩伴', 'desc': '玩耍 5 次', 'icon': '🎮', 'threshold': 5, 'field': 'totalPlays'},
    {'id': 'play_20', 'name': '游戏达人', 'desc': '玩耍 20 次', 'icon': '🎯', 'threshold': 20, 'field': 'totalPlays'},
    {'id': 'study_5', 'name': '好学生', 'desc': '学习 5 次', 'icon': '📖', 'threshold': 5, 'field': 'totalStudies'},
    {'id': 'study_20', 'name': '学习狂人', 'desc': '学习 20 次', 'icon': '🎓', 'threshold': 20, 'field': 'totalStudies'},
    {'id': 'level_5', 'name': '成长之星', 'desc': '达到 Lv.5', 'icon': '⭐', 'threshold': 5, 'field': 'level'},
    {'id': 'level_10', 'name': '超级伙伴', 'desc': '达到 Lv.10', 'icon': '🌟', 'threshold': 10, 'field': 'level'},
    {'id': 'words_5', 'name': '词汇新手', 'desc': '学会 5 个单词', 'icon': '📝', 'threshold': 5, 'field': 'wordsLearned'},
    {'id': 'words_10', 'name': '词汇达人', 'desc': '学会 10 个单词', 'icon': '📚', 'threshold': 10, 'field': 'wordsLearned'},
    {'id': 'words_20', 'name': '词汇大师', 'desc': '学会 20 个单词', 'icon': '🏆', 'threshold': 20, 'field': 'wordsLearned'},
    {'id': 'quiz_3', 'name': '测验能手', 'desc': '通过 3 次测验', 'icon': '🎯', 'threshold': 3, 'field': 'quizzesPassed'},
    {'id': 'quiz_10', 'name': '测验专家', 'desc': '通过 10 次测验', 'icon': '🏅', 'threshold': 10, 'field': 'quizzesPassed'},
    {'id': 'spelling_5', 'name': '拼写高手', 'desc': '完成 5 次拼写练习', 'icon': '✍️', 'threshold': 5, 'field': 'spellingPassed'},
    {'id': 'interact_20', 'name': '最佳朋友', 'desc': '互动 20 次', 'icon': '💝', 'threshold': 20, 'field': 'totalInteractions'},
    {'id': 'interact_50', 'name': '挚友', 'desc': '互动 50 次', 'icon': '💖', 'threshold': 50, 'field': 'totalInteractions'},
    {'id': 'checkin_7', 'name': '坚持一周', 'desc': '连续签到 7 天', 'icon': '📅', 'threshold': 7, 'field': 'checkInStreak'},
    {'id': 'checkin_30', 'name': '月度达人', 'desc': '累计签到 30 天', 'icon': '🗓️', 'threshold': 30, 'field': 'totalCheckIns'},
    {'id': 'coins_100', 'name': '小富翁', 'desc': '累计获得 100 金币', 'icon': '💰', 'threshold': 100, 'field': 'coins'},
  ];

  int _getFieldValue(Map<String, dynamic> badge) {
    switch (badge['field']) {
      case 'totalFeedings': return widget.petData.totalFeedings;
      case 'totalPlays': return widget.petData.totalPlays;
      case 'totalStudies': return widget.petData.totalStudies;
      case 'level': return widget.petData.level;
      case 'wordsLearned': return widget.petData.wordsLearned;
      case 'quizzesPassed': return widget.petData.quizzesPassed;
      case 'spellingPassed': return widget.petData.spellingPassed;
      case 'totalInteractions': return widget.petData.totalInteractions;
      case 'checkInStreak': return widget.petData.checkInStreak;
      case 'totalCheckIns': return widget.petData.totalCheckIns;
      case 'coins': return widget.petData.coins;
      default: return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('成就'), centerTitle: true),
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Expanded(child: _tabBtn('徽章', 0)),
              Expanded(child: _tabBtn('统计', 1)),
            ]),
          ),
          Expanded(
            child: _currentTab == 0 ? _buildBadges() : _buildStats(),
          ),
        ],
      ),
    );
  }

  Widget _tabBtn(String label, int index) {
    final isActive = _currentTab == index;
    return GestureDetector(
      onTap: () => setState(() => _currentTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? Colors.pink : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.grey.shade700,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildBadges() {
    final unlocked = widget.petData.unlockedBadges.toSet();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.amber.shade300, Colors.orange.shade400],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text(
                  '🏆 成就总览',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _summaryItem('已解锁', '${unlocked.length}', Icons.check_circle),
                    _summaryItem('总进度', '${unlocked.length}/${_allBadges.length}', Icons.flag),
                    _summaryItem('等级', 'Lv.${widget.petData.level}', Icons.star),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('徽章列表', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ..._allBadges.map((badge) {
            final val = _getFieldValue(badge);
            final isUnlocked = val >= (badge['threshold'] as int);
            final progress = (val / (badge['threshold'] as int)).clamp(0.0, 1.0);
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              color: isUnlocked ? Colors.white : Colors.grey.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: isUnlocked ? Colors.amber.shade100 : Colors.grey.shade200,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          badge['icon'] as String,
                          style: const TextStyle(fontSize: 28),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                badge['name'] as String,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: isUnlocked ? Colors.grey.shade800 : Colors.grey.shade400,
                                ),
                              ),
                              if (isUnlocked) ...[
                                const SizedBox(width: 6),
                                const Icon(Icons.verified, color: Colors.amber, size: 18),
                              ],
                            ],
                          ),
                          Text(
                            badge['desc'] as String,
                            style: TextStyle(
                              fontSize: 12,
                              color: isUnlocked ? Colors.grey.shade600 : Colors.grey.shade400,
                            ),
                          ),
                          if (!isUnlocked) ...[
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: progress,
                                backgroundColor: Colors.grey.shade200,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.pink),
                                minHeight: 6,
                              ),
                            ),
                            Text(
                              '$val / ${badge['threshold']}',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overall Stats
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade300, Colors.purple.shade400],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text(
                  '📊 学习统计',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _statItem('单词', '${widget.petData.wordsLearned}', Icons.menu_book),
                    _statItem('测验', '${widget.petData.quizzesPassed}', Icons.quiz),
                    _statItem('拼写', '${widget.petData.spellingPassed}', Icons.edit),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Detailed Stats
          const Text('详细数据', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _statCard('总互动次数', '${widget.petData.totalInteractions}', Icons.touch_app, Colors.pink),
          const SizedBox(height: 12),
          _statCard('喂食次数', '${widget.petData.totalFeedings}', Icons.restaurant, Colors.orange),
          const SizedBox(height: 12),
          _statCard('玩耍次数', '${widget.petData.totalPlays}', Icons.sports_esports, Colors.blue),
          const SizedBox(height: 12),
          _statCard('学习次数', '${widget.petData.totalStudies}', Icons.school, Colors.green),
          const SizedBox(height: 12),
          _statCard('已学单词', '${widget.petData.wordsLearned}', Icons.menu_book, Colors.purple),
          const SizedBox(height: 12),
          _statCard('通过测验', '${widget.petData.quizzesPassed}', Icons.quiz, Colors.indigo),
          const SizedBox(height: 12),
          _statCard('拼写练习', '${widget.petData.spellingPassed}', Icons.edit, Colors.teal),
          const SizedBox(height: 12),
          _statCard('最高分', '${widget.petData.highScoreQuiz}', Icons.emoji_events, Colors.amber),
          const SizedBox(height: 12),
          _statCard('连续签到', '${widget.petData.checkInStreak} 天', Icons.local_fire_department, Colors.red),
          const SizedBox(height: 12),
          _statCard('总签到', '${widget.petData.totalCheckIns} 天', Icons.calendar_today, Colors.cyan),
          const SizedBox(height: 12),
          _statCard('金币', '${widget.petData.coins}', Icons.monetization_on, Colors.yellow.shade700),
          const SizedBox(height: 20),

          // Recent Activity
          if (widget.petData.activityLog.isNotEmpty) ...[
            const Text('最近活动', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: widget.petData.activityLog.take(10).map((log) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time, size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              log,
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _statItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.grey.shade700),
              ),
            ),
            Text(
              value,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }
}

// ==================== Home Page ====================

class HomePage extends StatefulWidget {
  final PetData petData;
  final Function(int) onNavigate;

  HomePage({super.key, required this.petData, required this.onNavigate});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 6) return 'Good Night! 🌙';
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 18) return 'Good Afternoon! 🌤️';
    return 'Good Evening! 🌆';
  }

  void _doCheckIn() {
    if (widget.petData.doCheckIn()) {
      widget.petData.save();
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('签到成功! 获得 ${10 + (widget.petData.checkInStreak > 7 ? 20 : widget.petData.checkInStreak > 3 ? 10 : 0)} 金币 💰'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('今天已经签到过了!'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI English Teacher'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.monetization_on),
            tooltip: '金币',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('💰 当前金币: ${widget.petData.coins}')),
              );
            },
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.pink.shade200, Colors.purple.shade200, Colors.indigo.shade100],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting
              Text(
                _getGreeting(),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const Text(
                'Ready to learn English today?',
                style: TextStyle(fontSize: 14, color: Colors.white70),
              ),
              const SizedBox(height: 20),

              // Check-in Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: widget.petData.hasCheckedInToday
                        ? [Colors.green.shade300, Colors.teal.shade400]
                        : [Colors.amber.shade300, Colors.orange.shade400],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8)],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(
                          widget.petData.hasCheckedInToday ? Icons.check_circle : Icons.calendar_today,
                          size: 32,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.petData.hasCheckedInToday ? '今日已签到' : '每日签到',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              Text(
                                widget.petData.hasCheckedInToday
                                    ? '连续 ${widget.petData.checkInStreak} 天 🔥'
                                    : '点击签到获得金币',
                                style: const TextStyle(fontSize: 13, color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                        if (!widget.petData.hasCheckedInToday)
                          ElevatedButton(
                            onPressed: _doCheckIn,
                            child: const Text('签到'),
                          ),
                      ],
                    ),
                    if (widget.petData.checkInStreak > 0) ...[
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _checkInStat('连续', '${widget.petData.checkInStreak}天', Icons.local_fire_department),
                          _checkInStat('总计', '${widget.petData.totalCheckIns}天', Icons.calendar_month),
                          _checkInStat('金币', '${widget.petData.coins}', Icons.monetization_on),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Daily Tasks Card
              _buildDailyTasksCard(),
              const SizedBox(height: 20),

              // Quick Actions
              const Text(
                '快速操作',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _quickActionCard(
                      Icons.pets,
                      '宠物',
                      'Bella Lv.${widget.petData.level}',
                      Colors.cyan,
                      () => widget.onNavigate(2),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _quickActionCard(
                      Icons.menu_book,
                      '学习',
                      '${widget.petData.wordsLearned} 词',
                      Colors.green,
                      () => widget.onNavigate(1),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _quickActionCard(
                      Icons.quiz,
                      '测验',
                      '${widget.petData.quizzesPassed} 次',
                      Colors.purple,
                      () => widget.onNavigate(1),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _quickActionCard(
                      Icons.emoji_events,
                      '成就',
                      '${widget.petData.unlockedBadges.length} 徽章',
                      Colors.amber,
                      () => widget.onNavigate(3),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Pet Status
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '🐾 宠物状态',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    _statusRow('心情', widget.petData.mood > 80 ? '😊 开心' : widget.petData.mood > 60 ? '😐 一般' : '😢 低落'),
                    _statusRow('饱腹', widget.petData.hunger > 80 ? '🍕 饱饱' : widget.petData.hunger > 60 ? '🍔 还行' : '😋 饿了'),
                    _statusRow('经验', '${widget.petData.exp}/100'),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Recent Activity
              if (widget.petData.activityLog.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '📝 最近活动',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 12),
                      ...widget.petData.activityLog.take(5).map((log) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.access_time, size: 16, color: Colors.white70),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  log,
                                  style: const TextStyle(fontSize: 13, color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _checkInStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _quickActionCard(IconData icon, String title, String subtitle, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.3),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white30, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 32, color: Colors.white),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, color: Colors.white70)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildDailyTasksCard() {
    widget.petData.ensureDailyTasks();
    final completed = widget.petData.dailyTasksCompleted;
    final total = widget.petData.dailyTasksTotal;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.teal.shade300, Colors.cyan.shade400],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.task_alt, size: 32, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '每日任务',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    Text(
                      '完成 $completed/$total 个任务',
                      style: const TextStyle(fontSize: 13, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${(completed / total * 100).round()}%',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: completed / total,
              backgroundColor: Colors.white.withOpacity(0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 16),
          ...widget.petData.dailyTasks.map((task) {
            final done = task['done'] as bool;
            final progress = task['progress'] as int;
            final target = task['target'] as int;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: done ? Colors.white.withOpacity(0.3) : Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Text(task['icon'] as String, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          task['title'] as String,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: done ? Colors.white70 : Colors.white,
                            decoration: done ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        Text(
                          '$progress/$target',
                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  if (done)
                    const Icon(Icons.check_circle, color: Colors.white, size: 24)
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '+${task['reward']} 💰',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ==================== Dress Up Shop ====================

class _DressUpShopSheet extends StatefulWidget {
  final PetData petData;
  final List<Map<String, dynamic>> accessories;
  final VoidCallback onUpdated;

  const _DressUpShopSheet({
    required this.petData,
    required this.accessories,
    required this.onUpdated,
  });

  @override
  State<_DressUpShopSheet> createState() => _DressUpShopSheetState();
}

class _DressUpShopSheetState extends State<_DressUpShopSheet> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🎨 宠物装扮',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.monetization_on, size: 18, color: Colors.amber),
                    const SizedBox(width: 4),
                    Text(
                      '${widget.petData.coins}',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            '购买并穿戴装扮，让宠物更可爱！',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 16),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: widget.accessories.length,
              itemBuilder: (context, index) {
                final acc = widget.accessories[index];
                final owned = widget.petData.ownedAccessories.contains(acc['id']);
                final equipped = widget.petData.accessory == acc['id'];
                final canAfford = widget.petData.coins >= (acc['price'] as int);

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  color: equipped ? Colors.pink.shade50 : Colors.white,
                  child: ListTile(
                    leading: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: owned ? Colors.green.shade100 : Colors.grey.shade200,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(acc['icon'] as String, style: const TextStyle(fontSize: 28)),
                      ),
                    ),
                    title: Text(
                      acc['name'] as String,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: equipped ? Colors.pink : Colors.grey.shade800,
                      ),
                    ),
                    subtitle: Text(
                      owned
                          ? (equipped ? '已装备' : '已拥有')
                          : '💰 ${acc['price']} 金币',
                      style: TextStyle(
                        color: owned
                            ? (equipped ? Colors.pink : Colors.green)
                            : (canAfford ? Colors.amber : Colors.red),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    trailing: equipped
                        ? const Icon(Icons.check_circle, color: Colors.pink, size: 28)
                        : owned
                            ? ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    widget.petData.accessory = acc['id'] as String;
                                    widget.onUpdated();
                                  });
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('装备'),
                              )
                            : ElevatedButton(
                                onPressed: canAfford
                                    ? () {
                                        setState(() {
                                          widget.petData.spendCoins(acc['price'] as int);
                                          widget.petData.ownedAccessories = [
                                            ...widget.petData.ownedAccessories,
                                            acc['id'] as String,
                                          ];
                                          widget.petData.accessory = acc['id'] as String;
                                          widget.petData.addLog('购买装扮「${acc['name']}」');
                                          widget.onUpdated();
                                        });
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('购买成功！已装备「${acc['name']}」'),
                                            backgroundColor: Colors.green,
                                            duration: const Duration(seconds: 2),
                                          ),
                                        );
                                      }
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.amber,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('购买'),
                              ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('关闭'),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Loading Overlay ====================

class _LoadingOverlay extends StatelessWidget {
  const _LoadingOverlay();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white.withOpacity(0.4),
      child: const Center(
        child: SizedBox(
          width: 28,
          height: 28,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      ),
    );
  }
}
