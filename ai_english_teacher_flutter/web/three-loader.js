/**
 * 3D GLB Model Renderer using Three.js
 * 完全本地化，兼容所有浏览器
 * 
 * 全局API:
 *   window.initAllThreeViewers()       - 手动初始化所有容器
 *   window._threeLoaded                - 全局标记，模型是否已加载过
 */
(function() {
  'use strict';

  window._threeLoaded = false;
  var initializedContainers = new WeakSet();

  function fitModelToView(model, camera, containerW, containerH) {
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim < 0.01) return;

    var fov = camera.fov * Math.PI / 180;
    var dist = maxDim / 2 / Math.tan(fov / 2);

    // 用更保守的系数 0.6，让模型更紧凑
    camera.position.set(center.x, center.y, center.z + dist / 0.6);
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

    var src = container.getAttribute('data-src') || 'assets/models/RobotExpressive.glb';
    var animName = container.getAttribute('data-anim') || 'Idle';

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
    renderer.outputEncoding = THREE.sRGBEncoding;
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
        mixer = new THREE.AnimationMixer(loadedModel);
        var clip = null;
        for (var i = 0; i < gltf.animations.length; i++) {
          if (gltf.animations[i].name === animName) { clip = gltf.animations[i]; break; }
        }
        if (!clip) clip = gltf.animations[0];
        mixer.clipAction(clip).play();
      }

      window._threeLoaded = true;
      container.setAttribute('data-loaded', 'true');
      container.dispatchEvent(new CustomEvent('three-loaded', { bubbles: true }));
    }, function() {
      container.dispatchEvent(new CustomEvent('three-error', { bubbles: true }));
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      if (loadedModel) loadedModel.rotation.y += 0.005;
      renderer.render(scene, camera);
    }
    animate();

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