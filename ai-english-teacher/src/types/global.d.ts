// Web Speech API（部分浏览器仅提供 webkit 前缀）
interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

declare module "@piper-plus/g2p/en" {
  export class EnglishG2P {
    phonemize(word: string): { tokens: string[] };
  }
}