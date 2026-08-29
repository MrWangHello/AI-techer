"use client";

import { useState, useEffect, useCallback } from "react";
import { Home, PawPrint, BookOpen, Settings } from "lucide-react";
import ModelCanvas from "@/components/ModelCanvas";
import VoiceController from "@/components/VoiceController";
import PetStatus from "@/components/PetStatus";
import StudyCards from "@/components/StudyCards";
import {
  loadPetData,
  savePetData,
  feedPet,
  playWithPet,
  studyWithPet,
  dailyCheckIn,
  PetData,
} from "@/lib/pet-data";
import { speak } from "@/lib/speech";
import { AgentResponse } from "@/lib/mock-agent";
import { WORDS } from "@/lib/words";

type Tab = "home" | "pet" | "study" | "settings";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [pet, setPet] = useState<PetData>(loadPetData);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [agentEmotion, setAgentEmotion] = useState<
    "happy" | "sad" | "surprised" | "neutral" | "thinking"
  >("neutral");
  const [agentAction, setAgentAction] = useState<
    "feed" | "play" | "study" | "none"
  >("none");
  const [lastReply, setLastReply] = useState<string>("");
  const [checkinMsg, setCheckinMsg] = useState<string>("");
  const [interactionFeed, setInteractionFeed] = useState<
    { icon: string; text: string; time: string }[]
  >([]);

  // 保存宠物数据
  useEffect(() => {
    savePetData(pet);
  }, [pet]);

  // 添加互动记录
  const addFeed = useCallback((icon: string, text: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    setInteractionFeed((prev) => [{ icon, text, time }, ...prev].slice(0, 20));
  }, []);

  // AI Agent 回复处理
  const handleAgentResponse = useCallback(
    (response: AgentResponse) => {
      setAgentEmotion(response.emotion);
      setAgentAction(response.action as "feed" | "play" | "study" | "none");
      setLastReply(response.reply);

      // 根据意图执行操作
      switch (response.intent) {
        case "feed_pet":
          setPet((prev) => {
            const updated = feedPet(prev);
            addFeed("🍖", "喂食了 Bella");
            return updated;
          });
          break;
        case "play_pet":
          setPet((prev) => {
            const updated = playWithPet(prev);
            addFeed("🎮", "和 Bella 一起玩");
            return updated;
          });
          break;
        case "study":
          setActiveTab("study");
          addFeed("📚", "开始学习英语");
          break;
        case "checkin":
          setPet((prev) => {
            const result = dailyCheckIn(prev);
            setCheckinMsg(result.reward);
            addFeed("✅", "每日签到");
            return result.data;
          });
          break;
        case "quiz":
          setActiveTab("study");
          addFeed("📝", "开始单词测验");
          break;
        case "greeting":
          addFeed("👋", "和 Bella 打招呼");
          break;
      }
    },
    [addFeed]
  );

  // 按钮互动
  const handleFeed = () => {
    setPet((prev) => {
      const updated = feedPet(prev);
      addFeed("🍖", "喂食了 Bella");
      return updated;
    });
    speak("好香呀！谢谢喂我！");
    setAgentEmotion("happy");
  };

  const handlePlay = () => {
    setPet((prev) => {
      const updated = playWithPet(prev);
      addFeed("🎮", "和 Bella 一起玩");
      return updated;
    });
    speak("好呀好呀！一起玩！");
    setAgentEmotion("happy");
  };

  const handleCheckin = () => {
    setPet((prev) => {
      const result = dailyCheckIn(prev);
      setCheckinMsg(result.reward);
      addFeed("✅", "每日签到");
      return result.data;
    });
  };

  // 学习时调用
  const handleWordLearned = () => {
    // 简单的体验增加
  };

  const tabs = [
    { key: "home" as Tab, label: "首页", icon: Home },
    { key: "pet" as Tab, label: "宠物", icon: PawPrint },
    { key: "study" as Tab, label: "学习", icon: BookOpen },
    { key: "settings" as Tab, label: "设置", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50 to-white">
      {/* 顶部状态栏 */}
      <header className="pt-3 pb-2 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-pink-600">
            {activeTab === "home" && "🏠 首页"}
            {activeTab === "pet" && "🐱 我的宠物"}
            {activeTab === "study" && "📖 英语学习"}
            {activeTab === "settings" && "⚙️ 设置"}
          </h1>
        </div>
        {activeTab === "home" && (
          <button
            onClick={handleCheckin}
            className="text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-full
              hover:bg-pink-200 active:scale-95 transition-all"
          >
            签到
          </button>
        )}
      </header>

      {/* 签到提示 */}
      {checkinMsg && (
        <div className="mx-4 mb-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-3 py-2 animate-fadeIn">
          {checkinMsg}
          <button
            onClick={() => setCheckinMsg("")}
            className="float-right text-green-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* 语音回复气泡 */}
      {lastReply && activeTab === "pet" && (
        <div className="mx-4 mb-2 bg-white border border-pink-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-2">
            <span className="text-sm">💬</span>
            <p className="text-sm text-gray-600 flex-1">{lastReply}</p>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4">
        {/* ===== 首页 ===== */}
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* 签到卡片 */}
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Bella 等你来互动</p>
                  <p className="text-2xl font-bold mt-1">
                    Lv.{pet.level} {pet.petName}
                  </p>
                </div>
                <div className="text-4xl">🐱</div>
              </div>
              <div className="flex gap-2 mt-3">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div
                    key={d}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${
                        d <= pet.checkInStreak
                          ? "bg-white/30 text-white"
                          : "bg-white/10 text-white/50"
                      }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2 opacity-70">
                连续签到 {pet.checkInStreak} 天
              </p>
            </div>

            {/* 快捷操作 */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleFeed}
                className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50
                  hover:shadow-md active:scale-95 transition-all"
              >
                <div className="text-2xl mb-1">🍖</div>
                <div className="text-xs text-gray-500">喂食</div>
              </button>
              <button
                onClick={handlePlay}
                className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50
                  hover:shadow-md active:scale-95 transition-all"
              >
                <div className="text-2xl mb-1">🎮</div>
                <div className="text-xs text-gray-500">玩耍</div>
              </button>
              <button
                onClick={() => setActiveTab("study")}
                className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50
                  hover:shadow-md active:scale-95 transition-all"
              >
                <div className="text-2xl mb-1">📚</div>
                <div className="text-xs text-gray-500">学习</div>
              </button>
            </div>

            {/* 最近互动 */}
            <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
              <h3 className="text-sm font-bold text-gray-600 mb-3">
                📋 最近互动
              </h3>
              {interactionFeed.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  还没有互动记录，试试和 Bella 说话吧！
                </p>
              ) : (
                <div className="space-y-2">
                  {interactionFeed.slice(0, 5).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      <span>{item.icon}</span>
                      <span className="flex-1">{item.text}</span>
                      <span className="text-gray-300">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 宠物页 ===== */}
        {activeTab === "pet" && (
          <div className="space-y-4">
            {/* Live2D 模型 */}
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
              <div className="aspect-[4/5] max-h-[500px] relative">
                <ModelCanvas
                  onReady={() => setModelReady(true)}
                  onError={(err) => setModelError(err)}
                  mood={agentEmotion}
                  action={agentAction}
                />
                {/* 加载中 */}
                {!modelReady && !modelError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-pink-50">
                    <div className="text-center">
                      <div className="animate-pulse text-4xl mb-2">🐱</div>
                      <p className="text-sm text-gray-400">Bella 正在加载中...</p>
                    </div>
                  </div>
                )}
                {modelError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-pink-50">
                    <div className="text-center">
                      <div className="text-4xl mb-2">😿</div>
                      <p className="text-sm text-red-400">模型加载失败</p>
                      <p className="text-xs text-gray-400 mt-1">{modelError}</p>
                    </div>
                  </div>
                )}
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
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl
                  hover:bg-orange-200 active:scale-90 transition-all">
                  🍖
                </div>
                <span className="text-xs text-gray-400">喂食</span>
              </button>
              <button
                onClick={handlePlay}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl
                  hover:bg-blue-200 active:scale-90 transition-all">
                  🎮
                </div>
                <span className="text-xs text-gray-400">玩耍</span>
              </button>
            </div>

            {/* 语音控制 */}
            <VoiceController onAgentResponse={handleAgentResponse} />
          </div>
        )}

        {/* ===== 学习页 ===== */}
        {activeTab === "study" && (
          <div className="space-y-4">
            <StudyCards onWordLearned={handleWordLearned} />

            {/* 已学单词统计 */}
            <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-pink-50">
              <h3 className="text-sm font-bold text-gray-600 mb-2">
                📊 学习统计
              </h3>
              <div className="text-xs text-gray-400">
                已学单词：{pet.learnedWords.length} / {WORDS.length}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {pet.learnedWords.map((word, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full"
                  >
                    {word}
                  </span>
                ))}
                {pet.learnedWords.length === 0 && (
                  <span className="text-xs text-gray-300">还没有学过的单词</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== 设置页 ===== */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
              <h3 className="text-sm font-bold text-gray-600 mb-3">
                🎯 关于
              </h3>
              <div className="space-y-2 text-xs text-gray-500">
                <p>
                  AI 英语教师 - Bella 是一款语音驱动的英语学习工具。
                </p>
                <p>通过 Live2D 虚拟宠物 + 语音交互，让学习更轻松。</p>
                <p className="text-gray-300 mt-2">
                  Version 1.0.0 · 纯 Web 版
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
              <h3 className="text-sm font-bold text-gray-600 mb-3">
                🗄️ 数据
              </h3>
              <div className="space-y-2 text-xs text-gray-500">
                <p>当前数据存储在浏览器本地。</p>
                <p>等级: Lv.{pet.level} · 经验: {pet.exp}/{pet.level * 100}</p>
                <p>金币: {pet.coins} · 连续签到: {pet.checkInStreak} 天</p>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50">
              <h3 className="text-sm font-bold text-gray-600 mb-3">
                🎙️ 语音功能
              </h3>
              <div className="space-y-1 text-xs text-gray-500">
                <p>语音识别: {typeof window !== "undefined" && (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition ? "✅ 支持" : "❌ 不支持"}</p>
                <p>语音合成: {typeof window !== "undefined" && window.speechSynthesis ? "✅ 支持" : "❌ 不支持"}</p>
              </div>
            </div>
          </div>
        )}
      </main>

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
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all
                ${
                  isActive
                    ? "text-pink-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "fill-pink-100" : ""}`}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}