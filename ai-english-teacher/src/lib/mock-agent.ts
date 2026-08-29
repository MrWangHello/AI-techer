// Mock AI Agent - 关键词匹配系统
// 零成本，无需 API Key，后续可替换为真实 LLM

export interface AgentResponse {
  intent: string;
  emotion: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action: "feed" | "play" | "study" | "quiz" | "greeting" | "checkin" | "none";
  reply: string;
}

// 关键词规则
const RULES: { keywords: string[]; response: AgentResponse }[] = [
  {
    keywords: ["你好", "嗨", "hello", "hi", "早安", "下午好", "晚上好"],
    response: {
      intent: "greeting",
      emotion: "happy",
      action: "greeting",
      reply: "你好呀！我是 Bella，你的英语学习小伙伴！今天想学什么呀？",
    },
  },
  {
    keywords: ["喂", "吃", "饿", "feed", "hungry", "hunger"],
    response: {
      intent: "feed_pet",
      emotion: "happy",
      action: "feed",
      reply: "好香呀！谢谢喂我！喵~ 🐱",
    },
  },
  {
    keywords: ["玩", "游戏", "play", "game"],
    response: {
      intent: "play_pet",
      emotion: "happy",
      action: "play",
      reply: "好呀好呀！一起玩！我最喜欢和你玩了！",
    },
  },
  {
    keywords: ["学", "单词", "背书", "study", "learn", "word"],
    response: {
      intent: "study",
      emotion: "thinking",
      action: "study",
      reply: "好的！我们来学英语单词吧！",
    },
  },
  {
    keywords: ["测验", "考试", "考我", "quiz", "test", "exam"],
    response: {
      intent: "quiz",
      emotion: "surprised",
      action: "quiz",
      reply: "准备好测验了吗？我来考考你！",
    },
  },
  {
    keywords: ["签到", "打卡", "checkin", "check"],
    response: {
      intent: "checkin",
      emotion: "happy",
      action: "checkin",
      reply: "签到成功！要继续加油哦！",
    },
  },
  {
    keywords: ["换", "装扮", "衣服", "dress", "wear", "accessory"],
    response: {
      intent: "dressup",
      emotion: "happy",
      action: "none",
      reply: "装扮功能还在开发中哦，敬请期待！",
    },
  },
  {
    keywords: ["无聊", "没意思", "bored"],
    response: {
      intent: "cheer_up",
      emotion: "happy",
      action: "play",
      reply: "不要无聊嘛！来学个单词开心一下！",
    },
  },
  {
    keywords: ["bye", "再见", "拜拜", "回头见"],
    response: {
      intent: "goodbye",
      emotion: "happy",
      action: "none",
      reply: "拜拜！下次再来找我玩哦！",
    },
  },
  {
    keywords: ["谢谢", "thank", "thanks"],
    response: {
      intent: "thanks",
      emotion: "happy",
      action: "none",
      reply: "不客气！和你聊天我很开心！",
    },
  },
];

// 默认回复（没有匹配到关键词时）
const DEFAULT_RESPONSES: AgentResponse[] = [
  {
    intent: "unknown",
    emotion: "neutral",
    action: "none",
    reply: "嗯...我还在学习理解你说的话。要不我们学个单词吧？",
  },
  {
    intent: "unknown",
    emotion: "thinking",
    action: "none",
    reply: "这个我不太懂呢，不过可以教我英语哦！",
  },
  {
    intent: "unknown",
    emotion: "happy",
    action: "none",
    reply: "喵？你说什么呀？要不要试试说'学单词'？",
  },
  {
    intent: "unknown",
    emotion: "neutral",
    action: "none",
    reply: "我有点没听懂，但没关系！一起来学英语吧！",
  },
];

// 处理用户输入
export function processUserInput(input: string): AgentResponse {
  const lower = input.toLowerCase();

  // 遍历规则匹配关键词
  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return { ...rule.response };
      }
    }
  }

  // 无匹配，随机返回默认回复
  return { ...DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)] };
}