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