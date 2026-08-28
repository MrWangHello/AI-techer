/// Rule Engine - Ultimate fallback when AI is unavailable
/// Uses keyword matching and fixed templates
class RuleEngine {
  static String getResponse(String input) {
    final lowerInput = input.toLowerCase().trim();

    // Greetings
    if (_containsAny(lowerInput, ['hello', 'hi', 'hey', '你好'])) {
      return 'Hello! How are you today? Say "I am fine" to practice!';
    }

    if (_containsAny(lowerInput, ['goodbye', 'bye', '再见'])) {
      return 'Goodbye! See you next time! Great job today!';
    }

    // Colors
    if (_containsAny(lowerInput, ['red', 'blue', 'green', 'yellow', '颜色'])) {
      return 'Nice! Can you say the color in English? Let me help you!';
    }

    // Numbers
    if (_containsAny(lowerInput, ['one', 'two', 'three', '数字', '数'])) {
      return 'Great! Let\'s count together! One, two, three...';
    }

    // Animals
    if (_containsAny(lowerInput, ['cat', 'dog', 'bird', '动物'])) {
      return 'Wonderful! What animal do you like? Can you say it in English?';
    }

    // Fruits
    if (_containsAny(lowerInput, ['apple', 'banana', 'orange', '水果'])) {
      return 'Yummy! Do you like fruits? Let\'s learn fruit names!';
    }

    // Encouragement for any other input
    return 'Good try! Let\'s keep learning English together! You can do it!';
  }

  static bool _containsAny(String text, List<String> keywords) {
    return keywords.any((keyword) => text.contains(keyword));
  }
}
