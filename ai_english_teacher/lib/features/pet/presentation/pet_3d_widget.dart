import 'package:flutter/material.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import '../providers/pet_provider.dart';

/// 3D宠物展示组件
class Pet3DWidget extends StatefulWidget {
  final PetState petState;
  final VoidCallback? onTap;
  final bool isInteractive;

  const Pet3DWidget({
    super.key,
    required this.petState,
    this.onTap,
    this.isInteractive = true,
  });

  @override
  State<Pet3DWidget> createState() => _Pet3DWidgetState();
}

class _Pet3DWidgetState extends State<Pet3DWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _bounceAnimation = Tween<double>(begin: 0, end: 10).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  /// 根据宠物状态选择3D模型
  String _getModelPath() {
    switch (widget.petState.evolutionStage) {
      case EvolutionStage.egg:
        return 'assets/models/pet_egg.glb';
      case EvolutionStage.baby:
        return 'assets/models/pet_baby.glb';
      case EvolutionStage.teen:
        return 'assets/models/pet_teen.glb';
      case EvolutionStage.adult:
        return 'assets/models/pet_adult.glb';
    }
  }

  /// 根据宠物心情选择动画
  String _getAnimationName() {
    if (widget.petState.mood > 80) {
      return 'Happy'; // 开心动画
    } else if (widget.petState.mood > 50) {
      return 'Idle'; // 待机动画
    } else {
      return 'Sad'; // 难过动画
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bounceAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, -_bounceAnimation.value),
          child: child,
        );
      },
      child: GestureDetector(
        onTap: widget.onTap,
        child: ModelViewer(
          src: _getModelPath(),
          alt: '3D Pet Model',
          autoRotate: widget.isInteractive,
          autoRotateDelay: 0,
          rotationPerSecond: '10deg',
          cameraControls: widget.isInteractive,
          ar: false,
          arPlacement: 'floor',
          backgroundColor: Colors.transparent,
          animationName: _getAnimationName(),
          loading: _buildLoadingIndicator(),
          failure: _buildFailureWidget(),
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('加载宠物模型中...'),
        ],
      ),
    );
  }

  Widget _buildFailureWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.pets, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('模型加载失败'),
          const Text('使用2D宠物显示', style: TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
