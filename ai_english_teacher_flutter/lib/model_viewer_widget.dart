import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget
///
/// 直接用 dart:js 将 <model-viewer> 元素插入主 document，
/// 完全绕过 Flutter HtmlElementView 的 shadow DOM 限制。
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
  html.DivElement? _container;
  bool _inserted = false;

  @override
  void initState() {
    super.initState();
    // 延迟插入，确保 model-viewer 库已加载
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _insertModelViewer();
    });
  }

  void _insertModelViewer() {
    if (_inserted) return;

    // 创建容器 div
    _container = html.DivElement()
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.position = 'relative';

    // 用 dart:js 创建 model-viewer custom element 并插入主 document
    final mv = js.context.callMethod('document.createElement', ['model-viewer']);
    mv['setAttribute']('src', widget.src);
    mv['setAttribute']('style',
        'width:100%;height:100%;background-color:${widget.backgroundColor};');

    if (widget.cameraControls) mv['setAttribute']('camera-controls', '');
    if (widget.autoRotate) {
      mv['setAttribute']('auto-rotate', '');
      mv['setAttribute']('rotation-per-second', '10deg');
    }
    mv['setAttribute']('shadow-intensity', widget.shadowIntensity.toString());
    if (widget.animationName != null) {
      mv['setAttribute']('animation-name', widget.animationName!);
    }

    // 监听加载事件
    mv.callMethod('addEventListener', ['load', js.allowInterop((_) {
      print('Model loaded!');
      if (mounted) widget.onModelReady?.call();
    })]);

    mv.callMethod('addEventListener', ['error', js.allowInterop((e) {
      print('Model error: $e');
      if (mounted) widget.onModelReady?.call();
    })]);

    _container!.append(mv as html.Node);

    // 将容器插入 Flutter 的 overlay 区域
    final host = html.document.querySelector('flt-glass-pane') ??
        html.document.body;
    if (host != null) {
      (host as html.Node).append(_container!);
      _inserted = true;
    }
  }

  @override
  void dispose() {
    _container?.remove();
    _inserted = false;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 返回一个占位容器，实际渲染由 dart:js 插入的 DOM 元素完成
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.transparent,
    );
  }
}
