import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api_key_manager.dart';
import '../app_config.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  String _aiMode = 'auto';
  String _sttProvider = 'system';
  String _ttsProvider = 'system';
  int _dailyGoal = 30;
  String _difficulty = 'normal';
  bool _dailyReminder = true;
  String _reminderTime = '19:00';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() {
    setState(() {
      _aiMode = AppConfig.aiMode;
      _sttProvider = AppConfig.sttProvider;
      _ttsProvider = AppConfig.ttsProvider;
      _dailyGoal = AppConfig.dailyGoalMinutes;
      _difficulty = AppConfig.difficulty;
      _dailyReminder = AppConfig.dailyReminder;
      _reminderTime = AppConfig.reminderTime;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('设置'),
      ),
      body: ListView(
        children: [
          _buildSection(
            title: 'AI 模型',
            children: [
              _buildRadioTile(
                title: '自动模式（推荐）',
                subtitle: '有网用云端，无网用本地',
                value: 'auto',
                groupValue: _aiMode,
                onChanged: (value) => _setAiMode(value!),
              ),
              _buildRadioTile(
                title: '云端 API',
                subtitle: '使用 DeepSeek/通义千问',
                value: 'cloud',
                groupValue: _aiMode,
                onChanged: (value) => _setAiMode(value!),
              ),
              _buildRadioTile(
                title: '本地模型',
                subtitle: '离线运行，无需网络',
                value: 'local',
                groupValue: _aiMode,
                onChanged: (value) => _setAiMode(value!),
              ),
              ListTile(
                title: const Text('配置 API Key'),
                subtitle: const Text('设置 DeepSeek/通义千问 API Key'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () => _showApiKeyDialog(context),
              ),
            ],
          ),
          _buildSection(
            title: '语音设置',
            children: [
              ListTile(
                title: const Text('语音识别 (STT)'),
                trailing: DropdownButton<String>(
                  value: _sttProvider,
                  items: const [
                    DropdownMenuItem(value: 'system', child: Text('系统原生')),
                    DropdownMenuItem(value: 'doubao', child: Text('豆包语音')),
                    DropdownMenuItem(value: 'baidu', child: Text('百度语音')),
                  ],
                  onChanged: (value) => _setSttProvider(value!),
                ),
              ),
              ListTile(
                title: const Text('语音合成 (TTS)'),
                trailing: DropdownButton<String>(
                  value: _ttsProvider,
                  items: const [
                    DropdownMenuItem(value: 'system', child: Text('系统原生')),
                    DropdownMenuItem(value: 'doubao', child: Text('豆包语音')),
                    DropdownMenuItem(value: 'baidu', child: Text('百度语音')),
                  ],
                  onChanged: (value) => _setTtsProvider(value!),
                ),
              ),
            ],
          ),
          _buildSection(
            title: '学习设置',
            children: [
              ListTile(
                title: const Text('每日学习目标'),
                subtitle: Text('$_dailyGoal 分钟'),
                trailing: Slider(
                  value: _dailyGoal.toDouble(),
                  min: 15,
                  max: 60,
                  divisions: 3,
                  label: '$_dailyGoal',
                  onChanged: (value) => _setDailyGoal(value.toInt()),
                ),
              ),
              ListTile(
                title: const Text('难度'),
                trailing: DropdownButton<String>(
                  value: _difficulty,
                  items: const [
                    DropdownMenuItem(value: 'easy', child: Text('简单')),
                    DropdownMenuItem(value: 'normal', child: Text('标准')),
                    DropdownMenuItem(value: 'hard', child: Text('挑战')),
                  ],
                  onChanged: (value) => _setDifficulty(value!),
                ),
              ),
              SwitchListTile(
                title: const Text('每日提醒'),
                subtitle: Text(_reminderTime),
                value: _dailyReminder,
                onChanged: (value) => _setDailyReminder(value),
              ),
            ],
          ),
          _buildSection(
            title: '数据管理',
            children: [
              ListTile(
                title: const Text('导出学习报告'),
                leading: const Icon(Icons.download),
                onTap: () {
                  // TODO: Implement export
                },
              ),
              ListTile(
                title: const Text('重置所有数据'),
                leading: const Icon(Icons.delete, color: Colors.red),
                onTap: () => _showResetDialog(context),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildRadioTile({
    required String title,
    required String? subtitle,
    required String value,
    required String groupValue,
    required ValueChanged<String> onChanged,
  }) {
    return RadioListTile<String>(
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      value: value,
      groupValue: groupValue,
      onChanged: onChanged,
    );
  }

  Future<void> _setAiMode(String value) async {
    await AppConfig.setAiMode(value);
    setState(() => _aiMode = value);
  }

  Future<void> _setSttProvider(String value) async {
    await AppConfig.setSttProvider(value);
    setState(() => _sttProvider = value);
  }

  Future<void> _setTtsProvider(String value) async {
    await AppConfig.setTtsProvider(value);
    setState(() => _ttsProvider = value);
  }

  Future<void> _setDailyGoal(int value) async {
    await AppConfig.setDailyGoalMinutes(value);
    setState(() => _dailyGoal = value);
  }

  Future<void> _setDifficulty(String value) async {
    await AppConfig.setDifficulty(value);
    setState(() => _difficulty = value);
  }

  Future<void> _setDailyReminder(bool value) async {
    await AppConfig.setDailyReminder(value);
    setState(() => _dailyReminder = value);
  }

  void _showApiKeyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const ApiKeyDialog(),
    );
  }

  void _showResetDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认重置'),
        content: const Text('这将删除所有学习数据和宠物进度，确定要重置吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              // TODO: Implement reset
              Navigator.pop(context);
            },
            child: const Text('确定', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class ApiKeyDialog extends StatefulWidget {
  const ApiKeyDialog({super.key});

  @override
  State<ApiKeyDialog> createState() => _ApiKeyDialogState();
}

class _ApiKeyDialogState extends State<ApiKeyDialog> {
  final _deepseekController = TextEditingController();
  final _qwenController = TextEditingController();
  final _openaiController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadApiKeys();
  }

  Future<void> _loadApiKeys() async {
    final deepseekKey = await ApiKeyManager.getApiKey('deepseek') ?? '';
    final qwenKey = await ApiKeyManager.getApiKey('qwen') ?? '';
    final openaiKey = await ApiKeyManager.getApiKey('openai') ?? '';

    setState(() {
      _deepseekController.text = deepseekKey;
      _qwenController.text = qwenKey;
      _openaiController.text = openaiKey;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('配置 API Key'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _deepseekController,
              decoration: const InputDecoration(
                labelText: 'DeepSeek API Key',
                hintText: 'sk-...',
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _qwenController,
              decoration: const InputDecoration(
                labelText: '通义千问 API Key',
                hintText: 'sk-...',
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _openaiController,
              decoration: const InputDecoration(
                labelText: 'OpenAI API Key',
                hintText: 'sk-...',
              ),
              obscureText: true,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        TextButton(
          onPressed: () async {
            if (_deepseekController.text.isNotEmpty) {
              await ApiKeyManager.saveApiKey('deepseek', _deepseekController.text);
            }
            if (_qwenController.text.isNotEmpty) {
              await ApiKeyManager.saveApiKey('qwen', _qwenController.text);
            }
            if (_openaiController.text.isNotEmpty) {
              await ApiKeyManager.saveApiKey('openai', _openaiController.text);
            }
            if (mounted) {
              Navigator.pop(context);
            }
          },
          child: const Text('保存'),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _deepseekController.dispose();
    _qwenController.dispose();
    _openaiController.dispose();
    super.dispose();
  }
}
