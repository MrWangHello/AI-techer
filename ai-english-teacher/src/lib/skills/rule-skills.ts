import type { RuleEntry } from "@/lib/core/types";

/** P0–P4 规则 Skill：导航 / 宠物 / 学习 / 闲聊（同步，零 API） */
export const RULE_SKILLS: RuleEntry[] = [
  // nav.*
  {
    skillId: "nav.settings",
    keywords: ["打开设置", "语音设置", "设置页", "settings", "配置", "选项", "设置"],
    response: {
      intent: "nav_settings",
      emotion: "neutral",
      action: "none",
      reply: "好的，打开设置页面~",
      navigate: "settings",
    },
  },
  {
    skillId: "nav.home",
    keywords: ["回首页", "去首页", "回到首页", "主页", "home", "看看首页", "首页"],
    response: {
      intent: "nav_home",
      emotion: "happy",
      action: "none",
      reply: "好的，回到首页~",
      navigate: "home",
    },
  },
  {
    skillId: "nav.pet",
    keywords: ["看宠物", "看猫", "看bella", "去宠物", "我的猫", "宠物页", "pet", "猫猫", "宠物"],
    response: {
      intent: "nav_pet",
      emotion: "happy",
      action: "none",
      reply: "好的，去看看 Bella~",
      navigate: "pet",
    },
  },
  {
    skillId: "nav.study",
    keywords: ["开始学习", "上课", "学习", "学习页", "study", "learn", "读书"],
    response: {
      intent: "nav_study",
      emotion: "thinking",
      action: "study",
      reply: "好的！想学什么？可以说语文、英语、数学~",
      navigate: "study",
      studySection: "english.words",
    },
  },
  // help
  {
    skillId: "help.list",
    keywords: ["帮助", "你能做什么", "指令", "怎么说", "help", "命令", "怎么用", "功能"],
    response: {
      intent: "help",
      emotion: "happy",
      action: "none",
      reply:
        "你可以说：语文、汉字、拼音、英语、数学、口算、1加1等于几、背古诗、讲成语、讲笑话、天气；也可以：回首页、看宠物、打开设置。说出来我就带你去！",
    },
  },
  // study / quiz
  {
    skillId: "study.quiz",
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
    skillId: "study.checkin",
    keywords: ["签到", "打卡", "checkin"],
    response: {
      intent: "checkin",
      emotion: "happy",
      action: "checkin",
      reply: "签到成功！要继续加油哦！",
    },
  },
  {
    skillId: "word.refresh",
    keywords: [
      "换一批",
      "刷新单词",
      "换单词",
      "再来一批",
      "换一批单词",
      "重新换",
      "换一篇",
      "换一个",
      "下一批",
      "再来一个",
      "重新换词",
      "换一组",
    ],
    response: {
      intent: "word_refresh",
      emotion: "happy",
      action: "study",
      reply: "好的，给你换一批新单词！",
      navigate: "study",
      sideEffect: "word.refresh",
    },
  },
  // pet.*
  {
    skillId: "pet.feed",
    keywords: ["喂食", "feed", "hungry", "hunger", "喂", "吃", "饿"],
    response: {
      intent: "feed_pet",
      emotion: "happy",
      action: "feed",
      reply: "好香呀！谢谢喂我！喵~",
    },
  },
  {
    skillId: "pet.play",
    keywords: ["玩耍", "陪我玩", "play", "game", "玩", "游戏"],
    response: {
      intent: "play_pet",
      emotion: "happy",
      action: "play",
      reply: "好呀好呀！一起玩！",
    },
  },
  {
    skillId: "pet.bathe",
    keywords: ["洗澡", "bath", "洗", "干净", "clean"],
    response: {
      intent: "bathe",
      emotion: "happy",
      action: "none",
      reply: "洗澡澡，好舒服！",
    },
  },
  {
    skillId: "pet.sleep",
    keywords: ["睡觉", "sleep", "tired", "rest", "睡", "困", "休息"],
    response: {
      intent: "sleep",
      emotion: "sad",
      action: "none",
      reply: "好的，我休息一下~ 养足精神再陪你学习！",
    },
  },
  {
    skillId: "study.words",
    keywords: ["单词", "背书", "word", "学"],
    response: {
      intent: "study",
      emotion: "thinking",
      action: "study",
      reply: "好的！我们来学英语单词吧！",
      navigate: "study",
    },
  },
  // chat.*
  {
    skillId: "chat.greeting",
    keywords: ["你好", "嗨", "hello", "hi", "早安", "下午好", "晚上好"],
    response: {
      intent: "greeting",
      emotion: "happy",
      action: "greeting",
      reply: "你好呀！我是 Bella，你的英语学习小伙伴！今天想学什么呀？",
    },
  },
  {
    skillId: "chat.thanks",
    keywords: ["谢谢", "thank", "thanks"],
    response: {
      intent: "thanks",
      emotion: "happy",
      action: "none",
      reply: "不客气！和你聊天我很开心！",
    },
  },
  {
    skillId: "chat.goodbye",
    keywords: ["bye", "再见", "拜拜", "回头见"],
    response: {
      intent: "goodbye",
      emotion: "happy",
      action: "none",
      reply: "拜拜！下次再来找我玩哦！",
    },
  },
  {
    skillId: "chat.introduce",
    keywords: ["名字", "叫什么", "name", "who are you"],
    response: {
      intent: "introduce",
      emotion: "happy",
      action: "greeting",
      reply: "我叫 Bella！是你的英语学习小伙伴！很高兴认识你！",
    },
  },
  {
    skillId: "chat.cheer",
    keywords: ["无聊", "没意思", "bored", "开心", "高兴", "happy", "glad"],
    response: {
      intent: "cheer_up",
      emotion: "happy",
      action: "play",
      reply: "来学个单词或者听个笑话开心一下！",
    },
  },
  {
    skillId: "chat.comfort",
    keywords: ["伤心", "难过", "哭", "sad", "cry"],
    response: {
      intent: "comfort",
      emotion: "sad",
      action: "none",
      reply: "别难过啦~ 我陪你！来学个单词开心一下好不好？",
    },
  },
  {
    skillId: "chat.sing",
    keywords: ["唱歌", "歌", "唱", "sing", "song"],
    response: {
      intent: "sing",
      emotion: "happy",
      action: "none",
      reply: "啦啦啦~ 我唱得怎么样？",
    },
  },
  {
    skillId: "pet.level",
    keywords: ["多少级", "level", "等级", "几级"],
    response: {
      intent: "show_level",
      emotion: "happy",
      action: "none",
      reply: "我现在的等级是通过和你一起学习提升的！要继续加油哦！",
    },
  },
  {
    skillId: "pet.achievements",
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
    skillId: "pet.dressup",
    keywords: ["装扮", "衣服", "dress", "wear"],
    response: {
      intent: "dressup",
      emotion: "happy",
      action: "none",
      reply: "装扮功能还在开发中哦，敬请期待！",
    },
  },
];
