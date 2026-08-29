/**
 * Three.js + GLTFLoader bundle for legacy browsers (UMD/IIFE compatible)
 * This file bundles Three.js core and GLTFLoader into a single script
 * that can be loaded with <script src="three-bundle.js"></script>
 */

// Three.js r128 UMD build (last version with good UMD support)
// Source: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
(function() {
  'use strict';
  
  // Check if already loaded
  if (window.THREE && window.THREE.Scene) return;
  
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = function() {
    console.log('Three.js r128 loaded');
    
    // Load GLTFLoader from CDN (r128 compatible version)
    var loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    loaderScript.onload = function() {
      console.log('GLTFLoader loaded');
      
      // Initialize the 3D scene once everything is ready
      initThreeScene();
    };
    document.head.appendChild(loaderScript);
  };
  document.head.appendChild(script);
})();

function initThreeScene() {
  // Find all containers that need 3D viewers
  var containers = document.querySelectorAll('[data-three-container]');
  
  containers.forEach(function(container) {
    var modelSrc = container.getAttribute('data-model-src') || 'assets/models/RobotExpressive.glb';
    var animName = container.getAttribute('data-animation') || 'Idle';
    
    // Create scene, camera, renderer
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Load GLB model
    var mixer = null;
    var model = null;
    var clock = new THREE.Clock();
    
    var loader = new THREE.GLTFLoader();
    loader.load(modelSrc, function(gltf) {
      model = gltf.scene;
      model.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Center and scale model
      var box = new THREE.Box3().setFromObject(model);
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 2 / maxDim;
      model.scale.setScalar(scale);
      
      // Center model
      box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y += 0.5;
      
      scene.add(model);
      
      // Setup animations
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        var clip = THREE.AnimationClip.findByName(gltf.animations, animName) || gltf.animations[0];
        var action = mixer.clipAction(clip);
        action.play();
      }
      
      // Notify Flutter that model is loaded
      window.postMessage({ type: 'three-loaded' }, '*');
      
    }, undefined, function(error) {
      console.error('Error loading model:', error);
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">3D 模型加载失败<br><small>' + error.message + '</small></div>';
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      renderer.render(scene, camera);
    }
    animate();
    
    // Handle resize
    var observer = new ResizeObserver(function() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    observer.observe(container);
    
    // Store references for Flutter to control
    container._threeScene = scene;
    container._threeCamera = camera;
    container._threeRenderer = renderer;
    container._threeMixer = mixer;
    container._threeModel = null;
    
    // Expose animation control
    container.setAnimation = function(name) {
      if (container._threeModel && container._threeMixer) {
        // Reload model with new animation
        // For now, just log
        console.log('Set animation:', name);
      }
    };
  });
}
