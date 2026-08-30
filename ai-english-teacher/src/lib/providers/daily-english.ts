export interface DailyEnglish {
  content: string;
  note: string;
  source: string;
}

const BUILTIN: DailyEnglish[] = [
  {
    content: "The best time to plant a tree was 20 years ago. The second best time is now.",
    note: "种一棵树最好的时间是二十年前，其次是现在。",
    source: "builtin",
  },
  {
    content: "Practice makes perfect.",
    note: "熟能生巧。",
    source: "builtin",
  },
  {
    content: "Where there is a will, there is a way.",
    note: "有志者，事竟成。",
    source: "builtin",
  },
  {
    content: "Every day is a new beginning.",
    note: "每一天都是新的开始。",
    source: "builtin",
  },
];

function pickBuiltin(): DailyEnglish {
  const day = new Date().getDate();
  return BUILTIN[day % BUILTIN.length];
}

/** 扇贝 — 浏览器 CORS 友好（词霸 dsapi 缺 Allow-Origin，手机端常会失败） */
async function fetchShanbayDaily(): Promise<DailyEnglish> {
  const res = await fetch("https://apiv3.shanbay.com/weapps/dailyquote/quote", {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`shanbay: ${res.status}`);
  const data = await res.json();
  return {
    content: data.content ?? "",
    note: data.translation ?? "",
    source: "shanbay",
  };
}

/** 一言英文句 — CORS * */
async function fetchHitokotoDaily(): Promise<DailyEnglish> {
  const res = await fetch("https://v1.hitokoto.cn/?c=k", {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`hitokoto: ${res.status}`);
  const data = await res.json();
  const note = data.from ? `——${data.from}` : "";
  return {
    content: data.hitokoto ?? "",
    note,
    source: "hitokoto",
  };
}

/** 词霸 — 服务端可用，但 GitHub Pages 浏览器常因 CORS 失败，作末位备选 */
async function fetchIcibaDaily(): Promise<DailyEnglish> {
  const res = await fetch("https://open.iciba.com/dsapi/", {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`iciba: ${res.status}`);
  const data = await res.json();
  return {
    content: data.content ?? "",
    note: data.note ?? "",
    source: "iciba",
  };
}

/** 多源降级：扇贝 → 一言 → 词霸 → 内置 */
export async function fetchDailyEnglish(): Promise<DailyEnglish> {
  const chain = [fetchShanbayDaily, fetchHitokotoDaily, fetchIcibaDaily];
  for (const fn of chain) {
    try {
      const result = await fn();
      if (result.content.trim()) return result;
    } catch (e) {
      console.warn("[daily-english]", fn.name, e);
    }
  }
  return pickBuiltin();
}
