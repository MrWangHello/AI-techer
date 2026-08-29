import 'dart:convert';
import 'dart:html' as html;

/// 宠物数据持久化（localStorage）
class PetData {
  static const String _key = 'bella_pet_data';

  int exp;
  int hunger;
  int mood;
  int level;
  int totalInteractions;
  int totalFeedings;
  int totalPlays;
  int totalStudies;
  int wordsLearned;
  int quizzesPassed;
  String lastActiveDate;
  List<String> unlockedBadges;
  List<String> learnedWords;
  int checkInStreak;
  int totalCheckIns;
  String lastCheckInDate;
  int coins;
  String petName;
  String accessory;
  List<String> activityLog;
  int highScoreQuiz;
  int spellingPassed;

  // === 装扮系统 ===
  List<String> ownedAccessories; // 已购买的装扮ID列表

  // === 每日任务系统 ===
  String dailyTaskDate; // 每日任务生成日期
  List<Map<String, dynamic>> dailyTasks; // 每日任务列表

  // === 单词复习系统 (艾宾浩斯) ===
  Map<String, String> wordReviewSchedule; // word -> nextReviewDate

  // === 心情系统增强 ===
  String lastInteractionTime; // 上次互动时间 (ISO8601)

  PetData({
    this.exp = 60,
    this.hunger = 80,
    this.mood = 90,
    this.level = 3,
    this.totalInteractions = 0,
    this.totalFeedings = 0,
    this.totalPlays = 0,
    this.totalStudies = 0,
    this.wordsLearned = 0,
    this.quizzesPassed = 0,
    this.lastActiveDate = '',
    this.unlockedBadges = const [],
    this.learnedWords = const [],
    this.checkInStreak = 0,
    this.totalCheckIns = 0,
    this.lastCheckInDate = '',
    this.coins = 0,
    this.petName = 'Bella',
    this.accessory = 'none',
    this.activityLog = const [],
    this.highScoreQuiz = 0,
    this.spellingPassed = 0,
    this.ownedAccessories = const [],
    this.dailyTaskDate = '',
    this.dailyTasks = const [],
    this.wordReviewSchedule = const {},
    this.lastInteractionTime = '',
  });

  factory PetData.load() {
    try {
      final json = html.window.localStorage[_key];
      if (json == null) return PetData();
      final map = jsonDecode(json) as Map;
      return PetData(
        exp: map['exp'] ?? 60,
        hunger: map['hunger'] ?? 80,
        mood: map['mood'] ?? 90,
        level: map['level'] ?? 3,
        totalInteractions: map['totalInteractions'] ?? 0,
        totalFeedings: map['totalFeedings'] ?? 0,
        totalPlays: map['totalPlays'] ?? 0,
        totalStudies: map['totalStudies'] ?? 0,
        wordsLearned: map['wordsLearned'] ?? 0,
        quizzesPassed: map['quizzesPassed'] ?? 0,
        lastActiveDate: map['lastActiveDate'] ?? '',
        unlockedBadges: List<String>.from(map['unlockedBadges'] ?? []),
        learnedWords: List<String>.from(map['learnedWords'] ?? []),
        checkInStreak: map['checkInStreak'] ?? 0,
        totalCheckIns: map['totalCheckIns'] ?? 0,
        lastCheckInDate: map['lastCheckInDate'] ?? '',
        coins: map['coins'] ?? 0,
        petName: map['petName'] ?? 'Bella',
        accessory: map['accessory'] ?? 'none',
        activityLog: List<String>.from(map['activityLog'] ?? []),
        highScoreQuiz: map['highScoreQuiz'] ?? 0,
        spellingPassed: map['spellingPassed'] ?? 0,
        ownedAccessories: List<String>.from(map['ownedAccessories'] ?? []),
        dailyTaskDate: map['dailyTaskDate'] ?? '',
        dailyTasks: _parseDailyTasks(map['dailyTasks']),
        wordReviewSchedule: Map<String, String>.from(map['wordReviewSchedule'] ?? {}),
        lastInteractionTime: map['lastInteractionTime'] ?? '',
      );
    } catch (_) {
      return PetData();
    }
  }

  static List<Map<String, dynamic>> _parseDailyTasks(dynamic data) {
    if (data == null) return [];
    final list = List.from(data);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  void save() {
    lastActiveDate = DateTime.now().toIso8601String().split('T')[0];
    html.window.localStorage[_key] = jsonEncode({
      'exp': exp,
      'hunger': hunger,
      'mood': mood,
      'level': level,
      'totalInteractions': totalInteractions,
      'totalFeedings': totalFeedings,
      'totalPlays': totalPlays,
      'totalStudies': totalStudies,
      'wordsLearned': wordsLearned,
      'quizzesPassed': quizzesPassed,
      'lastActiveDate': lastActiveDate,
      'unlockedBadges': unlockedBadges,
      'learnedWords': learnedWords,
      'checkInStreak': checkInStreak,
      'totalCheckIns': totalCheckIns,
      'lastCheckInDate': lastCheckInDate,
      'coins': coins,
      'petName': petName,
      'accessory': accessory,
      'activityLog': activityLog.take(20).toList(),
      'highScoreQuiz': highScoreQuiz,
      'spellingPassed': spellingPassed,
      'ownedAccessories': ownedAccessories,
      'dailyTaskDate': dailyTaskDate,
      'dailyTasks': dailyTasks,
      'wordReviewSchedule': wordReviewSchedule,
      'lastInteractionTime': lastInteractionTime,
    });
  }

  void addExp(int delta) {
    exp = (exp + delta).clamp(0, 100);
  }

  void addHunger(int delta) {
    hunger = (hunger + delta).clamp(0, 100);
  }

  void addMood(int delta) {
    mood = (mood + delta).clamp(0, 100);
  }

  bool checkLevelUp() {
    if (exp >= 100) {
      exp = 0;
      level++;
      return true;
    }
    return false;
  }

  void unlockBadge(String badge) {
    if (!unlockedBadges.contains(badge)) {
      unlockedBadges = [...unlockedBadges, badge];
    }
  }

  void learnWord(String word) {
    if (!learnedWords.contains(word)) {
      learnedWords = [...learnedWords, word];
      wordsLearned = learnedWords.length;
    }
    // 安排复习：1天后
    _scheduleReview(word, 1);
  }

  void _scheduleReview(String word, int daysAfter) {
    final reviewDate = DateTime.now().add(Duration(days: daysAfter)).toIso8601String().split('T')[0];
    wordReviewSchedule = {...wordReviewSchedule, word: reviewDate};
  }

  /// 复习完成后，按艾宾浩斯曲线推迟下次复习
  void markWordReviewed(String word) {
    final now = DateTime.now();
    final currentReview = wordReviewSchedule[word];
    int nextDays;
    if (currentReview == null) {
      nextDays = 1;
    } else {
      final reviewDate = DateTime.parse(currentReview);
      final diff = now.difference(reviewDate).inDays;
      // 艾宾浩斯间隔: 1, 2, 4, 7, 15 天
      if (diff <= 1) nextDays = 2;
      else if (diff <= 2) nextDays = 4;
      else if (diff <= 4) nextDays = 7;
      else if (diff <= 7) nextDays = 15;
      else nextDays = 15;
    }
    final nextDate = now.add(Duration(days: nextDays)).toIso8601String().split('T')[0];
    wordReviewSchedule = {...wordReviewSchedule, word: nextDate};
  }

  /// 获取今天需要复习的单词
  List<String> getWordsDueForReview() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return wordReviewSchedule.entries
        .where((e) => e.value.compareTo(today) <= 0 && learnedWords.contains(e.key))
        .map((e) => e.key)
        .toList();
  }

  void recordInteraction() {
    lastInteractionTime = DateTime.now().toIso8601String();
  }

  /// 获取宠物当前心情状态
  String get petMoodState {
    final now = DateTime.now();
    DateTime? lastTime;
    if (lastInteractionTime.isNotEmpty) {
      lastTime = DateTime.tryParse(lastInteractionTime);
    }
    final hoursSinceInteraction = lastTime != null ? now.difference(lastTime).inHours : 999;

    if (hunger < 20) return 'hungry';
    if (hoursSinceInteraction > 24) return 'angry';
    if (hoursSinceInteraction > 8) return 'sad';
    if (mood < 30) return 'bored';
    if (mood >= 80 && hunger >= 60) return 'happy';
    return 'normal';
  }

  String get petMoodEmoji {
    switch (petMoodState) {
      case 'happy': return '😊';
      case 'hungry': return '😫';
      case 'bored': return '😑';
      case 'sad': return '😢';
      case 'angry': return '😠';
      default: return '😐';
    }
  }

  String get petMoodLabel {
    switch (petMoodState) {
      case 'happy': return '开心';
      case 'hungry': return '饥饿';
      case 'bored': return '无聊';
      case 'sad': return '难过';
      case 'angry': return '生气';
      default: return '一般';
    }
  }

  bool doCheckIn() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    if (lastCheckInDate == today) return false;
    final yesterday = DateTime.now().subtract(const Duration(days: 1)).toIso8601String().split('T')[0];
    if (lastCheckInDate == yesterday) {
      checkInStreak++;
    } else {
      checkInStreak = 1;
    }
    totalCheckIns++;
    lastCheckInDate = today;
    coins += 10 + (checkInStreak > 7 ? 20 : checkInStreak > 3 ? 10 : 0);
    addExp(10);
    addMood(10);
    addLog('签到获得 ${10 + (checkInStreak > 7 ? 20 : checkInStreak > 3 ? 10 : 0)} 金币');
    return true;
  }

  bool get hasCheckedInToday {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return lastCheckInDate == today;
  }

  void addLog(String action) {
    final now = DateTime.now();
    final time = '${now.month}/${now.day} ${now.hour}:${now.minute.toString().padLeft(2, '0')}';
    activityLog = ['$time $action', ...activityLog.take(19)];
  }

  void spendCoins(int amount) {
    coins = (coins - amount).clamp(0, 999999);
  }

  // === 每日任务 ===
  void ensureDailyTasks() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    if (dailyTaskDate == today && dailyTasks.isNotEmpty) return;
    // 生成新任务
    dailyTaskDate = today;
    dailyTasks = [
      {
        'id': 'feed',
        'title': '喂食 2 次',
        'desc': '给宠物喂食 2 次',
        'icon': '🍕',
        'target': 2,
        'progress': 0,
        'reward': 20,
        'done': false,
      },
      {
        'id': 'learn',
        'title': '学习 5 个单词',
        'desc': '在学习页面点击 5 个单词',
        'icon': '📚',
        'target': 5,
        'progress': 0,
        'reward': 30,
        'done': false,
      },
      {
        'id': 'quiz',
        'title': '完成 1 次测验',
        'desc': '完成一轮单词测验',
        'icon': '🎯',
        'target': 1,
        'progress': 0,
        'reward': 25,
        'done': false,
      },
    ];
    addLog('每日任务已刷新');
  }

  void advanceDailyTask(String taskId, {int amount = 1}) {
    final today = DateTime.now().toIso8601String().split('T')[0];
    if (dailyTaskDate != today) ensureDailyTasks();
    dailyTasks = dailyTasks.map((t) {
      if (t['id'] == taskId && !(t['done'] as bool)) {
        final newProgress = ((t['progress'] as int) + amount).clamp(0, t['target'] as int);
        final done = newProgress >= (t['target'] as int);
        if (done && !(t['done'] as bool)) {
          coins += t['reward'] as int;
          addLog('完成任务「${t['title']}」获得 ${t['reward']} 金币');
        }
        return {...t, 'progress': newProgress, 'done': done};
      }
      return t;
    }).toList();
  }

  int get dailyTasksCompleted => dailyTasks.where((t) => t['done'] as bool).length;
  int get dailyTasksTotal => dailyTasks.length;
}
