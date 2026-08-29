import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget
/// 通过直接操作 DOM 控制静态嵌入的 model-viewer 元素
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
  html.EventListener? _messageListener;
  bool _modelLoaded = false;

  @override
  void initState() {
    super.initState();
    
    // 监听来自静态 model-viewer 的消息
    _messageListener = (html.Event event) {
      final messageEvent = event as html.MessageEvent;
      final data = messageEvent.data;
      
      if (data is Map) {
        if (data['type'] == 'mv-load') {
          _modelLoaded = true;
          widget.onModelReady?.call();
          if (mounted) setState(() {});
        } else if (data['type'] == 'mv-error') {
          debugPrint('Model viewer error: ${data['error']}');
        } else if (data['type'] == 'mv-tap') {
          widget.onTap?.call();
        }
      }
    };
    html.window.addEventListener('message', _messageListener!);
    
    // 延迟显示 model-viewer，直接操作 DOM
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        debugPrint('显示 model-viewer');
        _showModelViewer();
      }
    });
  }

  void _showModelViewer() {
    // 直接在主页面 DOM 中操作
    js.context.callMethod('eval', [
      '''
      (function() {
        var container = document.getElementById('model-viewer-container');
        var viewer = document.getElementById('pet-model');
        if (container) {
          container.classList.add('active');
        }
        if (viewer && '${widget.animationName ?? 'Idle'}') {
          viewer.setAttribute('animation-name', '${widget.animationName ?? 'Idle'}');
        }
        console.log('Model viewer shown');
      })();
      '''
    ]);
  }

  void _hideModelViewer() {
    js.context.callMethod('eval', [
      '''
      (function() {
        var container = document.getElementById('model-viewer-container');
        if (container) {
          container.classList.remove('active');
        }
      })();
      '''
    ]);
  }

  /// 切换动画
  void setAnimation(String name) {
    js.context.callMethod('eval', [
      "var v=document.getElementById('pet-model');if(v)v.setAttribute('animation-name','$name');"
    ]);
  }

  /// 暂停动画
  void pauseAnimation() {
    js.context.callMethod('eval', [
      "var v=document.getElementById('pet-model');if(v)v.setAttribute('paused','');"
    ]);
  }

  /// 恢复动画
  void resumeAnimation() {
    js.context.callMethod('eval', [
      "var v=document.getElementById('pet-model');if(v)v.removeAttribute('paused');"
    ]);
  }

  @override
  void dispose() {
    // 移除事件监听器
    if (_messageListener != null) {
      html.window.removeEventListener('message', _messageListener!);
    }
    
    // 隐藏 model-viewer
    _hideModelViewer();
    
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        color: widget.backgroundColor == 'transparent' 
            ? Colors.transparent 
            : Color(int.parse(widget.backgroundColor.replaceAll('#', '0xFF'))),
        borderRadius: BorderRadius.circular(24),
      ),
      child: _modelLoaded 
          ? null 
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('3D 模型加载中...'),
                ],
              ),
            ),
    );
  }
}
