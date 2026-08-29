import 'dart:html' as html;
import 'dart:js' as js;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

/// 全局 model-viewer DOM 元素引用
html.Element? _modelViewerElement;

/// 监听 model-viewer 事件的回调
void Function(String type, dynamic data)? _onModelViewerEvent;

/// 注册 HtmlElementView platform view
void registerModelViewer() {
  if (!kIsWeb) return;
  
  ui.platformViewRegistry.registerViewFactory('model-viewer-3d', (int viewId) {
    final container = html.DivElement()
      ..className = 'three-viewer'
      ..setAttribute('data-src', 'assets/models/RobotExpressive.glb')
      ..setAttribute('data-anim', 'Idle')
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.overflow = 'hidden'
      ..style.borderRadius = '24px';

    // 监听模型加载完成事件（DOM 自定义事件）
    container.addEventListener('three-loaded', (html.Event e) {
      // 标记容器已加载
      container.setAttribute('data-flutter-loaded', 'true');
      _onModelViewerEvent?.call('load', null);
    });

    // 监听点击事件
    container.addEventListener('click', (e) {
      _onModelViewerEvent?.call('tap', null);
    });

    _modelViewerElement = container;
    return container;
  });
}

/// 检查模型是否已经加载过（全局状态，不随 Widget 重建而重置）
bool _isModelAlreadyLoaded() {
  if (!kIsWeb) return false;
  try {
    // 检查 JS 全局标记
    if (js.context.hasProperty('_threeLoaded') && js.context['_threeLoaded'] == true) {
      return true;
    }
    // 检查容器 DOM 属性
    if (_modelViewerElement != null &&
        _modelViewerElement!.getAttribute('data-loaded') == 'true') {
      return true;
    }
    if (_modelViewerElement != null &&
        _modelViewerElement!.getAttribute('data-flutter-loaded') == 'true') {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

/// 3D GLB 模型查看器 Widget
class ModelViewerWidget extends StatefulWidget {
  final String src;
  final String? animationName;
  final bool autoRotate;
  final bool cameraControls;
  final double shadowIntensity;
  final String backgroundColor;
  final VoidCallback? onModelReady;
  final VoidCallback? onTap;

  const ModelViewerWidget({
    super.key,
    required this.src,
    this.animationName,
    this.autoRotate = true,
    this.cameraControls = true,
    this.shadowIntensity = 0.5,
    this.backgroundColor = 'transparent',
    this.onModelReady,
    this.onTap,
  });

  /// 静态方法：设置动画（不依赖 Widget 实例，通过全局 DOM 引用）
  static void setAnimation(String name) {
    if (!kIsWeb) return;
    if (_modelViewerElement != null) {
      _modelViewerElement!.setAttribute('data-anim', name);
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

    // 检查全局状态：如果模型之前已经加载过，直接跳过加载提示
    _modelLoaded = _isModelAlreadyLoaded();

    _onModelViewerEvent = (type, data) {
      if (!mounted) return;
      if (type == 'load') {
        setState(() { _modelLoaded = true; _modelError = false; });
        widget.onModelReady?.call();
      } else if (type == 'error') {
        setState(() => _modelError = true);
        debugPrint('Model viewer error: $data');
      } else if (type == 'tap') {
        widget.onTap?.call();
      }
    };

    if (_modelViewerElement != null && widget.animationName != null) {
      _modelViewerElement!.setAttribute('data-anim', widget.animationName!);
    }

    // 延迟再检查一次：如果模型已加载但事件丢失，手动标记
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
    if (widget.animationName != oldWidget.animationName && _modelViewerElement != null) {
      _modelViewerElement!.setAttribute('data-anim', widget.animationName ?? 'Idle');
    }
  }

  @override
  void dispose() {
    _onModelViewerEvent = null;
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
          child: Text('3D 模型仅在 Web 平台可用'),
        ),
      );
    }

    return Stack(
      children: [
        // HtmlElementView 嵌入 3D 模型
        ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: HtmlElementView(viewType: 'model-viewer-3d'),
        ),
        // 加载中提示（仅在首次加载时显示，半透明背景，只显示小转圈）
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
      ],
    );
  }
}