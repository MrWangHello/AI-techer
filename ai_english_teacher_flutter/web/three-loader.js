/**
 * 3D GLB Model Renderer using Three.js
 * 完全本地化，兼容所有浏览器
 * 
 * 全局API:
 *   window.initThreeViewer(container)  - 手动初始化单个容器
 *   window.initAllThreeViewers()       - 初始化所有 .three-viewer 容器
 */
(function() {
  'use strict';

  var initializedContainers = new WeakSet();

  function initViewer(container) {
    if (initializedContainers.has(container)) return;

    var w = container.clientWidth;
    var h = container.clientHeight;

    // 容器尺寸为0时延迟重试（Flutter HtmlElementView 可能还没布局完）
    if (w === 0 || h === 0) {
      setTimeout(function() { initViewer(container); }, 200);
      return;
    }

    initializedContainers.add(container);

    var src = container.getAttribute('data-src') || 'assets/models/RobotExpressive.glb';
    var animName = container.getAttribute('data-anim') || 'Idle';

    // Scene
    var scene = new THREE.Scene();

    // Camera
    var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    // Renderer
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;text-align:center;padding:10px;">WebGL 不可用<br><small>请使用 Chrome 或 QQ 浏览器</small></div>';
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    var mixer = null;
    var clock = new THREE.Clock();
    var loadedModel = null;

    // Load GLB
    var loader = new THREE.GLTFLoader();
    loader.load(
      src,
      function(gltf) {
        loadedModel = gltf.scene;

        loadedModel.traverse(function(child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Auto-scale
        var box = new THREE.Box3().setFromObject(loadedModel);
        var size = box.getSize(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          var scale = 2.0 / maxDim;
          loadedModel.scale.setScalar(scale);
        }

        // Center
        box = new THREE.Box3().setFromObject(loadedModel);
        var center = box.getCenter(new THREE.Vector3());
        loadedModel.position.sub(center);
        loadedModel.position.y += 0.5;

        scene.add(loadedModel);

        // Animations
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(loadedModel);
          var clip = null;
          for (var i = 0; i < gltf.animations.length; i++) {
            if (gltf.animations[i].name === animName) {
              clip = gltf.animations[i];
              break;
            }
          }
          if (!clip) clip = gltf.animations[0];
          var action = mixer.clipAction(clip);
          action.play();
        }

        container.setAttribute('data-loaded', 'true');
        console.log('3D model loaded:', src);

        // 通过 DOM 自定义事件通知 Flutter（不依赖 postMessage，避免跨窗口问题）
        container.dispatchEvent(new CustomEvent('three-loaded', { bubbles: true }));
      },
      function(xhr) {
        if (xhr.lengthComputable) {
          var pct = Math.round(xhr.loaded / xhr.total * 100);
          container.setAttribute('data-progress', pct);
        }
      },
      function(error) {
        console.error('GLB load error:', error);
        container.setAttribute('data-error', 'true');
      }
    );

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      // Slow auto-rotate
      if (loadedModel) {
        loadedModel.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function() {
        var nw = container.clientWidth;
        var nh = container.clientHeight;
        if (nw > 0 && nh > 0 && (nw !== w || nh !== h)) {
          w = nw; h = nh;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      });
      ro.observe(container);
    }

    // Store refs for external control
    container._three = { scene: scene, camera: camera, renderer: renderer, mixer: mixer, model: loadedModel };
  }

  // 初始化所有 .three-viewer 容器
  function initAll() {
    var viewers = document.querySelectorAll('.three-viewer');
    for (var i = 0; i < viewers.length; i++) {
      initViewer(viewers[i]);
    }
  }

  // 暴露全局 API
  window.initThreeViewer = initViewer;
  window.initAllThreeViewers = initAll;

  // 自动初始化（页面加载时已有的容器）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initAll, 500);
    });
  } else {
    setTimeout(initAll, 500);
  }

  // MutationObserver: 监听 DOM 变化，自动初始化新添加的容器
  // （Flutter HtmlElementView 动态创建的元素会触发这个）
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1) { // Element
            if (node.classList && node.classList.contains('three-viewer')) {
              setTimeout(function() { initViewer(node); }, 100);
            }
            var nested = node.querySelectorAll ? node.querySelectorAll('.three-viewer') : [];
            for (var k = 0; k < nested.length; k++) {
              setTimeout(function(el) { return function() { initViewer(el); }; }(nested[k]), 100);
            }
          }
        }
      }
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
