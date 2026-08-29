export interface PetData {
  exp: number;
  hunger: number;
  mood: number;
  level: number;
  coins: number;
  lastActiveDate: string;
  checkInStreak: number;
  learnedWords: string[];
  petName: string;
  totalStudyTime: number;       // 总学习分钟数
  quizCorrect: number;          // 测验正确数
  quizTotal: number;            // 测验总数
  achievements: string[];       // 已获得的成就
  petColor: string;             // 宠物颜色主题
  voiceSpeed: number;           // 语音速度 0.5-2.0
}

const STORAGE_KEY = "bella_pet_data";

const DEFAULT_PET: PetData = {
  exp: 0,
  hunger: 80,
  mood: 80,
  level: 1,
  coins: 0,
  lastActiveDate: "",
  checkInStreak: 0,
  learnedWords: [],
  petName: "Bella",
  totalStudyTime: 0,
  quizCorrect: 0,
  quizTotal: 0,
  achievements: [],
  petColor: "pink",
  voiceSpeed: 1.0,
};

export function loadPetData(): PetData {
  if (typeof window === "undefined") return { ...DEFAULT_PET };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...DEFAULT_PET, ...data };
    }
  } catch (e) {
    console.warn("Failed to load pet data:", e);
  }
  return { ...DEFAULT_PET };
}

export function savePetData(data: PetData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save pet data:", e);
  }
}

export function addExp(data: PetData, amount: number): PetData {
  const updated = { ...data, exp: data.exp + amount };
  // 升级检查：每 100 exp 升一级
  const expNeeded = data.level * 100;
  if (updated.exp >= expNeeded) {
    updated.exp -= expNeeded;
    updated.level += 1;
  }
  return updated;
}

export function feedPet(data: PetData): PetData {
  return {
    ...data,
    hunger: Math.min(100, data.hunger + 20),
    mood: Math.min(100, data.mood + 5),
  };
}

export function playWithPet(data: PetData): PetData {
  const updated = addExp(data, 15);
  return {
    ...updated,
    mood: Math.min(100, data.mood + 15),
    hunger: Math.max(0, data.hunger - 5),
  };
}

export function studyWithPet(data: PetData, word: string): PetData {
  const updated = addExp(data, 30);
  const words = updated.learnedWords.includes(word)
    ? updated.learnedWords
    : [...updated.learnedWords, word];
  return {
    ...updated,
    mood: Math.min(100, data.mood + 10),
    hunger: Math.max(0, data.hunger - 3),
    coins: data.coins + 5,
    learnedWords: words,
  };
}

export function dailyCheckIn(data: PetData): { data: PetData; reward: string } {
  const today = new Date().toISOString().split("T")[0];
  if (data.lastActiveDate === today) {
    return { data, reward: "今天已经签到过了！" };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const isStreak = data.lastActiveDate === yesterday;
  const newStreak = isStreak ? data.checkInStreak + 1 : 1;
  const bonus = Math.min(newStreak, 7) * 10;

  const updated = addExp(data, 20 + bonus);
  updated.coins += 10 + bonus;
  updated.checkInStreak = newStreak;
  updated.lastActiveDate = today;

  const msg = isStreak
    ? `连续签到 ${newStreak} 天！获得 ${20 + bonus} 经验 + ${10 + bonus} 金币！`
    : `签到成功！获得 ${20 + bonus} 经验 + ${10 + bonus} 金币！`;

  return { data: updated, reward: msg };
}

export function getMoodEmoji(mood: number): string {
  if (mood >= 80) return "😄";
  if (mood >= 60) return "🙂";
  if (mood >= 40) return "😐";
  if (mood >= 20) return "😢";
  return "😭";
}

export function getHungerEmoji(hunger: number): string {
  if (hunger >= 80) return "😋";
  if (hunger >= 60) return "🙂";
  if (hunger >= 40) return "😶";
  if (hunger >= 20) return "😰";
  return "🫠";
}

// ===== 成就系统 =====
export const ACHIEVEMENTS: { id: string; name: string; icon: string; desc: string; check: (data: PetData) => boolean }[] = [
  { id: "first_learn", name: "初学乍练", icon: "📖", desc: "学习第一个单词", check: (d) => d.learnedWords.length >= 1 },
  { id: "ten_words", name: "初露锋芒", icon: "🌟", desc: "学会10个单词", check: (d) => d.learnedWords.length >= 10 },
  { id: "all_words", name: "学富五车", icon: "🏆", desc: "学会所有单词", check: (d) => d.learnedWords.length >= 20 },
  { id: "level_5", name: "小有成就", icon: "⭐", desc: "达到5级", check: (d) => d.level >= 5 },
  { id: "level_10", name: "宠物大师", icon: "👑", desc: "达到10级", check: (d) => d.level >= 10 },
  { id: "streak_7", name: "坚持不懈", icon: "🔥", desc: "连续签到7天", check: (d) => d.checkInStreak >= 7 },
  { id: "quiz_master", name: "测验达人", icon: "🎯", desc: "正确回答10道题", check: (d) => d.quizCorrect >= 10 },
  { id: "rich_pet", name: "腰缠万贯", icon: "💰", desc: "拥有100金币", check: (d) => d.coins >= 100 },
  { id: "study_hour", name: "学海无涯", icon: "⏰", desc: "累计学习30分钟", check: (d) => d.totalStudyTime >= 30 },
  { id: "happy_pet", name: "快乐宠物", icon: "😄", desc: "心情值达到100", check: (d) => d.mood >= 100 },
];

export function checkAchievements(data: PetData): { newAchievements: string[]; updated: PetData } {
  const newOnes: string[] = [];
  let updated = { ...data };
  for (const ach of ACHIEVEMENTS) {
    if (!updated.achievements.includes(ach.id) && ach.check(updated)) {
      newOnes.push(ach.id);
      updated.achievements = [...updated.achievements, ach.id];
      updated.coins += 20; // 成就奖励金币
    }
  }
  return { newAchievements: newOnes, updated };
}

// 给宠物洗澡
export function bathePet(data: PetData): PetData {
  return {
    ...data,
    mood: Math.min(100, data.mood + 10),
  };
}

// 宠物睡觉（恢复心情）
export function sleepPet(data: PetData): PetData {
  return {
    ...data,
    mood: Math.min(100, data.mood + 20),
    hunger: Math.max(0, data.hunger - 5),
  };
}

// 记录测验结果
export function recordQuizResult(data: PetData, correct: boolean): PetData {
  const updated = { ...data, quizTotal: data.quizTotal + 1 };
  if (correct) {
    updated.quizCorrect = data.quizCorrect + 1;
    updated.coins += 3;
  }
  return updated;
}

// 记录学习时间
export function addStudyTime(data: PetData, minutes: number): PetData {
  return { ...data, totalStudyTime: data.totalStudyTime + minutes };
}

// 获取等级所需经验
export function expForLevel(level: number): number {
  return level * 100;
}

// 获取等级称号
export function getLevelTitle(level: number): string {
  if (level >= 10) return "宠物大师";
  if (level >= 7) return "资深饲养员";
  if (level >= 5) return "优秀伙伴";
  if (level >= 3) return "初级饲养员";
  return "新手主人";
}