"use client";

import { BookOpen, Coins, Home, PawPrint, Settings } from "lucide-react";
import VoiceChatBar from "@/components/VoiceChatBar";
import VoicePeek from "@/components/VoicePeek";
import { TAB_TITLES, type Tab } from "@/lib/app-nav";
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
  compactReply,
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
  compactReply?: boolean;
  voiceSpeed: number;
  onAgentResponse: (response: AgentResponse) => void;
  onTranscript: (text: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-lg flex-col bg-gradient-to-b from-pink-50 to-white">
      <header className="flex w-full items-center justify-between px-4 pb-1.5 pt-3">
        <h1 className="text-xl font-bold tracking-wide text-pink-600">{TAB_TITLES[activeTab]}</h1>
        <div className="flex items-center gap-2">
          {activeTab === "home" && (
            <button
              type="button"
              onClick={onCheckin}
              className="min-h-10 rounded-full bg-pink-100 px-3 text-sm font-semibold text-pink-600 transition-all hover:bg-pink-200 active:scale-95"
            >
              签到
            </button>
          )}
          {activeTab === "pet" && (
            <button
              type="button"
              onClick={onToggleAchievements}
              className="min-h-10 rounded-full bg-yellow-100 px-3 text-sm font-semibold text-yellow-700 transition-all hover:bg-yellow-200 active:scale-95"
              aria-label={`成就 ${achievementCount}`}
            >
              🏅 {achievementCount}
            </button>
          )}
          <span className="inline-flex min-h-10 items-center gap-1 px-2 text-sm text-gray-600">
            <Coins className="h-4 w-4 text-amber-500" />
            {coins}
          </span>
        </div>
      </header>

      {checkinMsg && (
        <div className="mx-auto mb-2 w-full bg-green-50 px-3 py-2 text-sm text-green-700 animate-fadeIn">
          {checkinMsg}
          <button type="button" onClick={onDismissCheckin} className="float-right min-h-8 min-w-8 text-green-500">
            ✕
          </button>
        </div>
      )}
      {achievementMsg && (
        <div className="mx-auto mb-2 w-full bg-yellow-50 px-3 py-2 text-sm text-yellow-800 animate-fadeIn">
          {achievementMsg}
          <button type="button" onClick={onDismissAchievement} className="float-right min-h-8 min-w-8 text-yellow-500">
            ✕
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <main
          className={`absolute inset-0 px-3 ${
            activeTab === "pet" ? "overflow-hidden pb-2" : "hide-scrollbar overflow-y-auto px-4 pb-8"
          }`}
        >
          {children}
        </main>
        <VoicePeek
          userText={lastUserText}
          reply={lastReply}
          voiceSpeed={voiceSpeed}
          compact={compactReply}
          onDismiss={onDismissReply}
        />
      </div>

      <VoiceChatBar
        onAgentResponse={onAgentResponse}
        onTranscript={onTranscript}
        onSpeakingChange={onSpeakingChange}
        voiceSpeed={voiceSpeed}
      />

      <nav
        className="flex w-full items-center justify-around border-t border-pink-100 bg-white px-2 pt-1"
        style={{ paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {NAV.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              aria-label={tab.label}
              onClick={() => onTabChange(tab.key)}
              className={`flex min-h-12 min-w-14 flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors ${
                isActive ? "text-pink-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
