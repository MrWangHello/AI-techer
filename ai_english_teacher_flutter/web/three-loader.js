/**
 * 3D GLB Model Renderer using Three.js
 * 完全本地化，兼容所有浏览器
 * 
 * 修复内容:
 * 1. 移除 root 骨骼的位移通道(root motion)，防止模型跑出视野
 * 2. 单次动画(interact/celebrate等)播放完后自动回到 idle
 * 3. 动画切换增加容错处理
 * 
 * 全局API:
 *   window.initAllThreeViewers()       - 手动初始化所有容器
 *   window._threeLoaded                - 全局标记，模型是否已加载过
 */
(function() {
  'use strict';

  window._threeLoaded = false;
  var initializedContainers = new WeakSet();

  // 单次动画列表（播放完后自动回到 idle）
  var ONE_SHOT_ANIMS = ['interact', 'pickup', 'jump', 'no', 'yes', 'pain', 'fall_over', 'celebrate', 'uppercut'];

  // 移除 root 骨骼的位移通道，防止动画播放时模型跑出视野
  function removeRootMotion(animations) {
    if (!animations || !animations.length) return;
    for (var i = 0; i < animations.length; i++) {
      var clip = animations[i];
      var filtered = [];
      for (var j = 0; j < clip.tracks.length; j++) {
        var track = clip.tracks[j];
        var trackName = track.name || '';
        // 跳过 root 骨骼的位置/位移通道（root motion）
        if (trackName.indexOf('root.position') !== -1 || trackName.indexOf('root.translation') !== -1) {
          continue;
        }
        filtered.push(track);
      }
      clip.tracks = filtered;
    }
  }

  function fitModelToView(model, camera, containerW, containerH) {
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim < 0.01) return;

    var fov = camera.fov * Math.PI / 180;
    var dist = maxDim / 2 / Math.tan(fov / 2);

    // 系数 0.85，让模型填满更多画面
    camera.position.set(center.x, center.y, center.z + dist / 0.85);
    camera.lookAt(center);
    // 把模型移到原点，居中
    model.position.sub(center);
  }

  // 自动重试：加载失败后最多重试 3 次
  function loadModel(loader, src, container, onSuccess, onError, retries) {
    retries = retries || 0;
    loader.load(
      src,
      function(gltf) {
        container.setAttribute('data-loaded', 'true');
        container.removeAttribute('data-error');
        onSuccess(gltf);
      },
      undefined,
      function(err) {
        console.error('GLB load error (attempt ' + (retries + 1) + '):', src, err);
        if (retries < 3) {
          container.setAttribute('data-retrying', String(retries + 1));
          setTimeout(function() {
            loadModel(loader, src, container, onSuccess, onError, retries + 1);
          }, 1500 * (retries + 1));
        } else {
          container.setAttribute('data-error', 'true');
          container.removeAttribute('data-retrying');
          if (onError) onError(err);
        }
      }
    );
  }

  function initViewer(container) {
    if (initializedContainers.has(container)) return;

    var w = container.clientWidth;
    var h = container.clientHeight;

    if (w === 0 || h === 0) {
      setTimeout(function() { initViewer(container); }, 300);
      return;
    }

    initializedContainers.add(container);

    var src = container.getAttribute('data-src') || 'assets/models/poppy-the-mouse.glb';
    var animName = container.getAttribute('data-anim') || 'idle';
    var autoRotate = container.getAttribute('data-autorotate') !== 'false';

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;text-align:center;padding:10px;">WebGL 不可用</div>';
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    } else if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 5, 5);
    scene.add(dirLight);
    var backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-3, 3, -5);
    scene.add(backLight);
    var fillLight = new THREE.DirectionalLight(0x8888ff, 0.2);
    fillLight.position.set(0, -3, 4);
    scene.add(fillLight);

    var mixer = null;
    var clock = new THREE.Clock();
    var loadedModel = null;
    var modelAnimations = [];
    // 用于记录当前播放的动画名称，用于单次动画回退
    var currentAnimName = animName;
    var oneShotTimer = null;

    var loader = new THREE.GLTFLoader();
    loadModel(loader, src, container, function(gltf) {
      loadedModel = gltf.scene;
      loadedModel.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(loadedModel);
      fitModelToView(loadedModel, camera, w, h);

      if (gltf.animations && gltf.animations.length > 0) {
        modelAnimations = gltf.animations.slice();
        // 移除所有动画的 root motion
        removeRootMotion(modelAnimations);

        mixer = new THREE.AnimationMixer(loadedModel);
        var clip = null;
        for (var i = 0; i < modelAnimations.length; i++) {
          if (modelAnimations[i].name === animName) { clip = modelAnimations[i]; break; }
        }
        if (!clip) clip = modelAnimations[0];
        currentAnimName = animName;
        playAnimation(clip, animName, true);
      }

      // 启动动画切换监听
      watchAnimChanges(container, mixer, clock, modelAnimations);

      window._threeLoaded = true;
      container.setAttribute('data-loaded', 'true');
      container.dispatchEvent(new CustomEvent('three-loaded', { bubbles: true }));
    }, function() {
      container.dispatchEvent(new CustomEvent('three-error', { bubbles: true }));
    });

    // 播放动画（带单次动画自动回退功能）
    function playAnimation(clip, animName, isInitial) {
      if (!mixer || !clip) return;
      try {
        // 清除之前的单次动画定时器
        if (oneShotTimer) {
          clearTimeout(oneShotTimer);
          oneShotTimer = null;
        }

        mixer.stopAllAction();
        var action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        // 过渡效果：让动画切换更平滑
        if (!isInitial) {
          action.fadeIn(0.3);
        }
        action.play();
        clock.stop();
        clock.start();

        // 如果是单次动画，设置定时器回到 idle
        if (ONE_SHOT_ANIMS.indexOf(animName) !== -1) {
          // 计算动画时长，加一点延迟让动画完整播放
          var duration = clip.duration;
          var delay = Math.max(duration * 1000 + 500, 1500);
          oneShotTimer = setTimeout(function() {
            // 回到 idle
            var idleClip = null;
            for (var i = 0; i < modelAnimations.length; i++) {
              if (modelAnimations[i].name === 'idle') { idleClip = modelAnimations[i]; break; }
            }
            if (idleClip) {
              currentAnimName = 'idle';
              mixer.stopAllAction();
              var idleAction = mixer.clipAction(idleClip);
              idleAction.setLoop(THREE.LoopRepeat, Infinity);
              idleAction.fadeIn(0.3);
              idleAction.play();
              clock.stop();
              clock.start();
            }
          }, delay);
        }
      } catch (e) {
        console.error('Animation error:', e);
      }
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      if (loadedModel && autoRotate) {
        // 有动画播放时旋转更慢，无动画时正常旋转
        var rotSpeed = mixer && mixer.time > 0 ? 0.002 : 0.005;
        loadedModel.rotation.y += rotSpeed;
      }
      renderer.render(scene, camera);
    }
    animate();

    // 监听 data-anim 属性变化，实现动态切换动画
    function watchAnimChanges(container, mixer, clock, animations) {
      if (!window.MutationObserver) return;
      if (!mixer) return;
      animations = animations || [];
      var animObserver = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'data-anim' && mixer) {
            var newAnim = container.getAttribute('data-anim');
            if (!newAnim || !animations.length) return;
            if (newAnim === currentAnimName) return; // 避免重复切换

            try {
              // 查找动画
              var clip = null;
              for (var j = 0; j < animations.length; j++) {
                if (animations[j].name === newAnim) {
                  clip = animations[j];
                  break;
                }
              }
              if (!clip) {
                clip = animations[0];
                newAnim = animations[0].name;
              }
              currentAnimName = newAnim;
              playAnimation(clip, newAnim, false);
            } catch (e) {
              console.error('Animation switch error:', e);
            }
          }
        }
      });
      animObserver.observe(container, { attributes: true, attributeFilter: ['data-anim'] });
    }

    // Resize handler
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function() {
        var nw = container.clientWidth;
        var nh = container.clientHeight;
        if (nw > 0 && nh > 0 && (nw !== w || nh !== h)) {
          w = nw; h = nh;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          if (loadedModel) fitModelToView(loadedModel, camera, w, h);
        }
      });
      ro.observe(container);
    }
  }

  function initAll() {
    var viewers = document.querySelectorAll('.three-viewer');
    for (var i = 0; i < viewers.length; i++) initViewer(viewers[i]);
  }

  window.initAllThreeViewers = initAll;

  // 等 DOM 准备好后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initAll, 500); });
  } else {
    setTimeout(initAll, 500);
  }

  // MutationObserver 检测动态添加的 .three-viewer 容器
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('three-viewer')) {
              setTimeout(function() { initViewer(node); }, 100);
            }
            var nested = node.querySelectorAll ? node.querySelectorAll('.three-viewer') : [];
            for (var k = 0; k < nested.length; k++) {
              (function(el) { setTimeout(function() { initViewer(el); }, 100); })(nested[k]);
            }
          }
        }
      }
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }
})();