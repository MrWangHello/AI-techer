"use client";

import { BookOpen, Coins, Home, PawPrint, Settings } from "lucide-react";
import VoiceChatBar from "@/components/VoiceChatBar";
import VoiceReplyBar from "@/components/VoiceReplyBar";
import { TAB_PINYIN, TAB_TITLES, type Tab } from "@/lib/app-nav";
import type { AgentResponse } from "@/lib/mock-agent";

const NAV = [
  { key: "home" as Tab, label: "首页", icon: Home },
  { key: "pet" as Tab, label: "宠物", icon: PawPrint },
  { key: "study" as Tab, label: "学习", icon: BookOpen },
  { key: "settings" as Tab, label: "设置", icon: Settings },
];

export default function AppShell({
  activeTab,
  onTabChange,
  coins,
  onCheckin,
  onToggleAchievements,
  achievementCount,
  checkinMsg,
  achievementMsg,
  onDismissCheckin,
  onDismissAchievement,
  lastUserText,
  lastReply,
  onDismissReply,
  voiceSpeed,
  onAgentResponse,
  onTranscript,
  onSpeakingChange,
  children,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  coins: number;
  onCheckin: () => void;
  onToggleAchievements: () => void;
  achievementCount: number;
  checkinMsg: string;
  achievementMsg: string;
  onDismissCheckin: () => void;
  onDismissAchievement: () => void;
  lastUserText: string;
  lastReply: string;
  onDismissReply: () => void;
  voiceSpeed: number;
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript: (text: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50 to-white">
      <header className="pt-3 pb-2 px-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-pink-600 tracking-wide">{TAB_TITLES[activeTab]}</h1>
        <div className="flex items-center gap-2">
          {activeTab === "home" && (
            <button
              type="button"
              onClick={onCheckin}
              className="text-sm bg-pink-100 text-pink-600 min-h-11 px-4 rounded-full hover:bg-pink-200 active:scale-95 transition-all font-semibold"
            >
              签到
            </button>
          )}
          {activeTab === "pet" && (
            <button
              type="button"
              onClick={onToggleAchievements}
              className="text-sm bg-yellow-100 text-yellow-700 min-h-11 px-4 rounded-full hover:bg-yellow-200 active:scale-95 transition-all font-semibold"
            >
              🏅 {achievementCount}
            </button>
          )}
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 min-h-11 px-2">
            <Coins className="w-4 h-4 text-amber-500" />
            {coins}
          </span>
        </div>
      </header>

      {checkinMsg && (
        <div className="mx-auto w-full max-w-lg mb-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-3 py-2.5 animate-fadeIn">
          {checkinMsg}
          <button type="button" onClick={onDismissCheckin} className="float-right text-green-500 min-w-8 min-h-8">
            ✕
          </button>
        </div>
      )}
      {achievementMsg && (
        <div className="mx-auto w-full max-w-lg mb-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl px-3 py-2.5 animate-fadeIn">
          {achievementMsg}
          <button type="button" onClick={onDismissAchievement} className="float-right text-yellow-500 min-w-8 min-h-8">
            ✕
          </button>
        </div>
      )}

      <div className="px-4 max-w-lg mx-auto w-full">
        <VoiceReplyBar
          userText={lastUserText}
          reply={lastReply}
          voiceSpeed={voiceSpeed}
          onDismiss={onDismissReply}
        />
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-2">
        <div className="max-w-lg mx-auto w-full">{children}</div>
      </main>

      <VoiceChatBar
        onAgentResponse={onAgentResponse}
        onTranscript={onTranscript}
        onSpeakingChange={onSpeakingChange}
        voiceSpeed={voiceSpeed}
      />

      <nav
        className="bg-white border-t border-pink-100 flex justify-around items-center py-2 px-2 max-w-lg mx-auto w-full"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {NAV.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              aria-label={tab.label}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center gap-0.5 min-w-16 min-h-14 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? "text-pink-600 bg-pink-50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`w-7 h-7 ${isActive ? "fill-pink-100" : ""}`} />
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className={`text-sm leading-none ${isActive ? "text-pink-400" : "text-gray-400"}`}>
                {TAB_PINYIN[tab.key]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
