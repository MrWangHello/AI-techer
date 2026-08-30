// Mock AI Agent - 关键词匹配系统
// 零成本，无需 API Key，后续可替换为真实 LLM

export type TabTarget = "home" | "pet" | "study" | "settings";

export interface AgentResponse {
  intent: string;
  emotion: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action: "feed" | "play" | "study" | "quiz" | "greeting" | "checkin" | "none";
  reply: string;
  navigate?: TabTarget;
}

// 规则按优先级排列：导航 > 学习 > 宠物动作 > 闲聊
const RULES: { keywords: string[]; response: AgentResponse }[] = [
  // P0 导航
  {
    keywords: ["打开设置", "语音设置", "设置页", "settings", "配置", "选项"],
    response: {
      intent: "nav_settings",
      emotion: "neutral",
      action: "none",
      reply: "好的，打开设置页面~",
      navigate: "settings",
    },
  },
  {
    keywords: ["设置"],
    response: {
      intent: "nav_settings",
      emotion: "neutral",
      action: "none",
      reply: "好的，打开设置页面~",
      navigate: "settings",
    },
  },
  {
    keywords: ["回首页", "去首页", "回到首页", "主页", "home", "看看首页"],
    response: {
      intent: "nav_home",
      emotion: "happy",
      action: "none",
      reply: "好的，回到首页~",
      navigate: "home",
    },
  },
  {
    keywords: ["首页"],
    response: {
      intent: "nav_home",
      emotion: "happy",
      action: "none",
      reply: "好的，回到首页~",
      navigate: "home",
    },
  },
  {
    keywords: ["看宠物", "看猫", "看bella", "去宠物", "我的猫", "宠物页", "pet", "猫猫"],
    response: {
      intent: "nav_pet",
      emotion: "happy",
      action: "none",
      reply: "好的，去看看 Bella~",
      navigate: "pet",
    },
  },
  {
    keywords: ["宠物"],
    response: {
      intent: "nav_pet",
      emotion: "happy",
      action: "none",
      reply: "好的，去看看 Bella~",
      navigate: "pet",
    },
  },
  {
    keywords: ["去学习", "学单词", "学英语", "上课", "背单词", "学习页", "study", "learn", "读书"],
    response: {
      intent: "nav_study",
      emotion: "thinking",
      action: "study",
      reply: "好的！我们来学英语单词吧！",
      navigate: "study",
    },
  },
  {
    keywords: ["学习"],
    response: {
      intent: "nav_study",
      emotion: "thinking",
      action: "study",
      reply: "好的！我们来学英语单词吧！",
      navigate: "study",
    },
  },
  // P1 学习 / 系统
  {
    keywords: ["帮助", "你能做什么", "指令", "怎么说", "help", "命令", "怎么用"],
    response: {
      intent: "help",
      emotion: "happy",
      action: "none",
      reply:
        "你可以说：去首页、看宠物、开始学习、打开设置；也可以喂我、陪我玩、洗澡、睡觉、签到，或者随便聊天！",
    },
  },
  {
    keywords: ["测验", "考试", "考我", "quiz", "test", "exam", "做题目"],
    response: {
      intent: "quiz",
      emotion: "surprised",
      action: "quiz",
      reply: "准备好测验了吗？我来考考你！",
      navigate: "study",
    },
  },
  {
    keywords: ["签到", "打卡", "checkin"],
    response: {
      intent: "checkin",
      emotion: "happy",
      action: "checkin",
      reply: "签到成功！要继续加油哦！",
    },
  },
  // P2 宠物动作
  {
    keywords: ["喂食", "feed", "hungry", "hunger"],
    response: {
      intent: "feed_pet",
      emotion: "happy",
      action: "feed",
      reply: "好香呀！谢谢喂我！喵~",
    },
  },
  {
    keywords: ["喂", "吃", "饿"],
    response: {
      intent: "feed_pet",
      emotion: "happy",
      action: "feed",
      reply: "好香呀！谢谢喂我！喵~",
    },
  },
  {
    keywords: ["玩耍", "陪我玩", "play", "game"],
    response: {
      intent: "play_pet",
      emotion: "happy",
      action: "play",
      reply: "好呀好呀！一起玩！",
    },
  },
  {
    keywords: ["玩", "游戏"],
    response: {
      intent: "play_pet",
      emotion: "happy",
      action: "play",
      reply: "好呀好呀！一起玩！",
    },
  },
  {
    keywords: ["洗澡", "bath"],
    response: {
      intent: "bathe",
      emotion: "happy",
      action: "none",
      reply: "洗澡澡，好舒服！",
    },
  },
  {
    keywords: ["洗", "干净", "clean"],
    response: {
      intent: "bathe",
      emotion: "happy",
      action: "none",
      reply: "洗澡澡，好舒服！",
    },
  },
  {
    keywords: ["睡觉", "sleep", "tired", "rest"],
    response: {
      intent: "sleep",
      emotion: "sad",
      action: "none",
      reply: "好的，我休息一下~ 养足精神再陪你学习！",
    },
  },
  {
    keywords: ["睡", "困", "休息"],
    response: {
      intent: "sleep",
      emotion: "sad",
      action: "none",
      reply: "好的，我休息一下~ 养足精神再陪你学习！",
    },
  },
  // P3 单词学习（含单字「学」，放导航规则之后）
  {
    keywords: ["单词", "背书", "word"],
    response: {
      intent: "study",
      emotion: "thinking",
      action: "study",
      reply: "好的！我们来学英语单词吧！",
      navigate: "study",
    },
  },
  {
    keywords: ["学"],
    response: {
      intent: "study",
      emotion: "thinking",
      action: "study",
      reply: "好的！我们来学英语单词吧！",
      navigate: "study",
    },
  },
  // P4 闲聊
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
    keywords: ["谢谢", "thank", "thanks"],
    response: {
      intent: "thanks",
      emotion: "happy",
      action: "none",
      reply: "不客气！和你聊天我很开心！",
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
    keywords: ["名字", "叫什么", "name", "who are you"],
    response: {
      intent: "introduce",
      emotion: "happy",
      action: "greeting",
      reply: "我叫 Bella！是你的英语学习小伙伴！很高兴认识你！",
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
    keywords: ["开心", "高兴", "happy", "glad"],
    response: {
      intent: "cheer_up",
      emotion: "happy",
      action: "play",
      reply: "我也很开心！有你在真好！",
    },
  },
  {
    keywords: ["伤心", "难过", "哭", "sad", "cry"],
    response: {
      intent: "comfort",
      emotion: "sad",
      action: "none",
      reply: "别难过啦~ 我陪你！来学个单词开心一下好不好？",
    },
  },
  {
    keywords: ["唱歌", "歌", "唱", "sing", "song"],
    response: {
      intent: "sing",
      emotion: "happy",
      action: "none",
      reply: "啦啦啦~ 我唱得怎么样？",
    },
  },
  {
    keywords: ["天气", "weather", "冷", "热", "暖"],
    response: {
      intent: "weather",
      emotion: "thinking",
      action: "none",
      reply: "天气很好呢！不过我更关心你今天想学什么英语单词~",
    },
  },
  {
    keywords: ["多少级", "level", "等级", "几级"],
    response: {
      intent: "show_level",
      emotion: "happy",
      action: "none",
      reply: "我现在的等级是通过和你一起学习提升的！要继续加油哦！",
    },
  },
  {
    keywords: ["成就", "勋章", "achievement", "badge"],
    response: {
      intent: "show_achievements",
      emotion: "happy",
      action: "none",
      reply: "去宠物页面可以查看所有成就！你已经很棒了！",
      navigate: "pet",
    },
  },
  {
    keywords: ["换", "装扮", "衣服", "dress", "wear"],
    response: {
      intent: "dressup",
      emotion: "happy",
      action: "none",
      reply: "装扮功能还在开发中哦，敬请期待！",
    },
  },
];

const DEFAULT_RESPONSES: AgentResponse[] = [
  {
    intent: "unknown",
    emotion: "neutral",
    action: "none",
    reply: "嗯...我还在学习理解你说的话。试试说「帮助」查看我能做什么？",
  },
  {
    intent: "unknown",
    emotion: "thinking",
    action: "none",
    reply: "这个我不太懂呢。你可以说「开始学习」或「去首页」~",
  },
  {
    intent: "unknown",
    emotion: "happy",
    action: "none",
    reply: "喵？试试说「帮助」，我来告诉你我能做什么！",
  },
];

function normalizeInput(raw: string): string {
  return raw.toLowerCase().replace(/[，。！？、,.!?'\s]/g, "").trim();
}

export function processUserInput(input: string): AgentResponse {
  const normalized = normalizeInput(input);

  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return { ...rule.response };
      }
    }
  }

  return { ...DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)] };
}
