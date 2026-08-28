import 'package:flutter/material.dart';
import '../safe_executor.dart';
import '../../voice/stt/stt_service.dart';
import '../../voice/tts/tts_service.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final SttService _sttService = SttService();
  final TtsService _ttsService = TtsService();
  final List<ChatMessage> _messages = [];
  final TextEditingController _textController = TextEditingController();
  bool _isListening = false;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _sttService.initialize();
    _ttsService.initialize();
    _addWelcomeMessage();
  }

  void _addWelcomeMessage() {
    setState(() {
      _messages.add(ChatMessage(
        text: 'Hello! I\'m your English teacher. Let\'s learn together! You can speak to me or type your message.',
        isUser: false,
      ));
    });
    _ttsService.speak('Hello! Let\'s learn English together!');
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    // Add user message
    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true));
      _isProcessing = true;
    });

    // Clear input
    _textController.clear();

    try {
      // Get AI response
      final response = await SafeAgentExecutor.invoke(text);

      // Add AI response
      setState(() {
        _messages.add(ChatMessage(text: response, isUser: false));
        _isProcessing = false;
      });

      // Speak the response
      _ttsService.speak(response);
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          text: 'Sorry, I had a problem. Let\'s try again!',
          isUser: false,
        ));
        _isProcessing = false;
      });
    }
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
          _sendMessage(text);
        },
        onPartialResult: (text) {
          _textController.text = text;
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI English Teacher'),
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageBubble(message);
              },
            ),
          ),

          // Processing indicator
          if (_isProcessing)
            Container(
              padding: const EdgeInsets.all(8),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text('Thinking...'),
                ],
              ),
            ),

          // Input area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Voice button
                IconButton(
                  icon: Icon(
                    _isListening ? Icons.mic : Icons.mic_none,
                    color: _isListening ? Colors.red : null,
                  ),
                  onPressed: _toggleListening,
                ),
                
                // Text input
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Type or speak...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(24)),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                
                const SizedBox(width: 8),
                
                // Send button
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: () => _sendMessage(_textController.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: message.isUser
              ? Theme.of(context).colorScheme.primary
              : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: message.isUser ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    _sttService.stop();
    _ttsService.stop();
    super.dispose();
  }
}

class ChatMessage {
  final String text;
  final bool isUser;

  ChatMessage({required this.text, required this.isUser});
}
