import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget
///
/// 使用 JS 创建绝对定位的覆盖层，精确匹配 Flutter 容器尺寸，
/// 不遮挡页面上其他 UI 元素。
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

  @override
  void initState() {
    super.initState();
    _overlayId = 'mv-${_counter++}';
    // 延迟创建，确保 Flutter 布局完成
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) _createOverlay();
    });
  }

  void _createOverlay() {
    if (!mounted) return;

    final script = '''
(function() {
  var old = document.getElementById('$_overlayId');
  if (old) old.remove();

  // 找到 Flutter 渲染的占位 div（通过 data 属性定位）
  var placeholders = document.querySelectorAll('div[data-mv-placeholder="$_overlayId"]');
  var placeholder = placeholders.length > 0 ? placeholders[0] : null;

  var overlay = document.createElement('div');
  overlay.id = '$_overlayId';

  if (placeholder) {
    var rect = placeholder.getBoundingClientRect();
    overlay.style.cssText = 'position:absolute;' +
      'top:' + (window.scrollY + rect.top) + 'px;' +
      'left:' + (window.scrollX + rect.left) + 'px;' +
      'width:' + rect.width + 'px;' +
      'height:' + rect.height + 'px;' +
      'z-index:100;' +
      'background:${widget.backgroundColor};' +
      'pointer-events:auto;' +
      'overflow:hidden;' +
      'border-radius:24px;';
  } else {
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:380px;z-index:100;';
  }

  var mv = document.createElement('model-viewer');
  mv.setAttribute('src', '${widget.src}');
  mv.setAttribute('style', 'width:100%;height:100%;');
  ${widget.cameraControls ? "mv.setAttribute('camera-controls', '');" : ""}
  ${widget.autoRotate ? "mv.setAttribute('auto-rotate', '');mv.setAttribute('rotation-per-second', '10deg');" : ""}
  mv.setAttribute('shadow-intensity', '${widget.shadowIntensity}');
  ${widget.animationName != null ? "mv.setAttribute('animation-name', '${widget.animationName}');" : ""}
  mv.setAttribute('camera-orbit', '0deg 75deg 105%');
  mv.setAttribute('field-of-view', '30deg');

  mv.addEventListener('load', function() {
    window.parent.postMessage({type: 'mv-load', id: '$_overlayId'}, '*');
  });
  mv.addEventListener('error', function(e) {
    window.parent.postMessage({type: 'mv-error', id: '$_overlayId'}, '*');
  });

  overlay.appendChild(mv);
  document.body.appendChild(overlay);
  window['$_overlayId'] = {overlay: overlay, mv: mv};
})();
''';
    js.context.callMethod('eval', [script]);

    html.window.addEventListener('message', js.allowInterop((event) {
      final data = (event as html.MessageEvent).data;
      if (data is Map && data['id'] == _overlayId) {
        if (data['type'] == 'mv-load') {
          print('Model loaded!');
          widget.onModelReady?.call();
        } else if (data['type'] == 'mv-error') {
          print('Model error');
          widget.onModelReady?.call();
        }
      }
    }));
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
    // 占位容器，JS 通过 data 属性找到它来定位覆盖层
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.transparent,
    );
  }
}
