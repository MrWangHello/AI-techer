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
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.overflow = 'hidden'
      ..style.borderRadius = '24px';

    final viewer = html.Element.tag('model-viewer')
      ..id = 'pet-model-viewer'
      ..setAttribute('src', 'assets/models/RobotExpressive.glb')
      ..setAttribute('camera-controls', '')
      ..setAttribute('auto-rotate', '')
      ..setAttribute('shadow-intensity', '0.5')
      ..setAttribute('animation-name', 'Idle')
      ..style.width = '100%'
      ..style.height = '100%';

    // 监听 model-viewer 事件
    viewer.addEventListener('load', (e) {
      _onModelViewerEvent?.call('load', null);
    });
    viewer.addEventListener('error', (e) {
      _onModelViewerEvent?.call('error', 'Failed to load model');
    });
    viewer.addEventListener('click', (e) {
      _onModelViewerEvent?.call('tap', null);
    });

    _modelViewerElement = viewer;
    container.append(viewer);
    return container;
  });
}

/// 3D GLB 模型查看器 Widget
/// 使用 HtmlElementView 嵌入到 Flutter 布局中，
/// 不遮挡其他 UI 元素
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

  @override
  void initState() {
    super.initState();

    // 设置事件回调
    _onModelViewerEvent = (type, data) {
      if (!mounted) return;
      if (type == 'load') {
        setState(() => _modelLoaded = true);
        widget.onModelReady?.call();
      } else if (type == 'error') {
        debugPrint('Model viewer error: $data');
      } else if (type == 'tap') {
        widget.onTap?.call();
      }
    };

    // 设置初始动画
    if (_modelViewerElement != null && widget.animationName != null) {
      _modelViewerElement!.setAttribute('animation-name', widget.animationName!);
    }
  }

  @override
  void didUpdateWidget(ModelViewerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animationName != oldWidget.animationName && _modelViewerElement != null) {
      _modelViewerElement!.setAttribute('animation-name', widget.animationName ?? 'Idle');
    }
  }

  @override
  void dispose() {
    _onModelViewerEvent = null;
    super.dispose();
  }

  /// 切换动画
  void setAnimation(String name) {
    _modelViewerElement?.setAttribute('animation-name', name);
  }

  /// 暂停动画
  void pauseAnimation() {
    _modelViewerElement?.setAttribute('paused', '');
  }

  /// 恢复动画
  void resumeAnimation() {
    _modelViewerElement?.removeAttribute('paused');
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
        if (!_modelLoaded)
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
      ],
    );
  }
}