import 'package:flutter/material.dart';
import 'package:o3d/o3d.dart';

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
  int _currentIndex = 2; // Start on pet page

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

class _PetPageState extends State<PetPage> {
  final O3DController _o3dController = O3DController();
  String _currentAnimation = 'Idle';
  bool _modelLoaded = false;
  List<String> _availableAnimations = [];

  @override
  void initState() {
    super.initState();
    // Get available animations after model loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _o3dController.availableAnimations().then((animations) {
        debugPrint('Available animations: $animations');
        setState(() {
          _availableAnimations = animations;
        });
      });
    });
  }

  void _playAnim(String name) {
    _o3dController.play(animationName: name);
    setState(() => _currentAnimation = name);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的伙伴'),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.mic), onPressed: () {}),
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
                  // Status indicator
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
                      child: const Text('😊', style: TextStyle(fontSize: 20)),
                    ),
                  ),
                  // 3D Model
                  Center(
                    child: O3D.asset(
                      src: 'assets/models/RobotExpressive.glb',
                      controller: _o3dController,
                      cameraControls: true,
                      autoRotate: false,
                      autoPlay: true,
                      interactionPrompt: InteractionPrompt.none,
                      backgroundColor: Colors.transparent,
                      onLoad: () {
                        debugPrint('Model loaded!');
                        setState(() => _modelLoaded = true);
                      },
                      onError: (error) {
                        debugPrint('Model load error: $error');
                      },
                    ),
                  ),
                  // Loading overlay
                  if (!_modelLoaded)
                    Container(
                      color: Colors.white54,
                      child: const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(color: Colors.pink),
                            SizedBox(height: 12),
                            Text('Loading 3D...', style: TextStyle(color: Colors.pink)),
                          ],
                        ),
                      ),
                    ),
                  // Name & Level
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
                          ),
                        ),
                        Text(
                          'Lv. 3',
                          style: TextStyle(
                            fontSize: 16,
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
            _buildStatCard('经验值', 60, 100, Colors.blue),
            const SizedBox(height: 12),
            _buildStatCard('饱腹度', 80, 100, Colors.orange),
            const SizedBox(height: 12),
            _buildStatCard('心情', 90, 100, Colors.pink),
            const SizedBox(height: 20),

            // Animation Control Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: [
                  _animBtn('Idle', Icons.person, () => _playAnim('Idle')),
                  _animBtn('Wave', Icons.waving_hand, () => _playAnim('Wave')),
                  _animBtn('Dance', Icons.music_note, () => _playAnim('Dance')),
                  _animBtn('Jump', Icons.arrow_upward, () => _playAnim('Jump')),
                  _animBtn('Yes', Icons.check, () => _playAnim('Yes')),
                  _animBtn('No', Icons.close, () => _playAnim('No')),
                  _animBtn('ThumbsUp', Icons.thumb_up, () => _playAnim('ThumbsUp')),
                  _animBtn('Punch', Icons.fitness_center, () => _playAnim('Punch')),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _actionBtn(Icons.restaurant, '喂食', Colors.orange, () {
                      _playAnim('ThumbsUp');
                      _showSnackBar('Yummy! Thank you!');
                    }),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _actionBtn(Icons.sports_esports, '玩耍', Colors.blue, () {
                      _playAnim('Dance');
                      _showSnackBar('So much fun!');
                    }),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _actionBtn(Icons.school, '学习', Colors.green, () {
                      _playAnim('Yes');
                      _showSnackBar("Let's learn English!");
                    }),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, int value, int max, Color color) {
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
              Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Text('$value / $max', style: TextStyle(color: Colors.grey.shade600)),
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

  Widget _animBtn(String label, IconData icon, VoidCallback onTap) {
    final isActive = _currentAnimation == label;
    return Material(
      color: isActive ? Colors.pink.shade100 : Colors.white,
      borderRadius: BorderRadius.circular(12),
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

  Widget _actionBtn(IconData icon, String label, Color color, VoidCallback onTap) {
    return Material(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }

  void _showSnackBar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

// ==================== Other Pages (Placeholders) ====================

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
