/**
 * Live2D Model Renderer using PixiJS + pixi-live2d-display
 * 替换 Three.js 3D 渲染，支持 Live2D 角色（猫宠/人物老师）
 * 
 * 功能:
 * 1. 加载 Live2D 模型（Tororo 白猫 / Koharu 小春）
 * 2. 语音驱动嘴型同步（ParamMouthOpenY）
 * 3. 眼睛追踪鼠标（ParamAngleX/Y）
 * 4. 点击交互触发随机动作
 * 5. 通过 data-anim 属性切换动作
 * 
 * 全局API:
 *   window.initAllLive2DViewers()  - 手动初始化所有容器
 *   window._live2dLoaded           - 全局标记，模型是否已加载过
 */
(function() {
  'use strict';

  window._live2dLoaded = false;
  var initializedContainers = new WeakSet();
  var appCache = {}; // container -> { app, model, config }

  // ======== 模型配置 ========
  var MODELS = {
    tororo: {
      name: 'Tororo 白猫',
      url: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json',
      scale: 0.5,
      offsetY: 200,
      type: 'pet',
    },
    koharu: {
      name: 'Koharu 小春',
      url: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json',
      scale: 0.34,
      offsetY: 150,
      type: 'teacher',
    },
  };

  // ======== 初始化 Live2D 查看器 ========
  function initViewer(container) {
    if (initializedContainers.has(container)) return;
    if (typeof PIXI === 'undefined' || typeof PIXI.live2d === 'undefined') {
      // 库还没加载，稍后重试
      setTimeout(function() { initViewer(container); }, 500);
      return;
    }

    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w === 0 || h === 0) {
      setTimeout(function() { initViewer(container); }, 300);
      return;
    }

    initializedContainers.add(container);

    var modelKey = container.getAttribute('data-model') || 'tororo';
    var config = MODELS[modelKey] || MODELS.tororo;

    // 创建 PixiJS Application
    var app = new PIXI.Application({
      width: w,
      height: h,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    container.appendChild(app.view);

    // 加载模型
    var Live2DModel = PIXI.live2d.Live2DModel;
    Live2DModel.from(config.url, { autoInteract: false })
      .then(function(model) {
        appCache[container.getAttribute('data-id') || container.id || 'default'] = {
          app: app,
          model: model,
          config: config,
        };

        // 自适应缩放和位置 - 确保模型居中显示完整
        positionModel(model, app, config, w, h);

        app.stage.addChild(model);

        // 点击交互
        model.on('pointerdown', function() {
          var motions = model.internalModel.motionManager.definitions;
          if (motions && motions.length > 0) {
            var idx = Math.floor(Math.random() * motions.length);
            model.motion(idx);
          }
          // 触发 Flutter 事件
          container.dispatchEvent(new CustomEvent('live2d-tap', { bubbles: true }));
        });

        // 标记加载完成
        window._live2dLoaded = true;
        container.setAttribute('data-loaded', 'true');
        container.removeAttribute('data-error');
        container.dispatchEvent(new CustomEvent('live2d-loaded', { bubbles: true }));

        // 启动动画循环（嘴型同步）
        startLipSync(container, model);

        // 启动眼睛追踪
        setupEyeTracking(container, app, model);

        // 监听模型切换
        watchModelChanges(container);

        // 监听窗口大小变化
        setupResizeHandler(container, app, model, config);
      })
      .catch(function(err) {
        console.error('Live2D model load error:', err);
        container.setAttribute('data-error', 'true');
        container.dispatchEvent(new CustomEvent('live2d-error', { bubbles: true }));
      });
  }

  // ======== 模型位置自适应（居中全屏） ========
  function positionModel(model, app, config, w, h) {
    // 计算缩放：让模型在容器中居中显示，高度占满80%
    var scaleX = (w / model.width) * config.scale * 2.5;
    var scaleY = (h / model.height) * config.scale * 2.5;
    var scale = Math.min(scaleX, scaleY);

    // 限制最大缩放，防止溢出
    scale = Math.min(scale, 1.2);

    model.scale.set(scale);

    // 居中：模型中心对准容器中心
    var modelW = model.width * scale;
    var modelH = model.height * scale;
    model.x = (w - modelW) / 2;
    model.y = (h - modelH) / 2 + (config.offsetY || 0);

    // 对于宠物模型，让它稍微靠下一点，显示完整
    if (config.type === 'pet') {
      model.y = Math.min(model.y, h - modelH * 0.6);
    }
  }

  // ======== 嘴型同步（基于麦克风音量） ========
  var lipSyncData = {};

  function startLipSync(container, model) {
    var containerId = container.getAttribute('data-id') || container.id || 'default';
    lipSyncData[containerId] = { active: false, smoothVol: 0, audioCtx: null, analyser: null, stream: null };
  }

  function toggleMic(containerId) {
    var data = lipSyncData[containerId];
    if (!data) return;
    if (data.active) {
      stopMic(containerId);
    } else {
      startMic(containerId);
    }
  }

  function startMic(containerId) {
    var data = lipSyncData[containerId];
    if (!data) return;
    if (data.audioCtx) return;
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
          var container = findContainer(containerId);
          if (container) container.setAttribute('data-mic', 'active');
          // 动画循环由外部驱动
        })
        .catch(function(err) {
          console.warn('Mic access denied:', err);
          data.audioCtx = null;
          data.analyser = null;
        });
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  function stopMic(containerId) {
    var data = lipSyncData[containerId];
    if (!data) return;
    if (data.stream) {
      data.stream.getTracks().forEach(function(t) { t.stop(); });
      data.stream = null;
    }
    if (data.audioCtx) {
      data.audioCtx.close();
      data.audioCtx = null;
    }
    data.analyser = null;
    data.active = false;
    data.smoothVol = 0;
    var container = findContainer(containerId);
    if (container) container.removeAttribute('data-mic');
  }

  function findContainer(containerId) {
    return document.querySelector('[data-id="' + containerId + '"], #' + containerId + ', .live2d-viewer');
  }

  // ======== 全局嘴型同步更新循环 ========
  var lipSyncRunning = false;
  function runGlobalLipSync() {
    if (lipSyncRunning) return;
    lipSyncRunning = true;
    function update() {
      var anyActive = false;
      for (var cid in lipSyncData) {
        var data = lipSyncData[cid];
        if (!data || !data.active || !data.analyser) continue;
        anyActive = true;
        var buf = new Uint8Array(data.analyser.frequencyBinCount);
        data.analyser.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i];
        var avg = sum / buf.length / 255;
        data.smoothVol = data.smoothVol * 0.7 + avg * 0.3;

        // 找到对应模型，驱动嘴型
        var container = findContainer(cid);
        if (container) {
          var cache = appCache[container.getAttribute('data-id') || container.id || 'default'];
          if (cache && cache.model && cache.model.internalModel && cache.model.internalModel.coreModel) {
            try {
              var mouthVal = Math.min(1, data.smoothVol * 3);
              cache.model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthVal);
            } catch(e) { /* 忽略 */ }
          }
        }
      }
      if (anyActive) {
        requestAnimationFrame(update);
      } else {
        lipSyncRunning = false;
      }
    }
    update();
  }

  // ======== 眼睛追踪 ========
  function setupEyeTracking(container, app, model) {
    var canvas = app.view;
    canvas.addEventListener('mousemove', function(e) {
      if (!model.internalModel || !model.internalModel.coreModel) return;
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      try {
        var angleX = (x - 0.5) * 60;
        var angleY = (y - 0.5) * 30;
        model.internalModel.coreModel.setParameterValueById('ParamAngleX', angleX);
        model.internalModel.coreModel.setParameterValueById('ParamAngleY', angleY);
      } catch(e) { /* 忽略 */ }
    });
  }

  // ======== 监听模型切换 ========
  function watchModelChanges(container) {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-model') {
          var newModel = container.getAttribute('data-model');
          switchModel(container, newModel);
        }
      }
    });
    observer.observe(container, { attributes: true, attributeFilter: ['data-model'] });
  }

  function switchModel(container, key) {
    var config = MODELS[key];
    if (!config) return;
    var cache = appCache[container.getAttribute('data-id') || container.id || 'default'];
    if (!cache) return;
    var oldModel = cache.model;
    if (oldModel) {
      cache.app.stage.removeChild(oldModel);
      oldModel.destroy();
    }
    cache.config = config;
    var Live2DModel = PIXI.live2d.Live2DModel;
    Live2DModel.from(config.url, { autoInteract: false })
      .then(function(model) {
        cache.model = model;
        var w = container.clientWidth || cache.app.screen.width;
        var h = container.clientHeight || cache.app.screen.height;
        positionModel(model, cache.app, config, w, h);
        cache.app.stage.addChild(model);
        model.on('pointerdown', function() {
          var motions = model.internalModel.motionManager.definitions;
          if (motions && motions.length > 0) {
            var idx = Math.floor(Math.random() * motions.length);
            model.motion(idx);
          }
          container.dispatchEvent(new CustomEvent('live2d-tap', { bubbles: true }));
        });
        setupEyeTracking(container, cache.app, model);
        container.setAttribute('data-loaded', 'true');
        container.dispatchEvent(new CustomEvent('live2d-loaded', { bubbles: true }));
      });
  }

  // ======== 窗口自适应 ========
  function setupResizeHandler(container, app, model, config) {
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function() {
        var w = container.clientWidth;
        var h = container.clientHeight;
        if (w > 0 && h > 0) {
          app.renderer.resize(w, h);
          positionModel(model, app, config, w, h);
        }
      });
      ro.observe(container);
    }
  }

  // ======== 公开 API ========
  window.toggleLive2dMic = function(containerId) {
    var data = lipSyncData[containerId];
    if (!data) {
      // 如果没有初始化，尝试从容器获取
      var container = document.querySelector('[data-id="' + containerId + '"], .live2d-viewer');
      if (container) {
        initViewer(container);
        startLipSync(container, null);
        // 延迟启动
        setTimeout(function() { toggleMic(containerId); }, 500);
      }
      return;
    }
    toggleMic(containerId);
    runGlobalLipSync();
  };

  window.setLive2dModel = function(containerId, modelKey) {
    var container = document.querySelector('[data-id="' + containerId + '"], .live2d-viewer');
    if (container) {
      container.setAttribute('data-model', modelKey);
    }
  };

  window.getLive2dModelName = function() {
    var container = document.querySelector('.live2d-viewer');
    if (container) {
      var key = container.getAttribute('data-model') || 'tororo';
      var config = MODELS[key];
      return config ? config.name : 'Tororo 白猫';
    }
    return 'Tororo 白猫';
  };

  // ======== 初始化所有查看器 ========
  function initAll() {
    var viewers = document.querySelectorAll('.live2d-viewer');
    for (var i = 0; i < viewers.length; i++) {
      (function(el) {
        // 设置唯一 ID
        if (!el.id && !el.getAttribute('data-id')) {
          el.setAttribute('data-id', 'live2d-' + i);
        }
        setTimeout(function() { initViewer(el); }, 300);
      })(viewers[i]);
    }
  }

  window.initAllLive2DViewers = initAll;

  // 等 DOM 准备好后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initAll, 500); });
  } else {
    setTimeout(initAll, 500);
  }

  // MutationObserver 检测动态添加的 .live2d-viewer 容器
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('live2d-viewer')) {
              setTimeout(function() { initViewer(node); }, 100);
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
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }
})();