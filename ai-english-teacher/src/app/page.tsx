"use client";

import { useState, useEffect, useCallback } from "react";
import { Home, PawPrint, BookOpen, Settings, RotateCcw } from "lucide-react";
import RealisticCat from "@/components/Cat3D";
import VoiceChatBar from "@/components/VoiceChatBar";
import VoiceReplyBar from "@/components/VoiceReplyBar";
import PetStatus from "@/components/PetStatus";
import StudyPanel from "@/components/StudyPanel";
import {
  loadPetData,
  savePetData,
  feedPet,
  playWithPet,
  studyWithPet,
  dailyCheckIn,
  bathePet,
  sleepPet,
  checkAchievements,
  recordQuizResult,
  addStudyTime,
  getLevelTitle,
  ACHIEVEMENTS,
  PetData,
} from "@/lib/pet-data";
import { speak } from "@/lib/speech";
import { isSpeechSupported, isSTTSupported } from "@/lib/speech";
import { handleUserMessage, AgentResponse } from "@/lib/mock-agent";
import type { ContentCard } from "@/lib/core/types";
import type { MathQuestion } from "@/lib/math/generator";
import { getStreak } from "@/lib/math/drill-state";
import { Word, getAllWords, loadWordBatch, refreshWordBatch } from "@/lib/words";

type Tab = "home" | "pet" | "study" | "settings";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  // 使用默认值初始化（SSR 和客户端第一次渲染一致），useEffect 中再加载 localStorage 数据
  const [pet, setPet] = useState<PetData>({ ...loadPetData() });
  const [petLoaded, setPetLoaded] = useState(false);
  const [agentEmotion, setAgentEmotion] = useState<"happy" | "sad" | "surprised" | "neutral" | "thinking">("neutral");
  const [agentAction, setAgentAction] = useState<"feed" | "play" | "study" | "none">("none");
  const [lastReply, setLastReply] = useState<string>("");
  const [lastUserText, setLastUserText] = useState<string>("");
  const [checkinMsg, setCheckinMsg] = useState<string>("");
  const [achievementMsg, setAchievementMsg] = useState<string>("");
  const [interactionFeed, setInteractionFeed] = useState<{ icon: string; text: string; time: string }[]>([]);
  const [showPetNameInput, setShowPetNameInput] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [editingVoiceSpeed, setEditingVoiceSpeed] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [studyingMinutes, setStudyingMinutes] = useState(0);
  const [catSpeaking, setCatSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [sttSupported, setSttSupported] = useState<boolean | null>(null);
  const [studyWords, setStudyWords] = useState<Word[]>([]);
  const [studySection, setStudySection] = useState("english.words");
  const [contentCard, setContentCard] = useState<ContentCard | null>(null);
  const [mathQuestion, setMathQuestion] = useState<MathQuestion | null>(null);
  const [mathStreak, setMathStreak] = useState(0);

  const speakWithSpeed = useCallback(
    (text: string, onEnd?: () => void) => {
      speak(text, onEnd, pet.voiceSpeed);
    },
    [pet.voiceSpeed]
  );

  // 客户端加载 localStorage 数据，避免 hydration 不匹配
  useEffect(() => {
    setPet(loadPetData());
    setPetLoaded(true);
    setSpeechSupported(isSpeechSupported());
    setSttSupported(isSTTSupported());
    setStudyWords(loadWordBatch());
  }, []);

  // 保存宠物数据（仅在客户端加载后保存）
  useEffect(() => {
    if (petLoaded) {
      savePetData(pet);
    }
  }, [pet, petLoaded]);

  // 学习计时器
  useEffect(() => {
    if (activeTab !== "study") return;
    const interval = setInterval(() => {
      setStudyingMinutes((m) => m + 1);
    }, 60000);
    return () => {
      if (studyingMinutes > 0) {
        setPet((prev) => addStudyTime(prev, studyingMinutes));
      }
      setStudyingMinutes(0);
    };
  }, [activeTab, studyingMinutes]);

  // 添加互动记录
  const addFeed = useCallback((icon: string, text: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setInteractionFeed((prev) => [{ icon, text, time }, ...prev].slice(0, 20));
  }, []);

  // 检查成就
  const checkAndAwardAchievements = useCallback((data: PetData) => {
    const { newAchievements, updated } = checkAchievements(data);
    if (newAchievements.length > 0) {
      const achNames = newAchievements.map((id) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        return ach ? `${ach.icon} ${ach.name}` : id;
      });
      setAchievementMsg(`🎉 获得成就: ${achNames.join(", ")}！奖励金币各 20！`);
      setTimeout(() => setAchievementMsg(""), 5000);
      return updated;
    }
    return data;
  }, []);

  // AI Agent 回复处理
  const handleAgentResponse = useCallback(
    (response: AgentResponse) => {
      setAgentEmotion(response.emotion);
      setAgentAction(response.action as "feed" | "play" | "study" | "none");
      setLastReply(response.reply);

      if (response.navigate) {
        setActiveTab(response.navigate);
      }

      if (response.studySection) {
        setStudySection(response.studySection);
      }

      if (response.contentCard) {
        setContentCard(response.contentCard);
        if (response.contentCard.type === "math-drill") {
          const q = (response.contentCard.payload as { question?: MathQuestion })?.question;
          if (q) setMathQuestion(q);
        }
      }

      if (response.sideEffect === "word.refresh") {
        setStudyWords(refreshWordBatch());
      }

      if (response.intent.startsWith("math_drill")) {
        setMathStreak(getStreak());
      }

      const feedLabel = (icon: string, text: string) => addFeed(icon, text);

      switch (response.intent) {
        case "feed_pet":
          setPet((prev) => {
            const updated = feedPet(prev);
            feedLabel("🍖", "喂食了 Bella");
            return checkAndAwardAchievements(updated);
          });
          break;
        case "play_pet":
          setPet((prev) => {
            const updated = playWithPet(prev);
            feedLabel("🎮", "和 Bella 一起玩");
            return checkAndAwardAchievements(updated);
          });
          break;
        case "hanzi":
        case "pinyin":
        case "sentence":
          feedLabel("📝", "学语文");
          break;
        case "math_calc":
        case "math_drill_start":
        case "math_drill_correct":
          feedLabel("🔢", "数学练习");
          if (response.intent === "math_drill_correct") {
            setPet((prev) => checkAndAwardAchievements({ ...prev, coins: prev.coins + 1 }));
          }
          break;
        case "idiom":
          feedLabel("📜", "学成语");
          break;
        case "poetry":
          feedLabel("📜", "背古诗");
          break;
        case "english_daily":
          feedLabel("🇬🇧", "每日英语");
          break;
        case "joke":
          feedLabel("😄", "讲笑话");
          break;
        case "story":
          feedLabel("📖", "讲故事");
          break;
        case "weather":
          feedLabel("🌤️", "查天气");
          break;
        case "wiki":
          feedLabel("🔍", "查百科");
          break;
        case "study":
        case "nav_study":
          feedLabel("📚", "开始学习");
          break;
        case "checkin":
          setPet((prev) => {
            const result = dailyCheckIn(prev);
            setCheckinMsg(result.reward);
            addFeed("✅", "每日签到");
            return checkAndAwardAchievements(result.data);
          });
          break;
        case "quiz":
          addFeed("📝", "开始单词测验");
          break;
        case "bathe":
          setPet((prev) => {
            const updated = bathePet(prev);
            addFeed("🛁", "给 Bella 洗澡");
            return checkAndAwardAchievements(updated);
          });
          break;
        case "sleep":
          setPet((prev) => {
            const updated = sleepPet(prev);
            addFeed("💤", "Bella 睡觉了");
            return checkAndAwardAchievements(updated);
          });
          break;
        case "greeting":
          addFeed("👋", "和 Bella 打招呼");
          break;
        case "nav_home":
          addFeed("🏠", "回到首页");
          break;
        case "nav_pet":
          addFeed("🐱", "查看宠物");
          break;
        case "nav_settings":
          addFeed("⚙️", "打开设置");
          break;
        case "word_refresh":
          addFeed("🔄", "换一批单词");
          break;
      }
    },
    [addFeed, checkAndAwardAchievements]
  );

  const handleVoiceTranscript = useCallback((text: string) => {
    setLastUserText(text);
  }, []);

  const handleMathAnswer = useCallback(
    (n: number) => {
      void (async () => {
        const response = await handleUserMessage({ text: String(n), channel: "web" });
        handleAgentResponse(response);
        setCatSpeaking(true);
        speakWithSpeed(response.reply, () => setCatSpeaking(false));
      })();
    },
    [handleAgentResponse, speakWithSpeed]
  );

  const goStudy = useCallback((section: string) => {
    setActiveTab("study");
    setStudySection(section);
  }, []);

  // 按钮互动
  const handleFeed = () => {
    setPet((prev) => {
      const updated = feedPet(prev);
      addFeed("🍖", "喂食了 Bella");
      setCatSpeaking(true);
      speakWithSpeed("好香呀！谢谢喂我！喵~", () => setCatSpeaking(false));
      setAgentEmotion("happy");
      return checkAndAwardAchievements(updated);
    });
  };

  const handlePlay = () => {
    setPet((prev) => {
      const updated = playWithPet(prev);
      addFeed("🎮", "和 Bella 一起玩");
      setCatSpeaking(true);
      speakWithSpeed("好呀好呀！一起玩！", () => setCatSpeaking(false));
      setAgentEmotion("happy");
      return checkAndAwardAchievements(updated);
    });
  };

  const handleBathe = () => {
    setPet((prev) => {
      const updated = bathePet(prev);
      addFeed("🛁", "给 Bella 洗澡");
      setCatSpeaking(true);
      speakWithSpeed("洗澡澡，好舒服！", () => setCatSpeaking(false));
      setAgentEmotion("happy");
      return checkAndAwardAchievements(updated);
    });
  };

  const handleSleep = () => {
    setPet((prev) => {
      const updated = sleepPet(prev);
      addFeed("💤", "Bella 睡觉了");
      setCatSpeaking(true);
      speakWithSpeed("晚安，做个好梦~", () => setCatSpeaking(false));
      setAgentEmotion("sad");
      return checkAndAwardAchievements(updated);
    });
  };

  const handleCheckin = () => {
    setPet((prev) => {
      const result = dailyCheckIn(prev);
      setCheckinMsg(result.reward);
      addFeed("✅", "每日签到");
      return checkAndAwardAchievements(result.data);
    });
  };

  const handleWordLearned = (word: { en: string; zh: string }) => {
    setPet((prev) => {
      const updated = studyWithPet(prev, word.en);
      addFeed("📚", `学习了单词: ${word.en}`);
      return checkAndAwardAchievements(updated);
    });
  };

  const handleQuizResult = (correct: boolean) => {
    setPet((prev) => {
      const updated = recordQuizResult(prev, correct);
      return checkAndAwardAchievements(updated);
    });
  };

  const handleRenamePet = () => {
    if (newPetName.trim()) {
      setPet((prev) => ({ ...prev, petName: newPetName.trim() }));
      setShowPetNameInput(false);
      setCatSpeaking(true);
      speakWithSpeed(`好的，以后叫我 ${newPetName.trim()} 吧！`, () => setCatSpeaking(false));
    }
  };

  const handleResetData = () => {
    localStorage.removeItem("bella_pet_data");
    setPet(loadPetData());
    setShowResetConfirm(false);
    setInteractionFeed([]);
    setAchievementMsg("");
    setCheckinMsg("");
    setCatSpeaking(true);
    speakWithSpeed("数据已重置！让我们重新开始吧！", () => setCatSpeaking(false));
  };

  const handleVoiceSpeedChange = (speed: number) => {
    setPet((prev) => ({ ...prev, voiceSpeed: speed }));
  };

  const tabs = [
    { key: "home" as Tab, label: "首页", icon: Home },
    { key: "pet" as Tab, label: "宠物", icon: PawPrint },
    { key: "study" as Tab, label: "学习", icon: BookOpen },
    { key: "settings" as Tab, label: "设置", icon: Settings },
  ];

  // 首页内容
  const renderHomePage = () => (
    <div className="space-y-4">
      {/* 签到卡片 */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Bella 等你来互动</p>
            <p className="text-2xl font-bold mt-1">
              Lv.{pet.level} {pet.petName}
            </p>
            <p className="text-xs opacity-75 mt-0.5">{getLevelTitle(pet.level)}</p>
          </div>
          <div className="text-4xl">🐱</div>
        </div>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div
              key={d}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                d <= pet.checkInStreak ? "bg-white/30 text-white" : "bg-white/10 text-white/50"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2 opacity-70">连续签到 {pet.checkInStreak} 天</p>
      </div>

      {/* 宠物状态概览 */}
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-600">📊 状态概览</h3>
          <span className="text-xs text-gray-400">金币: {pet.coins} 🪙</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg">{pet.hunger >= 60 ? "😋" : pet.hunger >= 30 ? "😶" : "😰"}</div>
            <div className="text-xs text-gray-400 mt-0.5">饱腹 {pet.hunger}</div>
          </div>
          <div>
            <div className="text-lg">{pet.mood >= 60 ? "😄" : pet.mood >= 30 ? "😐" : "😢"}</div>
            <div className="text-xs text-gray-400 mt-0.5">心情 {pet.mood}</div>
          </div>
          <div>
            <div className="text-lg">⭐</div>
            <div className="text-xs text-gray-400 mt-0.5">等级 {pet.level}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {pet.achievements.length > 0 && (
            <>
              <span className="text-xs text-yellow-500 mr-1">🏅 成就:</span>
              {pet.achievements.slice(0, 3).map((id) => {
                const ach = ACHIEVEMENTS.find((a) => a.id === id);
                return ach ? (
                  <span key={id} className="text-xs" title={ach.desc}>
                    {ach.icon}
                  </span>
                ) : null;
              })}
              {pet.achievements.length > 3 && (
                <span className="text-xs text-gray-400">+{pet.achievements.length - 3}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 快捷入口 — 语音也可直达，点击作兜底 */}
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">🚀 快捷入口</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: "🇬🇧", label: "英语", section: "english.words" },
            { icon: "📝", label: "语文", section: "chinese.hanzi" },
            { icon: "🔢", label: "数学", section: "math.drill" },
            { icon: "📖", label: "阅读", section: "reading.story" },
            { icon: "🔍", label: "探索", section: "explore.weather" },
            { icon: "🐱", label: "宠物", section: "" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => (item.section ? goStudy(item.section) : setActiveTab("pet"))}
              className="bg-pink-50 rounded-xl p-3 hover:bg-pink-100 active:scale-95 transition-all text-center"
            >
              <div className="text-xl mb-0.5">{item.icon}</div>
              <div className="text-[10px] text-gray-500">{item.label}</div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-2">按住说话：说「汉字」「口算」也能直达</p>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleFeed}
          className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="text-2xl mb-1">🍖</div>
          <div className="text-xs text-gray-500">喂食</div>
        </button>
        <button
          onClick={handlePlay}
          className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-xs text-gray-500">玩耍</div>
        </button>
        <button
          onClick={() => setActiveTab("study")}
          className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="text-2xl mb-1">📚</div>
          <div className="text-xs text-gray-500">学习</div>
        </button>
      </div>

      {/* 今日学习统计 */}
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">📈 今日学习</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="text-lg font-bold text-purple-600">{pet.learnedWords.length}</div>
            <div className="text-xs text-gray-400">已学单词</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-lg font-bold text-green-600">
              {pet.quizTotal > 0 ? Math.round((pet.quizCorrect / pet.quizTotal) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-400">测验正确率</div>
          </div>
        </div>
      </div>

      {/* 最近互动 */}
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">📋 最近互动</h3>
        {interactionFeed.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">还没有互动记录，试试和 Bella 说话吧！</p>
        ) : (
          <div className="space-y-2">
            {interactionFeed.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <span>{item.icon}</span>
                <span className="flex-1">{item.text}</span>
                <span className="text-gray-300">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 宠物页内容
  const renderPetPage = () => (
    <div className="space-y-4">
      {/* 真实白猫 */}
      <div className="rounded-2xl shadow-sm border border-pink-100/40 overflow-hidden">
        <div className="aspect-[4/5] max-h-[500px] relative">
          <RealisticCat
            mood={agentEmotion}
            speaking={catSpeaking}
            onTap={() => {
              setAgentEmotion("happy");
              setCatSpeaking(true);
              speakWithSpeed("嘿嘿，别戳我！", () => setCatSpeaking(false));
            }}
          />
        </div>
      </div>

      {/* 宠物状态 */}
      <PetStatus pet={pet} />

      {/* 互动按钮 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleFeed}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl hover:bg-orange-200 active:scale-90 transition-all">
            🍖
          </div>
          <span className="text-xs text-gray-400">喂食</span>
        </button>
        <button
          onClick={handlePlay}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl hover:bg-blue-200 active:scale-90 transition-all">
            🎮
          </div>
          <span className="text-xs text-gray-400">玩耍</span>
        </button>
        <button
          onClick={handleBathe}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center text-xl hover:bg-cyan-200 active:scale-90 transition-all">
            🛁
          </div>
          <span className="text-xs text-gray-400">洗澡</span>
        </button>
        <button
          onClick={handleSleep}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl hover:bg-purple-200 active:scale-90 transition-all">
            💤
          </div>
          <span className="text-xs text-gray-400">睡觉</span>
        </button>
      </div>

      {/* 成就展示 */}
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-600">🏅 成就 ({pet.achievements.length}/{ACHIEVEMENTS.length})</h3>
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="text-xs text-pink-500 hover:text-pink-600"
          >
            {showAchievements ? "收起" : "查看全部"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = pet.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs ${
                  unlocked ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-300"
                }`}
                title={ach.desc}
              >
                <span>{ach.icon}</span>
                <span>{ach.name}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );

  // 学习页内容
  const renderStudyPage = () => (
    <div className="space-y-4">
      <StudyPanel
        studySection={studySection}
        onSectionChange={setStudySection}
        contentCard={contentCard}
        mathQuestion={mathQuestion}
        mathStreak={mathStreak}
        onMathAnswer={handleMathAnswer}
        words={studyWords}
        onWordLearned={handleWordLearned}
        onQuizResult={handleQuizResult}
      />

      {/* 学习统计 */}
      <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">📊 学习统计</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{pet.learnedWords.length}/{getAllWords().length}</div>
            <div className="text-xs text-gray-400">已学单词</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {pet.quizTotal > 0 ? `${pet.quizCorrect}/${pet.quizTotal}` : "0/0"}
            </div>
            <div className="text-xs text-gray-400">测验正确</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-600">{pet.totalStudyTime} 分钟</div>
            <div className="text-xs text-gray-400">累计学习</div>
          </div>
          <div className="bg-rose-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-rose-600">
              {pet.quizTotal > 0 ? Math.round((pet.quizCorrect / pet.quizTotal) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-400">正确率</div>
          </div>
        </div>

        {/* 已学单词列表 */}
        <h4 className="text-xs font-bold text-gray-500 mb-2">已学单词</h4>
        <div className="flex flex-wrap gap-1.5">
          {pet.learnedWords.map((word, i) => (
            <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
              {word}
            </span>
          ))}
          {pet.learnedWords.length === 0 && (
            <span className="text-xs text-gray-300">还没有学过的单词</span>
          )}
        </div>
      </div>
    </div>
  );

  // 设置页内容
  const renderSettingsPage = () => (
    <div className="space-y-4">
      {/* 宠物改名 */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">✏️ 宠物名称</h3>
        {showPetNameInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="输入新名字"
              className="flex-1 px-3 py-2 text-sm border border-pink-200 rounded-xl focus:outline-none focus:border-pink-400"
              onKeyDown={(e) => e.key === "Enter" && handleRenamePet()}
              autoFocus
            />
            <button
              onClick={handleRenamePet}
              className="px-4 py-2 bg-pink-500 text-white text-sm rounded-xl hover:bg-pink-600"
            >
              确定
            </button>
            <button
              onClick={() => setShowPetNameInput(false)}
              className="px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-xl hover:bg-gray-200"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">当前名称: <strong className="text-pink-600">{pet.petName}</strong></span>
            <button
              onClick={() => {
                setNewPetName(pet.petName);
                setShowPetNameInput(true);
              }}
              className="text-xs text-pink-500 hover:text-pink-600"
            >
              修改
            </button>
          </div>
        )}
      </div>

      {/* 语音设置 */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">🎙️ 语音设置</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">语音速度</span>
            <span className="text-xs text-gray-400">{pet.voiceSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={pet.voiceSpeed}
            onChange={(e) => handleVoiceSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-xs text-gray-300">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-gray-500">
          <p>语音合成: {speechSupported === null ? "检测中..." : speechSupported ? "✅ 支持" : "❌ 不支持（建议使用 Chrome）"}</p>
          <p>语音识别: {sttSupported === null ? "检测中..." : sttSupported ? "✅ 支持" : "❌ 不支持（可使用文字输入）"}</p>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">🗄️ 数据管理</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>等级: Lv.{pet.level} · 经验: {pet.exp}/{pet.level * 100}</p>
          <p>金币: {pet.coins} · 连续签到: {pet.checkInStreak} 天</p>
          <p className="text-gray-300 mt-2">数据存储在浏览器本地 (localStorage)</p>
        </div>
        {showResetConfirm ? (
          <div className="mt-3 p-3 bg-red-50 rounded-xl">
            <p className="text-xs text-red-600 mb-2">确定要清除所有数据吗？此操作不可恢复！</p>
            <div className="flex gap-2">
              <button
                onClick={handleResetData}
                className="px-4 py-2 bg-red-500 text-white text-xs rounded-xl hover:bg-red-600"
              >
                确认清除
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-500 text-xs rounded-xl hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="mt-3 flex items-center gap-1 text-xs text-red-400 hover:text-red-500"
          >
            <RotateCcw className="w-3 h-3" />
            清除所有数据
          </button>
        )}
      </div>

      {/* 关于 */}
      <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
        <h3 className="text-sm font-bold text-gray-600 mb-3">🎯 关于</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>AI 英语教师 - Bella 是一款语音驱动的英语学习工具。</p>
          <p>通过虚拟宠物 + 语音交互，让学习更轻松有趣。</p>
          <p className="text-gray-300 mt-2">Version 1.0.0 · 纯 Web 版</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50 to-white">
      {/* 顶部状态栏 */}
      <header className="pt-3 pb-2 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-pink-600">
            {activeTab === "home" && "🏠 首页"}
            {activeTab === "pet" && "🐱 我的宠物"}
            {activeTab === "study" && "📖 学习中心"}
            {activeTab === "settings" && "⚙️ 设置"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "home" && (
            <button
              onClick={handleCheckin}
              className="text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-200 active:scale-95 transition-all"
            >
              签到
            </button>
          )}
          {activeTab === "pet" && (
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="text-xs bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded-full hover:bg-yellow-200 active:scale-95 transition-all"
            >
              🏅 {pet.achievements.length}
            </button>
          )}
          <span className="text-xs text-gray-400">🪙 {pet.coins}</span>
        </div>
      </header>

      {/* 提示消息 */}
      {checkinMsg && (
        <div className="mx-4 mb-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-3 py-2 animate-fadeIn">
          {checkinMsg}
          <button onClick={() => setCheckinMsg("")} className="float-right text-green-400">✕</button>
        </div>
      )}
      {achievementMsg && (
        <div className="mx-4 mb-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-xl px-3 py-2 animate-fadeIn">
          {achievementMsg}
          <button onClick={() => setAchievementMsg("")} className="float-right text-yellow-400">✕</button>
        </div>
      )}

      {/* 全局语音回复 */}
      <VoiceReplyBar
        userText={lastUserText}
        reply={lastReply}
        onDismiss={() => {
          setLastReply("");
          setLastUserText("");
        }}
      />

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-2">
        <div className={activeTab === "home" ? "" : "hidden"}>{renderHomePage()}</div>
        <div className={activeTab === "pet" ? "" : "hidden"}>{renderPetPage()}</div>
        <div className={activeTab === "study" ? "" : "hidden"}>{renderStudyPage()}</div>
        <div className={activeTab === "settings" ? "" : "hidden"}>{renderSettingsPage()}</div>
      </main>

      {/* 全局语音/文字输入栏（类微信/豆包） */}
      <VoiceChatBar
        onAgentResponse={handleAgentResponse}
        onTranscript={handleVoiceTranscript}
        onSpeakingChange={setCatSpeaking}
        voiceSpeed={pet.voiceSpeed}
      />

      {/* 底部导航栏 */}
      <nav
        className="bg-white border-t border-pink-100 flex justify-around items-center py-2 px-2"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                isActive ? "text-pink-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "fill-pink-100" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}