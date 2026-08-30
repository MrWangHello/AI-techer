export type Tab = "home" | "pet" | "study" | "settings";

export const TAB_PINYIN: Record<Tab, string> = {
  home: "shǒu yè",
  pet: "chǒng wù",
  study: "xué xí",
  settings: "shè zhì",
};

export const TAB_TITLES: Record<Tab, string> = {
  home: "🏠 首页",
  pet: "🐱 我的宠物",
  study: "📖 学习中心",
  settings: "⚙️ 设置",
};
