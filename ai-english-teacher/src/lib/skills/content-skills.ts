import type { AgentResponse, AsyncSkill } from "@/lib/core/types";
import { fetchDailyEnglish } from "@/lib/providers/daily-english";
import { lookupWord } from "@/lib/providers/iciba";
import { fetchRandomPoem } from "@/lib/providers/poetry";
import { fetchWeather } from "@/lib/providers/weather";
import { fetchWikiSummary } from "@/lib/providers/wiki";
import { fetchHitokoto, pickRandomJoke, pickRandomStory } from "@/lib/providers/local-content";

function failReply(intent: string, fallback: string): AgentResponse {
  return {
    intent,
    emotion: "thinking",
    action: "none",
    reply: fallback,
  };
}

/** 异步内容 Skill：调免费 API 或本地 JSON */
export const ASYNC_SKILLS: AsyncSkill[] = [
  {
    id: "english.daily",
    keywords: [
      "每日英语",
      "每人英语",
      "来句英语",
      "英语句子",
      "今日英语",
      "一句英语",
      "每日一句",
      "英语每日",
    ],
    execute: async () => {
      try {
        const d = await fetchDailyEnglish();
        const suffix = d.source === "builtin" ? "（离线句库）" : "";
        return {
          intent: "english_daily",
          emotion: "happy",
          action: "none",
          reply: `${d.content} ${d.note}${suffix}`,
        };
      } catch {
        return failReply("english_daily", "每日英语暂时拉不到，稍后再试~");
      }
    },
  },
  {
    id: "poetry.random",
    keywords: ["古诗", "诗词", "背诗", "来首诗", "唐诗", "宋词", "换一首", "再来一首", "下一首"],
    execute: async () => {
      try {
        const p = await fetchRandomPoem();
        return {
          intent: "poetry",
          emotion: "thinking",
          action: "none",
          reply: `《${p.title}》${p.author}：${p.content}`,
        };
      } catch {
        return failReply("poetry", "诗词服务暂时不可用，试试说「每日英语」？");
      }
    },
  },
  {
    id: "weather.query",
    keywords: ["天气", "weather", "几度", "气温", "下雨", "下雪"],
    execute: async (text) => {
      try {
        const summary = await fetchWeather(text);
        return {
          intent: "weather",
          emotion: "neutral",
          action: "none",
          reply: summary,
        };
      } catch {
        return failReply("weather", "天气查询失败了，你可以说「北京天气」再试~");
      }
    },
  },
  {
    id: "wiki.query",
    keywords: ["百科", "维基", "是什么", "是谁", "介绍一下", "什么是"],
    execute: async (text) => {
      try {
        const summary = await fetchWikiSummary(text);
        if (!summary) {
          return failReply("wiki", "百科里没找到相关内容，换个说法试试？");
        }
        return {
          intent: "wiki",
          emotion: "thinking",
          action: "none",
          reply: summary,
        };
      } catch {
        return failReply("wiki", "百科查询暂时不可用~");
      }
    },
  },
  {
    id: "hitokoto.quote",
    keywords: ["一言", "美句", "名言", "来句话"],
    execute: async () => {
      try {
        const line = await fetchHitokoto("i");
        return {
          intent: "hitokoto",
          emotion: "happy",
          action: "none",
          reply: line,
        };
      } catch {
        return failReply("hitokoto", "一言服务暂时不可用~");
      }
    },
  },
  {
    id: "joke.tell",
    keywords: ["笑话", "讲笑话", "讲个笑话", "搞笑", "joke", "乐一下", "换一个笑话", "再来一个笑话"],
    execute: async () => ({
      intent: "joke",
      emotion: "happy",
      action: "none",
      reply: pickRandomJoke(),
    }),
  },
  {
    id: "story.tell",
    keywords: ["故事", "讲故事", "story", "童话", "小故事", "换一篇故事", "换一个故事", "再来一个故事"],
    execute: async () => ({
      intent: "story",
      emotion: "happy",
      action: "none",
      reply: pickRandomStory(),
    }),
  },
  {
    id: "english.lookup",
    keywords: ["什么意思", "翻译", "释义"],
    execute: async (text, normalized) => {
      const enMatch = text.match(/[a-zA-Z]{2,}/);
      const word = enMatch?.[0] ?? normalized.replace(/什么意思|翻译|释义/g, "");
      if (!word || word.length < 2) {
        return failReply("english_lookup", "你想查哪个英文单词？比如说「apple 什么意思」");
      }
      try {
        const mean = await lookupWord(word);
        if (!mean) {
          return failReply("english_lookup", `没找到 ${word} 的释义，换个词试试？`);
        }
        return {
          intent: "english_lookup",
          emotion: "thinking",
          action: "none",
          reply: `${word}：${mean}`,
        };
      } catch {
        return failReply("english_lookup", "词典查询失败了~");
      }
    },
  },
];

/** 纯英文输入 → 查词（无关键词时也尝试） */
export async function tryEnglishLookup(text: string): Promise<AgentResponse | null> {
  const trimmed = text.trim();
  if (!/^[a-zA-Z\s-]{2,40}$/.test(trimmed)) return null;
  const word = trimmed.split(/\s+/)[0];
  try {
    const mean = await lookupWord(word);
    if (!mean) return null;
    return {
      intent: "english_lookup",
      emotion: "thinking",
      action: "none",
      reply: `${word}：${mean}`,
    };
  } catch {
    return null;
  }
}
