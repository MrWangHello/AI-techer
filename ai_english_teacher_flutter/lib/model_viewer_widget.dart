import 'dart:html' as html;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

/// 全局 model-viewer DOM 元素引用，用于控制动画等
html.Element? _modelViewerElement;

/// 监听 model-viewer 事件的回调
void Function(String type, dynamic data)? _onModelViewerEvent;

/// 注册 HtmlElementView platform view
/// 在 main() 中调用一次
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

    // 监听模型加载完成事件
    html.window.addEventListener('message', (e) {
      final data = e.data;
      if (data is Map && data['type'] == 'three-loaded') {
        _onModelViewerEvent?.call('load', null);
      }
    });

    // 监听点击事件
    container.addEventListener('click', (e) {
      _onModelViewerEvent?.call('tap', null);
    });

    _modelViewerElement = container;
    return container;
  });
}

/// 3D GLB 模型查看器 Widget
/// 使用 HtmlElementView + Three.js 嵌入到 Flutter 布局中
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

  @override
  State<ModelViewerWidget> createState() => _ModelViewerWidgetState();
}

class _ModelViewerWidgetState extends State<ModelViewerWidget> {
  bool _modelLoaded = false;
  bool _modelError = false;

  @override
  void initState() {
    super.initState();

    // 设置事件回调
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

    // 设置初始动画
    if (_modelViewerElement != null && widget.animationName != null) {
      _modelViewerElement!.setAttribute('data-anim', widget.animationName!);
    }
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

  /// 切换动画
  void setAnimation(String name) {
    _modelViewerElement?.setAttribute('data-anim', name);
  }

  /// 暂停动画
  void pauseAnimation() {
    // Three.js 暂停
  }

  /// 恢复动画
  void resumeAnimation() {
    // Three.js 恢复
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
        // 加载中提示
        if (!_modelLoaded && !_modelError)
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('3D 模型加载中...'),
                ],
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
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: Colors.red),
                  SizedBox(height: 16),
                  Text('3D 模型加载失败'),
                ],
              ),
            ),
          ),
      ],
    );
  }
}