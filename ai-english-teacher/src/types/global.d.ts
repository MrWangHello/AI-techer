// Web Speech API（部分浏览器仅提供 webkit 前缀）
interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}