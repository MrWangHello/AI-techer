import 'dart:html' as html;
import 'dart:js' as js;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

/// 全局 Live2D view DOM 元素引用
html.Element? _live2dElement;

/// 监听 Live2D 事件的回调
void Function(String type, dynamic data)? _onLive2dEvent;

/// 注册 HtmlElementView platform view
void registerModelViewer() {
  if (!kIsWeb) return;
  
  ui.platformViewRegistry.registerViewFactory('model-viewer-3d', (int viewId) {
    final container = html.DivElement()
      ..className = 'live2d-viewer'
      ..setAttribute('data-model', 'tororo')
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.overflow = 'hidden'
      ..style.borderRadius = '24px'
      ..style.position = 'relative';

    // 监听模型加载完成事件
    container.addEventListener('live2d-loaded', (html.Event e) {
      container.setAttribute('data-flutter-loaded', 'true');
      _onLive2dEvent?.call('load', null);
    });

    // 监听错误事件
    container.addEventListener('live2d-error', (html.Event e) {
      _onLive2dEvent?.call('error', 'Live2D model load failed');
    });

    // 监听点击事件
    container.addEventListener('live2d-tap', (html.Event e) {
      _onLive2dEvent?.call('tap', null);
    });

    _live2dElement = container;
    return container;
  });
}

/// 检查模型是否已经加载过
bool _isModelAlreadyLoaded() {
  if (!kIsWeb) return false;
  try {
    if (js.context.hasProperty('_live2dLoaded') && js.context['_live2dLoaded'] == true) {
      return true;
    }
    if (_live2dElement != null &&
        _live2dElement!.getAttribute('data-loaded') == 'true') {
      return true;
    }
    if (_live2dElement != null &&
        _live2dElement!.getAttribute('data-flutter-loaded') == 'true') {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

/// Live2D 模型查看器 Widget
class ModelViewerWidget extends StatefulWidget {
  final String src; // 保留兼容，但不再使用
  final String? animationName; // 保留兼容，但不再使用
  final String modelKey; // 'tororo' 或 'koharu'
  final bool autoRotate;
  final bool cameraControls;
  final double shadowIntensity;
  final String backgroundColor;
  final VoidCallback? onModelReady;
  final VoidCallback? onTap;

  const ModelViewerWidget({
    super.key,
    this.src = '',
    this.animationName,
    this.modelKey = 'tororo',
    this.autoRotate = true,
    this.cameraControls = true,
    this.shadowIntensity = 0.5,
    this.backgroundColor = 'transparent',
    this.onModelReady,
    this.onTap,
  });

  /// 静态方法：切换模型（不依赖 Widget 实例，通过全局 DOM 引用）
  static void setModel(String modelKey) {
    if (!kIsWeb) return;
    if (_live2dElement != null) {
      _live2dElement!.setAttribute('data-model', modelKey);
    }
  }

  /// 静态方法：切换麦克风
  static void toggleMic() {
    if (!kIsWeb) return;
    if (_live2dElement != null) {
      final containerId = _live2dElement!.getAttribute('data-id') ?? '';
      js.context.callMethod('toggleLive2dMic', [containerId]);
    }
  }

  @override
  State<ModelViewerWidget> createState() => _ModelViewerWidgetState();
}

class _ModelViewerWidgetState extends State<ModelViewerWidget> {
  bool _modelLoaded = false;
  bool _modelError = false;

  @override
  void initState() {
    super.initState();

    _modelLoaded = _isModelAlreadyLoaded();

    _onLive2dEvent = (type, data) {
      if (!mounted) return;
      if (type == 'load') {
        setState(() { _modelLoaded = true; _modelError = false; });
        widget.onModelReady?.call();
      } else if (type == 'error') {
        setState(() => _modelError = true);
        debugPrint('Live2D model error: $data');
      } else if (type == 'tap') {
        widget.onTap?.call();
      }
    };

    if (_live2dElement != null) {
      _live2dElement!.setAttribute('data-model', widget.modelKey);
    }

    // 延迟再检查一次
    Future.delayed(const Duration(seconds: 3), () {
      if (!mounted) return;
      if (!_modelLoaded && _isModelAlreadyLoaded()) {
        setState(() { _modelLoaded = true; _modelError = false; });
        widget.onModelReady?.call();
      }
    });
  }

  @override
  void didUpdateWidget(ModelViewerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.modelKey != oldWidget.modelKey && _live2dElement != null) {
      _live2dElement!.setAttribute('data-model', widget.modelKey);
    }
  }

  @override
  void dispose() {
    _onLive2dEvent = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!kIsWeb) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(24),
        ),
        child: const Center(
          child: Text('Live2D 模型仅在 Web 平台可用'),
        ),
      );
    }

    return Stack(
      children: [
        // HtmlElementView 嵌入 Live2D 模型
        ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: HtmlElementView(viewType: 'model-viewer-3d'),
        ),
        // 加载中提示
        if (!_modelLoaded && !_modelError)
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.4),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Center(
              child: SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              ),
            ),
          ),
        // 错误提示
        if (_modelError)
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, color: Colors.orange, size: 40),
                  const SizedBox(height: 8),
                  const Text('加载失败', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 4),
                  TextButton(
                    onPressed: () {
                      setState(() => _modelError = false);
                      if (_live2dElement != null) {
                        _live2dElement!.removeAttribute('data-error');
                        _live2dElement!.setAttribute('data-model', widget.modelKey);
                      }
                    },
                    child: const Text('重试'),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}