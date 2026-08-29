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
      );
    } catch (_) {
      return PetData();
    }
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
}
