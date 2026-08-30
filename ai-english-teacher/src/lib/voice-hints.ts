import { parseStudySection, type StudySubject } from "@/lib/study-nav";
import { getKb } from "@/lib/kb/store";

/** 各学习分区语音指令引导（section = subject.sub） */
export const SECTION_VOICE_HINTS: Record<string, string> = {
  // 英语
  "english.words":
    "说「apple什么意思」查英文 ·「书本用英语怎么说」中译英 ·「换一批单词」刷新",
  "english.sentence": "说「每日英语」听句子 · 说完可点 🔊 或说「朗读」",

  // 语文
  "chinese.pinyin": "说「拼音」学韵母 · 点 🔊 听例句 · 说「换一个」换字",
  "chinese.hanzi": "说「汉字」认字 · 点 🔊 听例句 · 说「换一个」换字",
  "chinese.sentence": "说「读句子」· 点 🔊 朗读 · 说「换一个」换句",
  "chinese.poetry": "说「背古诗」或「读古诗」· 点 🔊 · 说「换一首」",
  "chinese.story": "说「讲故事」· 点 🔊 朗读 · 说「换一个」换篇",
  "chinese.idiom": "说「成语」学成语 · 点 🔊 · 说「换一个」",
  "chinese.quote": "说「美句」或「来句美句」· 点 🔊 朗读",

  // 数学
  "math.drill": "说「口算」开始 · 直接说数字或「答案是8」· 键盘点确定提交",
  "math.word-problem": "听题后语音说答案 · 或说「答案是几」",

  // 阅读
  "reading.story": "说「讲故事」或「故事」· 点 🔊 · 说「朗读」再听一遍",
  "reading.joke": "说「讲笑话」· 点 🔊 · 说「换一个」",

  // 探索
  "explore.weather": "说「北京天气」「今天几度」",
  "explore.wiki": "说「猫是什么」「什么是恐龙」查百科",
};

const SUBJECT_FALLBACK: Record<StudySubject, string> = {
  english: "说「学英语」「apple什么意思」「书本用英语怎么说」",
  chinese: "说「汉字」「背古诗」「读句子」「成语」",
  math: "说「口算」练计算 ·「1加1等于几」",
  reading: "说「讲故事」「讲笑话」",
  explore: "说「北京天气」或「猫是什么」",
};

/** Tab 页级引导（非学习页） */
export const TAB_VOICE_HINTS: Record<string, string> = {
  home: "说「汉字」「口算」「讲故事」直达学习 ·「喂食」「玩耍」互动宠物 ·「帮助」看全部指令",
  pet: "说「喂食」「陪我玩」「洗澡」「睡觉」· 戳猫也会回应",
  study: "先选上方学科，再按下方提示说话 · 说「帮助」查看全部",
  settings: "说「打开设置」到此页 · 可调语速 · 知识库可导入单词和故事",
};

export function getVoiceHintForSection(studySection: string): string {
  const override = getKb().hints?.[studySection];
  if (override) return override;

  const exact = SECTION_VOICE_HINTS[studySection];
  if (exact) return exact;

  const { subject } = parseStudySection(studySection);
  return SUBJECT_FALLBACK[subject] ?? TAB_VOICE_HINTS.study;
}

/** 子 Tab 悬停/辅助说明（短） */
export const SUB_TAB_VOICE_TIPS: Record<string, string> = {
  words: "查词",
  sentence: "每日英语",
  pinyin: "拼音",
  hanzi: "汉字",
  poetry: "古诗",
  story: "故事",
  idiom: "成语",
  quote: "美句",
  drill: "口算",
  "word-problem": "应用题",
  joke: "笑话",
  weather: "天气",
  wiki: "百科",
};
