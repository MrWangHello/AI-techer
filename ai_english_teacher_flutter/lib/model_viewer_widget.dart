import 'dart:html' as html;
import 'dart:js' as js;
import 'dart:ui_web' as ui_web;
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
  late final String _viewType;
  html.DivElement? _placeholderElement;
  html.EventListener? _messageListener;

  @override
  void initState() {
    super.initState();
    _overlayId = 'mv-${_counter++}';
    _viewType = 'model-viewer-$_overlayId';
    
    // 注册平台视图
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      _placeholderElement = html.DivElement()
        ..setAttribute('data-mv-placeholder', _overlayId)
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.position = 'relative'
        ..style.overflow = 'hidden'
        ..style.borderRadius = '24px'
        ..style.background = widget.backgroundColor;
      
      // 延迟创建 overlay，确保元素已插入 DOM
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) _createOverlay();
      });
      
      return _placeholderElement!;
    });
  }

  void _createOverlay() {
    if (!mounted || _placeholderElement == null) return;

    final script = '''
(function() {
  var old = document.getElementById('$_overlayId');
  if (old) old.remove();

  var placeholders = document.querySelectorAll('div[data-mv-placeholder="$_overlayId"]');
  var placeholder = placeholders.length > 0 ? placeholders[0] : null;

  if (!placeholder) {
    console.error('Model viewer placeholder not found: $_overlayId');
    return;
  }

  var overlay = document.createElement('div');
  overlay.id = '$_overlayId';
  overlay.style.cssText = 'position:absolute;' +
    'top:0;left:0;' +
    'width:100%;height:100%;' +
    'z-index:10;' +
    'pointer-events:auto;';
  
  placeholder.appendChild(overlay);

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
    window.postMessage({type: 'mv-load', id: '$_overlayId'}, '*');
  });
  mv.addEventListener('error', function(e) {
    console.error('Model viewer error:', e);
    window.postMessage({type: 'mv-error', id: '$_overlayId', error: 'Failed to load model'}, '*');
  });
  mv.addEventListener('click', function() {
    window.postMessage({type: 'mv-tap', id: '$_overlayId'}, '*');
  });

  overlay.appendChild(mv);
  window['$_overlayId'] = {overlay: overlay, mv: mv};
})();
''';
    js.context.callMethod('eval', [script]);

    // 添加消息监听器（只添加一次）
    _messageListener = (html.Event event) {
      final messageEvent = event as html.MessageEvent;
      final data = messageEvent.data;
      if (data is Map && data['id'] == _overlayId) {
        if (data['type'] == 'mv-load') {
          widget.onModelReady?.call();
        } else if (data['type'] == 'mv-error') {
          // 错误时不调用 onModelReady，让加载遮罩保持显示
          debugPrint('Model viewer error: ${data['error']}');
        } else if (data['type'] == 'mv-tap') {
          widget.onTap?.call();
        }
      }
    };
    html.window.addEventListener('message', _messageListener!);
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
    // 移除事件监听器
    if (_messageListener != null) {
      html.window.removeEventListener('message', _messageListener!);
    }
    
    // 清理 DOM 元素
    js.context.callMethod('eval', [
      "var el=document.getElementById('$_overlayId');if(el)el.remove();delete window['$_overlayId'];"
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
