// Live2D Cubism 2.1 Core 全局类型声明
declare const Live2D: {
  init(): void;
  version: string;
};

// PIXI 全局声明
interface Window {
  PIXI: any;
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}