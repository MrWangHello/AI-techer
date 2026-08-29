import 'dart:html' as html;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget（基于 Google model-viewer Web Component）
class ModelViewerWidget extends StatefulWidget {
  final String src;
  final String? animationName;
  final bool autoRotate;
  final bool cameraControls;
  final double shadowIntensity;
  final String backgroundColor;
  final VoidCallback? onModelReady;

  const ModelViewerWidget({
    super.key,
    required this.src,
    this.animationName,
    this.autoRotate = true,
    this.cameraControls = true,
    this.shadowIntensity = 0.5,
    this.backgroundColor = 'transparent',
    this.onModelReady,
  });

  @override
  State<ModelViewerWidget> createState() => _ModelViewerWidgetState();
}

class _ModelViewerWidgetState extends State<ModelViewerWidget> {
  static int _nextViewId = 0;
  late final String _viewType;
  html.Element? _modelViewer;

  @override
  void initState() {
    super.initState();
    _viewType = 'model-viewer-${_nextViewId++}';
    _registerViewFactory();
  }

  void _registerViewFactory() {
    ui.platformViewRegistry.registerViewFactory(
      _viewType,
      (int viewId) {
        // 使用 document.createElement 确保创建的是 custom element
        final el = html.document.createElement('model-viewer') as html.Element
          ..setAttribute('src', widget.src)
          ..setAttribute('style',
              'width: 100%; height: 100%; background-color: ${widget.backgroundColor};');

        if (widget.cameraControls) {
          el.setAttribute('camera-controls', '');
        }

        if (widget.autoRotate) {
          el.setAttribute('auto-rotate', '');
          el.setAttribute('rotation-per-second', '10deg');
        }

        el.setAttribute('shadow-intensity', widget.shadowIntensity.toString());

        if (widget.animationName != null) {
          el.setAttribute('animation-name', widget.animationName!);
        }

        // 监听模型加载完成事件
        el.addEventListener('load', (event) {
          print('Model loaded successfully: ${widget.src}');
          widget.onModelReady?.call();
        });

        // 监听错误事件
        el.addEventListener('error', (event) {
          print('Model load error: $event');
          // 即使出错也触发回调，避免 Loading 遮罩一直显示
          widget.onModelReady?.call();
        });

        _modelViewer = el;
        return el;
      },
    );
  }

  /// 切换动画
  void setAnimation(String name) {
    _modelViewer?.setAttribute('animation-name', name);
  }

  /// 暂停所有动画
  void pauseAnimation() {
    _modelViewer?.setAttribute('paused', '');
  }

  /// 恢复动画
  void resumeAnimation() {
    _modelViewer?.removeAttribute('paused');
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
