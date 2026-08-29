import 'dart:html' as html;
import 'package:flutter/material.dart';

/// 3D GLB 模型查看器 Widget
/// 通过 postMessage 控制静态嵌入的 model-viewer 元素
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
    
    // 发送消息显示 model-viewer
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        html.window.postMessage({
          'type': 'show-model',
          'animation': widget.animationName ?? 'Idle',
        }, '*');
      }
    });
  }

  /// 切换动画
  void setAnimation(String name) {
    html.window.postMessage({
      'type': 'set-animation',
      'animation': name,
    }, '*');
  }

  /// 暂停动画
  void pauseAnimation() {
    html.window.postMessage({
      'type': 'pause-animation',
    }, '*');
  }

  /// 恢复动画
  void resumeAnimation() {
    html.window.postMessage({
      'type': 'resume-animation',
    }, '*');
  }

  @override
  void dispose() {
    // 移除事件监听器
    if (_messageListener != null) {
      html.window.removeEventListener('message', _messageListener!);
    }
    
    // 隐藏 model-viewer
    html.window.postMessage({
      'type': 'hide-model',
    }, '*');
    
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
