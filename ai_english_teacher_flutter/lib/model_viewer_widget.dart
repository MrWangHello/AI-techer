import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget
///
/// 使用纯 JS 创建全屏覆盖层（z-index: 9999），确保在 Flutter canvas 之上显示。
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
  static int _counter = 0;
  late final String _overlayId;
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    _overlayId = 'mv-overlay-${_counter++}';
    // 延迟创建，确保 Flutter 已初始化
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) _createOverlay();
    });
  }

  void _createOverlay() {
    if (!mounted) return;

    // 用 JS 创建覆盖层 div + model-viewer
    final script = '''
(function() {
  // 移除旧的 overlay（如果有）
  var old = document.getElementById('$_overlayId');
  if (old) old.remove();

  // 创建覆盖层
  var overlay = document.createElement('div');
  overlay.id = '$_overlayId';
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:9999;background:${widget.backgroundColor};pointer-events:auto;';

  // 创建 model-viewer
  var mv = document.createElement('model-viewer');
  mv.setAttribute('src', '${widget.src}');
  mv.setAttribute('style', 'width:100%;height:100%;');
  ${widget.cameraControls ? "mv.setAttribute('camera-controls', '');" : ""}
  ${widget.autoRotate ? "mv.setAttribute('auto-rotate', '');mv.setAttribute('rotation-per-second', '10deg');" : ""}
  mv.setAttribute('shadow-intensity', '${widget.shadowIntensity}');
  ${widget.animationName != null ? "mv.setAttribute('animation-name', '${widget.animationName}');" : ""}

  // 加载事件
  mv.addEventListener('load', function() {
    window.parent.postMessage({type: 'mv-load', id: '$_overlayId'}, '*');
  });
  mv.addEventListener('error', function(e) {
    window.parent.postMessage({type: 'mv-error', id: '$_overlayId', detail: e.detail}, '*');
  });

  overlay.appendChild(mv);
  document.body.appendChild(overlay);

  // 存储引用供后续控制
  window['$_overlayId'] = {overlay: overlay, mv: mv};
})();
''';
    js.context.callMethod('eval', [script]);
    setState(() => _visible = true);

    // 监听消息
    html.window.addEventListener('message', js.allowInterop((event) {
      final data = (event as html.MessageEvent).data;
      if (data is Map && data['id'] == _overlayId) {
        if (data['type'] == 'mv-load') {
          print('Model loaded!');
          widget.onModelReady?.call();
        } else if (data['type'] == 'mv-error') {
          print('Model error: ${data['detail']}');
          widget.onModelReady?.call();
        }
      }
    }));
  }

  void _updateAnimation(String name) {
    js.context.callMethod('eval', [
      "if(window['$_overlayId']) window['$_overlayId'].mv.setAttribute('animation-name', '$name');"
    ]);
  }

  @override
  void dispose() {
    js.context.callMethod('eval', [
      "var el=document.getElementById('$_overlayId');if(el)el.remove();delete window['$_overlayId'];"
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 返回透明占位，实际 3D 模型由 JS 创建的覆盖层显示
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.transparent,
    );
  }
}
