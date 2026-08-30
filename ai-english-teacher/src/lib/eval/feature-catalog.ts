/**
 * 功能目录（机器可读）— AI 开发与评测的单一事实源
 *
 * 新增功能时：先加本文件一条，再写测试，再改 UI。
 * 评测分数见 docs/EVALUATION.md；人类可读清单见 docs/FEATURES.md。
 */

export type FeatureStatus = "ok" | "partial" | "broken" | "placeholder";

export interface FeatureCase {
  id: string;
  name: string;
  tab: "home" | "pet" | "study" | "settings" | "global";
  voicePhrases: string[];
  expected: {
    intent?: string | string[];
    studySection?: string;
    navigate?: "home" | "pet" | "study" | "settings";
    minReplyLen?: number;
  };
  tapFallback: boolean;
  offline: boolean;
  status: FeatureStatus;
  notes?: string;
}

export const FEATURE_CASES: FeatureCase[] = [
  // —— 全局 ——
  {
    id: "help.list",
    name: "帮助 / 指令列表",
    tab: "global",
    voicePhrases: ["帮助", "你能做什么", "怎么用"],
    expected: { intent: "help", minReplyLen: 20 },
    tapFallback: false,
    offline: true,
    status: "ok",
  },
  {
    id: "nav.home",
    name: "回首页",
    tab: "global",
    voicePhrases: ["回首页", "去首页"],
    expected: { intent: "nav_home", navigate: "home" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "nav.pet",
    name: "看宠物",
    tab: "global",
    voicePhrases: ["看宠物", "去宠物"],
    expected: { intent: "nav_pet", navigate: "pet" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "nav.settings",
    name: "打开设置",
    tab: "global",
    voicePhrases: ["打开设置", "设置页", "知识库", "打开知识库"],
    expected: { intent: "nav_settings", navigate: "settings" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "nav.study",
    name: "开始学习",
    tab: "global",
    voicePhrases: ["开始学习", "学习页"],
    expected: { navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },

  // —— 英语 ——
  {
    id: "english.words",
    name: "英语单词 / 学英语",
    tab: "study",
    voicePhrases: ["学英语"],
    expected: { studySection: "english.words", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "dict.en",
    name: "英译中查词",
    tab: "study",
    voicePhrases: ["apple什么意思"],
    expected: { intent: "dict_hit", studySection: "english.words" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "dict.zh",
    name: "中译英查词",
    tab: "study",
    voicePhrases: ["书本用英语怎么说"],
    expected: { intent: "dict_hit", studySection: "english.words" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "english.daily",
    name: "每日英语",
    tab: "study",
    voicePhrases: ["每日英语", "来句英语"],
    expected: { intent: "english_daily", studySection: "english.sentence", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "partial",
    notes: "有网络走 API，失败回内置 4 句；点击子 Tab 走本地 grade1 句库",
  },
  {
    id: "study.quiz",
    name: "单词测验",
    tab: "study",
    voicePhrases: ["测验", "考我"],
    expected: { intent: "quiz", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "partial",
    notes: "语音只回复文字，不自动进入 StudyCards 测验 UI",
  },

  // —— 语文 ——
  {
    id: "chinese.hanzi",
    name: "汉字",
    tab: "study",
    voicePhrases: ["汉字", "认字"],
    expected: { studySection: "chinese.hanzi", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "chinese.pinyin",
    name: "拼音",
    tab: "study",
    voicePhrases: ["拼音", "学拼音"],
    expected: { studySection: "chinese.pinyin", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "chinese.sentence",
    name: "中文句子",
    tab: "study",
    voicePhrases: ["读句子"],
    expected: { studySection: "chinese.sentence", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "chinese.poetry",
    name: "古诗",
    tab: "study",
    voicePhrases: ["背古诗", "读古诗"],
    expected: { intent: "poetry", studySection: "chinese.poetry" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "chinese.idiom",
    name: "成语",
    tab: "study",
    voicePhrases: ["成语", "讲成语"],
    expected: { studySection: "chinese.idiom", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "chinese.quote",
    name: "美句",
    tab: "study",
    voicePhrases: ["美句", "来句美句"],
    expected: { intent: "hitokoto", studySection: "chinese.quote" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },

  // —— 数学 ——
  {
    id: "math.drill",
    name: "口算练习",
    tab: "study",
    voicePhrases: ["口算", "算一算"],
    expected: { studySection: "math.drill", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "math.calc",
    name: "自由口算问答",
    tab: "study",
    voicePhrases: ["1加1等于几"],
    expected: { intent: "math_calc" },
    tapFallback: false,
    offline: true,
    status: "ok",
  },
  {
    id: "math.word-problem",
    name: "应用题",
    tab: "study",
    voicePhrases: ["应用题"],
    expected: { studySection: "math.word-problem", navigate: "study" },
    tapFallback: true,
    offline: true,
    status: "broken",
    notes: "能出题，语音说答案不会判对错",
  },

  // —— 阅读 ——
  {
    id: "reading.story",
    name: "讲故事",
    tab: "study",
    voicePhrases: ["讲故事", "故事"],
    expected: { intent: "story", studySection: "reading.story" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "reading.joke",
    name: "讲笑话",
    tab: "study",
    voicePhrases: ["讲笑话", "笑话"],
    expected: { intent: "joke", studySection: "reading.joke" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },

  // —— 探索 ——
  {
    id: "explore.weather",
    name: "天气",
    tab: "study",
    voicePhrases: ["北京天气"],
    expected: { intent: "weather", studySection: "explore.weather" },
    tapFallback: true,
    offline: false,
    status: "partial",
    notes: "依赖 Open-Meteo；点击 Tab 只显示提示不自动查询",
  },
  {
    id: "explore.wiki",
    name: "百科",
    tab: "study",
    voicePhrases: ["猫是什么", "什么是恐龙"],
    expected: { intent: "wiki", studySection: "explore.wiki", minReplyLen: 10 },
    tapFallback: true,
    offline: true,
    status: "ok",
  },

  // —— 宠物 ——
  {
    id: "pet.feed",
    name: "喂食",
    tab: "pet",
    voicePhrases: ["喂食"],
    expected: { intent: "feed_pet" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "pet.play",
    name: "玩耍",
    tab: "pet",
    voicePhrases: ["陪我玩"],
    expected: { intent: "play_pet" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "pet.bathe",
    name: "洗澡",
    tab: "pet",
    voicePhrases: ["洗澡"],
    expected: { intent: "bathe" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "pet.sleep",
    name: "睡觉",
    tab: "pet",
    voicePhrases: ["睡觉"],
    expected: { intent: "sleep" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "study.checkin",
    name: "签到",
    tab: "home",
    voicePhrases: ["签到", "打卡"],
    expected: { intent: "checkin" },
    tapFallback: true,
    offline: true,
    status: "ok",
  },
  {
    id: "pet.dressup",
    name: "装扮",
    tab: "pet",
    voicePhrases: ["装扮"],
    expected: { intent: "dressup" },
    tapFallback: false,
    offline: true,
    status: "placeholder",
    notes: "仅文字「开发中」",
  },

  // —— 闲聊 ——
  {
    id: "kb.manage",
    name: "知识库入口",
    tab: "settings",
    voicePhrases: ["知识库"],
    expected: { intent: "nav_settings", navigate: "settings" },
    tapFallback: true,
    offline: true,
    status: "partial",
    notes: "设置来源勾选 + /kb 粘贴预览；写入用邮箱口令接 Supabase",
  },
  {
    id: "chat.greeting",
    name: "打招呼",
    tab: "global",
    voicePhrases: ["你好"],
    expected: { intent: "greeting" },
    tapFallback: false,
    offline: true,
    status: "ok",
  },
];

export function featureStats() {
  const total = FEATURE_CASES.length;
  const byStatus = FEATURE_CASES.reduce(
    (acc, f) => {
      acc[f.status] += 1;
      return acc;
    },
    { ok: 0, partial: 0, broken: 0, placeholder: 0 } as Record<FeatureStatus, number>
  );
  return { total, ...byStatus };
}
