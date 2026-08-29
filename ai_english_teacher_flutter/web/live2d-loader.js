/**
 * Live2D Model Renderer using PixiJS + pixi-live2d-display
 * 
 * 功能:
 * 1. 加载 Live2D 模型（Tororo 白猫 / Koharu 小春）
 * 2. 语音驱动嘴型同步（ParamMouthOpenY）
 * 3. 眼睛追踪鼠标（ParamAngleX/Y）
 * 4. 点击交互触发随机动作
 * 5. 自动检测 .live2d-viewer 容器并初始化
 */
(function() {
  'use strict';

  console.log('[Live2D] Loader initiated');

  // ======== 模型配置 ========
  var MODELS = {
    tororo: { name: 'Tororo 白猫', url: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json', scale: 0.5, offsetY: 200, type: 'pet' },
    koharu: { name: 'Koharu 小春', url: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json', scale: 0.34, offsetY: 150, type: 'teacher' },
  };

  window._live2dLoaded = false;
  var initializedContainers = new WeakSet();
  var appCache = {};
  var lipSyncData = {};

  // ======== 等待 PixiJS 和 Live2D 库就绪 ========
  function waitForLibs(callback, retries) {
    retries = retries || 0;
    if (typeof PIXI !== 'undefined' && PIXI.live2d) {
      // 检查 Live2DModel 是否可用
      if (typeof PIXI.live2d.Live2DModel !== 'undefined') {
        callback();
        return;
      } else {
        console.warn('[Live2D] PIXI.live2d exists but Live2DModel not found, retrying...');
      }
    }
    if (retries > 60) { // 最多等 30 秒
      console.error('[Live2D] Libraries failed to load after 60 retries');
      // 触发全局错误事件，让 Flutter 知道
      document.dispatchEvent(new CustomEvent('live2d-error', { detail: 'Libraries timeout' }));
      return;
    }
    setTimeout(function() { waitForLibs(callback, retries + 1); }, 500);
  }

  // ======== 初始化一个查看器 ========
  function initViewer(container) {
    if (initializedContainers.has(container)) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w === 0 || h === 0) {
      // 容器还没渲染好，延迟重试
      setTimeout(function() { initViewer(container); }, 300);
      return;
    }
    initializedContainers.add(container);

    var modelKey = container.getAttribute('data-model') || 'tororo';
    var config = MODELS[modelKey] || MODELS.tororo;
    var containerId = container.getAttribute('data-id') || 'l2d-' + Math.random().toString(36).slice(2, 8);
    container.setAttribute('data-id', containerId);

    console.log('[Live2D] Initializing viewer:', containerId, 'model:', modelKey, 'size:', w, 'x', h);

    try {
      // 创建 PixiJS 应用
      var app = new PIXI.Application({
        width: w,
        height: h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
      // 确保 canvas 填满容器
      app.view.style.width = '100%';
      app.view.style.height = '100%';
      app.view.style.position = 'absolute';
      app.view.style.top = '0';
      app.view.style.left = '0';
      container.appendChild(app.view);
      container.style.position = 'relative';
      container.style.overflow = 'hidden';

      // 加载模型
      var Live2DModel = PIXI.live2d.Live2DModel;
      Live2DModel.from(config.url, { autoInteract: false })
        .then(function(model) {
          appCache[containerId] = { app: app, model: model, config: config };

        // 自适应缩放和居中
        positionModel(model, app, config, w, h);
        app.stage.addChild(model);

        // 点击交互
        model.on('pointerdown', function() {
          var motions = model.internalModel.motionManager.definitions;
          if (motions && motions.length > 0) {
            var idx = Math.floor(Math.random() * motions.length);
            model.motion(idx);
          }
          container.dispatchEvent(new CustomEvent('live2d-tap', { bubbles: true }));
        });

        // 鼠标追踪
        setupEyeTracking(container, app, model);

        // 嘴型同步数据
        lipSyncData[containerId] = { active: false, smoothVol: 0, audioCtx: null, analyser: null, stream: null };

        // 标记加载完成
        window._live2dLoaded = true;
        container.setAttribute('data-loaded', 'true');
        container.removeAttribute('data-error');
        container.dispatchEvent(new CustomEvent('live2d-loaded', { bubbles: true }));
        console.log('[Live2D] Model loaded successfully:', containerId);

        // 窗口自适应
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(function() {
            var nw = container.clientWidth, nh = container.clientHeight;
            if (nw > 0 && nh > 0) {
              app.renderer.resize(nw, nh);
              positionModel(model, app, config, nw, nh);
            }
          });
          ro.observe(container);
        }
      })
      .catch(function(err) {
        console.error('[Live2D] Model load error:', err && err.message ? err.message : err, 'for model:', config.url);
        container.setAttribute('data-error', 'true');
        container.dispatchEvent(new CustomEvent('live2d-error', { bubbles: true }));
        console.log('[Live2D] Will retry model in 5 seconds...');
        // 5 秒后重试
        setTimeout(function() {
          if (container.getAttribute('data-loaded') !== 'true') {
            delete appCache[containerId];
            initializedContainers.delete(container);
            initViewer(container);
          }
        }, 5000);
      });
    } catch (e) {
      console.error('[Live2D] PIXI.Application creation failed:', e && e.message ? e.message : e);
      container.setAttribute('data-error', 'true');
      container.dispatchEvent(new CustomEvent('live2d-error', { bubbles: true }));
      // 3秒后重试
      setTimeout(function() {
        if (container.getAttribute('data-loaded') !== 'true') {
          initializedContainers.delete(container);
          initViewer(container);
        }
      }, 3000);
    }
  }

  function positionModel(model, app, config, w, h) {
    var scaleX = (w / model.width) * config.scale * 2.5;
    var scaleY = (h / model.height) * config.scale * 2.5;
    var scale = Math.min(scaleX, scaleY, 1.2);
    model.scale.set(scale);
    var modelW = model.width * scale;
    var modelH = model.height * scale;
    model.x = Math.max(0, (w - modelW) / 2);
    model.y = Math.max(0, (h - modelH) / 2 + (config.offsetY || 0));
  }

  function setupEyeTracking(container, app, model) {
    var canvas = app.view;
    canvas.addEventListener('mousemove', function(e) {
      if (!model.internalModel || !model.internalModel.coreModel) return;
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      try {
        model.internalModel.coreModel.setParameterValueById('ParamAngleX', (x - 0.5) * 60);
        model.internalModel.coreModel.setParameterValueById('ParamAngleY', (y - 0.5) * 30);
      } catch(e) {}
    });
  }

  // ======== 麦克风控制 ========
  window.toggleLive2dMic = function(containerId) {
    if (!containerId) {
      var c = document.querySelector('.live2d-viewer');
      if (c) containerId = c.getAttribute('data-id') || '';
    }
    if (!containerId || !lipSyncData[containerId]) {
      // 模型还没加载完，延迟重试
      if (containerId) {
        console.log('[Live2D] Mic toggle: waiting for model to load...');
        setTimeout(function() { window.toggleLive2dMic(containerId); }, 1000);
      }
      return;
    }
    var data = lipSyncData[containerId];
    if (data.active) {
      stopMic(containerId);
    } else {
      startMic(containerId);
    }
  };

  function startMic(containerId) {
    var data = lipSyncData[containerId];
    if (!data || data.audioCtx) return;
    try {
      data.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      data.analyser = data.audioCtx.createAnalyser();
      data.analyser.fftSize = 256;
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
          data.stream = stream;
          var src = data.audioCtx.createMediaStreamSource(stream);
          src.connect(data.analyser);
          data.active = true;
          var container = document.querySelector('[data-id="' + containerId + '"]');
          if (container) container.setAttribute('data-mic', 'active');
          console.log('[Live2D] Mic activated');
          runLipSync(containerId);
        })
        .catch(function(err) {
          console.warn('[Live2D] Mic access denied:', err);
          data.audioCtx.close();
          data.audioCtx = null;
          data.analyser = null;
        });
    } catch (e) {
      console.warn('[Live2D] AudioContext error:', e);
    }
  }

  function stopMic(containerId) {
    var data = lipSyncData[containerId];
    if (!data) return;
    if (data.stream) { data.stream.getTracks().forEach(function(t) { t.stop(); }); data.stream = null; }
    if (data.audioCtx) { data.audioCtx.close(); data.audioCtx = null; }
    data.analyser = null;
    data.active = false;
    data.smoothVol = 0;
    var container = document.querySelector('[data-id="' + containerId + '"]');
    if (container) container.removeAttribute('data-mic');
  }

  function runLipSync(containerId) {
    var data = lipSyncData[containerId];
    if (!data || !data.active) return;
    var buf = new Uint8Array(data.analyser.frequencyBinCount);
    data.analyser.getByteFrequencyData(buf);
    var sum = 0;
    for (var i = 0; i < buf.length; i++) sum += buf[i];
    var avg = sum / buf.length / 255;
    data.smoothVol = data.smoothVol * 0.7 + avg * 0.3;

    var cache = appCache[containerId];
    if (cache && cache.model && cache.model.internalModel && cache.model.internalModel.coreModel) {
      try {
        cache.model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', Math.min(1, data.smoothVol * 3));
      } catch(e) {}
    }
    requestAnimationFrame(function() { runLipSync(containerId); });
  }

  // ======== 模型切换 ========
  window.setLive2dModel = function(containerId, modelKey) {
    var container = document.querySelector('[data-id="' + containerId + '"], .live2d-viewer');
    if (container) container.setAttribute('data-model', modelKey);
  };

  // ======== 扫描并初始化所有容器 ========
  function scanAndInit() {
    var viewers = document.querySelectorAll('.live2d-viewer');
    console.log('[Live2D] Scanning for viewers, found:', viewers.length);
    for (var i = 0; i < viewers.length; i++) {
      (function(el) {
        setTimeout(function() { initViewer(el); }, 100);
      })(viewers[i]);
    }
  }

  // ======== 设置 MutationObserver 监听动态添加的容器 ========
  function setupObserver() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('live2d-viewer')) {
              (function(el) {
                setTimeout(function() { initViewer(el); }, 100);
              })(node);
            }
            var nested = node.querySelectorAll ? node.querySelectorAll('.live2d-viewer') : [];
            for (var k = 0; k < nested.length; k++) {
              (function(el) { setTimeout(function() { initViewer(el); }, 100); })(nested[k]);
            }
          }
        }
      }
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      console.log('[Live2D] MutationObserver active');
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // ======== 启动 ========
  waitForLibs(function() {
    console.log('[Live2D] Libraries ready, setting up...');
    setupObserver();
    scanAndInit();
    // 持续扫描：Flutter 可能延迟创建容器
    var scanInterval = setInterval(function() {
      var viewers = document.querySelectorAll('.live2d-viewer');
      var allDone = true;
      for (var i = 0; i < viewers.length; i++) {
        if (!initializedContainers.has(viewers[i])) {
          allDone = false;
          initViewer(viewers[i]);
        }
      }
      if (allDone && viewers.length > 0) {
        clearInterval(scanInterval);
      }
    }, 1000);
    // 最多扫描 60 秒
    setTimeout(function() { clearInterval(scanInterval); }, 60000);
  });

  console.log('[Live2D] Loader script complete');
})();