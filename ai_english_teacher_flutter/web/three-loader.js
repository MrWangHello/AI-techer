/**
 * 3D GLB Model Renderer using Three.js
 * 完全本地化，兼容所有浏览器
 * 
 * 全局API:
 *   window.initThreeViewer(container)  - 手动初始化单个容器
 *   window.initAllThreeViewers()       - 初始化所有 .three-viewer 容器
 *   window._threeLoaded                - 全局标记，模型是否已加载过
 */
(function() {
  'use strict';

  // 全局标记：模型是否已经加载成功过（防止 Flutter Widget 重建后重复显示加载）
  window._threeLoaded = false;

  var initializedContainers = new WeakSet();

  function fitModelToView(loadedModel, camera, containerW, containerH) {
    var box = new THREE.Box3().setFromObject(loadedModel);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());

    var maxDim = Math.max(size.x, size.y, size.z);
    var fov = camera.fov * (Math.PI / 180);
    // 让模型占容器高度的 ~80%
    var cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) / 0.8;

    // 同时考虑宽度
    var aspect = containerW / containerH;
    var cameraZWidth = Math.abs(maxDim / 2 / Math.tan(fov / 2) / aspect) / 0.8;
    cameraZ = Math.max(cameraZ, cameraZWidth);

    // 最小/最大相机距离
    cameraZ = Math.max(cameraZ, 1.5);
    cameraZ = Math.min(cameraZ, 10);

    camera.position.set(center.x, center.y, center.z + cameraZ);
    camera.lookAt(center);

    // 居中模型
    loadedModel.position.sub(center);
  }

  function initViewer(container) {
    if (initializedContainers.has(container)) return;

    var w = container.clientWidth;
    var h = container.clientHeight;

    // 容器尺寸为0时延迟重试
    if (w === 0 || h === 0) {
      setTimeout(function() { initViewer(container); }, 200);
      return;
    }

    initializedContainers.add(container);

    var src = container.getAttribute('data-src') || 'assets/models/RobotExpressive.glb';
    var animName = container.getAttribute('data-anim') || 'Idle';

    // Scene
    var scene = new THREE.Scene();

    // Camera - 45度 FOV
    var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);

    // Renderer
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;text-align:center;padding:10px;">WebGL 不可用</div>';
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    var backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-3, 3, -5);
    scene.add(backLight);

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

        scene.add(loadedModel);

        // 自动适配模型大小到容器
        fitModelToView(loadedModel, camera, w, h);

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
        window._threeLoaded = true;
        console.log('3D model loaded:', src);

        // 通过 DOM 自定义事件通知 Flutter
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
          // 重新适配模型
          if (loadedModel) {
            fitModelToView(loadedModel, camera, w, h);
          }
        }
      });
      ro.observe(container);
    }

    container._three = { scene: scene, camera: camera, renderer: renderer, mixer: mixer, model: loadedModel };
  }

  function initAll() {
    var viewers = document.querySelectorAll('.three-viewer');
    for (var i = 0; i < viewers.length; i++) {
      initViewer(viewers[i]);
    }
  }

  window.initThreeViewer = initViewer;
  window.initAllThreeViewers = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initAll, 300);
    });
  } else {
    setTimeout(initAll, 300);
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1) {
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
