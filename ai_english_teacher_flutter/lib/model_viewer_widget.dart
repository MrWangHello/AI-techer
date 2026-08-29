import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter/material.dart';

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

  var placeholders = document.querySelectorAll('div[data-mv-placeholder="$_overlayId"]');
  var placeholder = placeholders.length > 0 ? placeholders[0] : null;

  var overlay = document.createElement('div');
  overlay.id = '$_overlayId';

  if (placeholder) {
    // 使用相对定位，让模型跟随容器滚动
    placeholder.style.position = 'relative';
    placeholder.style.overflow = 'hidden';
    placeholder.style.borderRadius = '24px';
    placeholder.style.background = '${widget.backgroundColor}';
    
    overlay.style.cssText = 'position:absolute;' +
      'top:0;left:0;' +
      'width:100%;height:100%;' +
      'z-index:10;' +
      'pointer-events:auto;';
    
    placeholder.appendChild(overlay);
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
  mv.addEventListener('click', function() {
    window.parent.postMessage({type: 'mv-tap', id: '$_overlayId'}, '*');
  });

  overlay.appendChild(mv);
  window['$_overlayId'] = {overlay: overlay, mv: mv};
})();
''';
    js.context.callMethod('eval', [script]);

    html.window.addEventListener('message', js.allowInterop((event) {
      final data = (event as html.MessageEvent).data;
      if (data is Map && data['id'] == _overlayId) {
        if (data['type'] == 'mv-load') {
          widget.onModelReady?.call();
        } else if (data['type'] == 'mv-error') {
          widget.onModelReady?.call();
        } else if (data['type'] == 'mv-tap') {
          widget.onTap?.call();
        }
      }
    }));
  }

  /// 切换动画
  void setAnimation(String name) {
    js.context.callMethod('eval', [
      "if(window['$_overlayId']&&window['$_overlayId'].mv)window['$_overlayId'].mv.setAttribute('animation-name','$name');"
    ]);
  }

  /// 暂停动画
  void pauseAnimation() {
    js.context.callMethod('eval', [
      "if(window['$_overlayId']&&window['$_overlayId'].mv)window['$_overlayId'].mv.setAttribute('paused','');"
    ]);
  }

  /// 恢复动画
  void resumeAnimation() {
    js.context.callMethod('eval', [
      "if(window['$_overlayId']&&window['$_overlayId'].mv)window['$_overlayId'].mv.removeAttribute('paused');"
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
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.transparent,
    );
  }
}
