"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import KbSettingsCard from "@/components/KbSettingsCard";
import VoiceHintBar from "@/components/VoiceHintBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SpeakableText from "@/components/ui/SpeakableText";
import { TAB_VOICE_HINTS } from "@/lib/voice-hints";
import type { PetData } from "@/lib/pet-data";
import { readSttPref, writeSttPref, type SttPref } from "@/lib/speech-probe";
import { ensureLocalModel, getLocalSttSnapshot, subscribeLocalStt } from "@/lib/speech-local";

export default function SettingsTab({
  pet,
  showPetNameInput,
  newPetName,
  showResetConfirm,
  speechSupported,
  sttSupported,
  voiceSpeed,
  onNewPetNameChange,
  onStartRename,
  onRename,
  onCancelRename,
  onVoiceSpeedSlider,
  onPreviewVoiceSpeed,
  onShowReset,
  onCancelReset,
  onResetData,
}: {
  pet: PetData;
  showPetNameInput: boolean;
  newPetName: string;
  showResetConfirm: boolean;
  speechSupported: boolean | null;
  sttSupported: boolean | null;
  voiceSpeed: number;
  onNewPetNameChange: (value: string) => void;
  onStartRename: () => void;
  onRename: () => void;
  onCancelRename: () => void;
  onVoiceSpeedSlider: (speed: number) => void;
  onPreviewVoiceSpeed: (speed: number) => void;
  onShowReset: () => void;
  onCancelReset: () => void;
  onResetData: () => void;
}) {
  const [sttPref, setSttPref] = useState<SttPref>("auto");
  const [pack, setPack] = useState(getLocalSttSnapshot());

  useEffect(() => {
    setSttPref(readSttPref());
    return subscribeLocalStt((s) => setPack({ ...s, ready: s.status === "ready" }));
  }, []);

  const setPref = (pref: SttPref) => {
    setSttPref(pref);
    writeSttPref(pref);
    if (pref === "local") void ensureLocalModel();
  };

  return (
    <div className="space-y-4 animate-slideUp">
      <VoiceHintBar text={TAB_VOICE_HINTS.settings} voiceSpeed={voiceSpeed} />
      <KbSettingsCard />

      <Card>
        <h3 className="text-lg font-bold text-gray-700 mb-3">宠物名称</h3>
        {showPetNameInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPetName}
              onChange={(e) => onNewPetNameChange(e.target.value)}
              placeholder="输入新名字"
              className="flex-1 px-3 min-h-12 text-base border border-pink-200 rounded-xl focus:outline-none focus:border-pink-400"
              onKeyDown={(e) => e.key === "Enter" && onRename()}
              autoFocus
            />
            <Button onClick={onRename}>确定</Button>
            <Button variant="secondary" onClick={onCancelRename}>
              取消
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-base text-gray-600">
              当前名称: <strong className="text-pink-600">{pet.petName}</strong>
            </span>
            <button type="button" onClick={onStartRename} className="text-base text-pink-600 min-h-11 px-2">
              修改
            </button>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-700 mb-3">语音设置</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base text-gray-600">语音速度</span>
            <span className="text-base text-gray-500">{pet.voiceSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={pet.voiceSpeed}
            onChange={(e) => onVoiceSpeedSlider(parseFloat(e.target.value))}
            className="w-full accent-pink-500 min-h-11"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => onPreviewVoiceSpeed(pet.voiceSpeed)}>
            试听当前语速
          </Button>
          <SpeakableText
            text="拖动滑块约半秒后会自动试听；部分手机浏览器对语速支持有限，以试听为准。"
            lang="zh"
            voiceSpeed={voiceSpeed}
            className="items-start"
            textClassName="text-sm text-gray-500 leading-relaxed"
          />
        </div>
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p>语音合成: {speechSupported === null ? "检测中..." : speechSupported ? "支持" : "不支持（建议使用 Chrome）"}</p>
          <p>语音识别: {sttSupported === null ? "检测中..." : sttSupported ? "支持" : "不支持（可使用文字输入）"}</p>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-base text-gray-600">识别方式</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["auto", "自动（先探测）"],
                ["webspeech", "只用浏览器"],
                ["local", "只用离线包"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPref(value)}
                className={`min-h-11 px-3 rounded-full text-sm border ${
                  sttPref === value ? "bg-pink-500 text-white border-pink-500" : "bg-white text-gray-600 border-pink-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            离线包：
            {pack.status === "downloading"
              ? `正在装 ${pack.progress}%`
              : pack.ready || pack.status === "ready"
                ? "已在这台浏览器里"
                : pack.status === "error"
                  ? `装不上（${pack.error || "请检查网络"}）`
                  : "还没下载。Chrome 能认就不下。"}
          </p>
          <SpeakableText
            text="进页面会先探测。浏览器耳朵够用就不下包。荣耀、华为、QQ 或探测失败，才会后台给 Bella 装离线耳朵。"
            lang="zh"
            voiceSpeed={voiceSpeed}
            className="items-start"
            textClassName="text-sm text-gray-500 leading-relaxed"
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-700 mb-3">数据管理</h3>
        <div className="space-y-2 text-base text-gray-600">
          <p>
            等级: Lv.{pet.level} · 经验: {pet.exp}/{pet.level * 100}
          </p>
          <p>
            金币: {pet.coins} · 连续签到: {pet.checkInStreak} 天
          </p>
          <p className="text-sm text-gray-500 mt-2">数据存储在浏览器本地</p>
        </div>
        {showResetConfirm ? (
          <div className="mt-3 p-3 bg-red-50 rounded-xl">
            <p className="text-base text-red-600 mb-2">确定要清除所有数据吗？此操作不可恢复！</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={onResetData}>
                确认清除
              </Button>
              <Button variant="secondary" onClick={onCancelReset}>
                取消
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onShowReset}
            className="mt-3 flex items-center gap-1 text-base text-red-500 hover:text-red-600 min-h-11"
          >
            <RotateCcw className="w-4 h-4" />
            清除所有数据
          </button>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-700 mb-3">关于</h3>
        <SpeakableText
          text="AI 英语教师 Bella 是一款语音驱动的英语学习工具。通过虚拟宠物和语音交互，让学习更轻松有趣。"
          lang="zh"
          voiceSpeed={voiceSpeed}
          className="items-start"
          textClassName="text-base text-gray-600 leading-relaxed"
        />
        <p className="text-sm text-gray-400 mt-3">Version 1.0.0 · 纯 Web 版</p>
      </Card>
    </div>
  );
}
