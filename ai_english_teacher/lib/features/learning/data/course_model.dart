/// Course data models
class Course {
  final String id;
  final String title;
  final int grade;
  final int unit;
  final List<Vocabulary> vocabularies;
  final List<Sentence> sentences;
  final List<Dialogue> dialogues;
  final List<Game> games;

  Course({
    required this.id,
    required this.title,
    required this.grade,
    required this.unit,
    required this.vocabularies,
    required this.sentences,
    required this.dialogues,
    required this.games,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as String,
      title: json['title'] as String,
      grade: json['grade'] as int,
      unit: json['unit'] as int,
      vocabularies: (json['vocabularies'] as List)
          .map((v) => Vocabulary.fromJson(v))
          .toList(),
      sentences: (json['sentences'] as List)
          .map((s) => Sentence.fromJson(s))
          .toList(),
      dialogues: (json['dialogues'] as List)
          .map((d) => Dialogue.fromJson(d))
          .toList(),
      games: (json['games'] as List)
          .map((g) => Game.fromJson(g))
          .toList(),
    );
  }
}

class Vocabulary {
  final String word;
  final String phonetic;
  final String image;
  final String audio;
  final String translation;

  Vocabulary({
    required this.word,
    required this.phonetic,
    required this.image,
    required this.audio,
    required this.translation,
  });

  factory Vocabulary.fromJson(Map<String, dynamic> json) {
    return Vocabulary(
      word: json['word'] as String,
      phonetic: json['phonetic'] as String,
      image: json['image'] as String,
      audio: json['audio'] as String,
      translation: json['translation'] as String,
    );
  }
}

class Sentence {
  final String en;
  final String zh;
  final String audio;

  Sentence({
    required this.en,
    required this.zh,
    required this.audio,
  });

  factory Sentence.fromJson(Map<String, dynamic> json) {
    return Sentence(
      en: json['en'] as String,
      zh: json['zh'] as String,
      audio: json['audio'] as String,
    );
  }
}

class Dialogue {
  final String role;
  final String en;
  final String zh;

  Dialogue({
    required this.role,
    required this.en,
    required this.zh,
  });

  factory Dialogue.fromJson(Map<String, dynamic> json) {
    return Dialogue(
      role: json['role'] as String,
      en: json['en'] as String,
      zh: json['zh'] as String,
    );
  }
}

class Game {
  final String type;
  final String prompt;
  final List<GamePair> pairs;

  Game({
    required this.type,
    required this.prompt,
    required this.pairs,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      type: json['type'] as String,
      prompt: json['prompt'] as String,
      pairs: (json['pairs'] as List)
          .map((p) => GamePair.fromJson(p))
          .toList(),
    );
  }
}

class GamePair {
  final String word;
  final String image;

  GamePair({
    required this.word,
    required this.image,
  });

  factory GamePair.fromJson(Map<String, dynamic> json) {
    return GamePair(
      word: json['word'] as String,
      image: json['image'] as String,
    );
  }
}
