import 'dart:html' as html;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget
///
/// 使用 iframe 嵌入独立的 model_viewer.html，避免 Flutter shadow DOM
/// 导致 custom element 无法正确初始化的问题。
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

  @override
  void initState() {
    super.initState();
    _viewType = 'model-viewer-iframe-${_nextViewId++}';
    _registerViewFactory();
  }

  String _buildIframeUrl() {
    final params = <String, String>{
      'src': widget.src,
      'shadow': widget.shadowIntensity.toString(),
    };
    if (widget.animationName != null) {
      params['anim'] = widget.animationName!;
    }
    final query = params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    return 'model_viewer.html?$query';
  }

  void _registerViewFactory() {
    ui.platformViewRegistry.registerViewFactory(
      _viewType,
      (int viewId) {
        final iframe = html.IFrameElement()
          ..src = _buildIframeUrl()
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%'
          ..allow = 'autoplay';

        // 监听 iframe 发来的消息
        html.window.addEventListener('message', (event) {
          final msgEvent = event as html.MessageEvent;
          final data = msgEvent.data;
          if (data is Map && data['type'] == 'model-ready') {
            print('Model loaded via iframe!');
            widget.onModelReady?.call();
          } else if (data is Map && data['type'] == 'model-error') {
            print('Model error via iframe: ${data['detail']}');
            widget.onModelReady?.call();
          }
        });

        return iframe;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
