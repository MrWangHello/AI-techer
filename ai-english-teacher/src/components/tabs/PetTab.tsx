"use client";

import Cat3D, { type PetAction } from "@/components/Cat3D";
import Card from "@/components/ui/Card";
import { ACHIEVEMENTS, getHungerEmoji, getMoodEmoji, type PetData } from "@/lib/pet-data";

export default function PetTab({
  pet,
  mood,
  action,
  speaking,
  showAchievements,
  onTapCat,
  onActionEnd,
  onFeed,
  onPlay,
  onBathe,
  onSleep,
  onToggleAchievements,
  active = true,
}: {
  pet: PetData;
  mood: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action: PetAction;
  speaking: boolean;
  showAchievements: boolean;
  voiceSpeed: number;
  onTapCat: () => void;
  onActionEnd: () => void;
  onFeed: () => void;
  onPlay: () => void;
  onBathe: () => void;
  onSleep: () => void;
  onToggleAchievements: () => void;
  active?: boolean;
}) {
  const actions = [
    { label: "喂食", icon: "🍖", onClick: onFeed },
    { label: "玩耍", icon: "🎮", onClick: onPlay },
    { label: "洗澡", icon: "🛁", onClick: onBathe },
    { label: "睡觉", icon: "💤", onClick: onSleep },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-pink-50 shadow-sm">
        <Cat3D
          mood={mood}
          action={action}
          speaking={speaking}
          onTap={onTapCat}
          onActionEnd={onActionEnd}
          active={active}
        />

        <div className="absolute top-1/2 right-1 z-20 flex -translate-y-1/2 flex-col gap-2">
          {actions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              className="flex flex-col items-center gap-0.5 rounded-2xl bg-white/80 px-1.5 py-1 shadow-sm backdrop-blur-sm active:scale-90"
            >
              <span className="flex h-11 w-11 items-center justify-center text-xl">{item.icon}</span>
              <span className="text-[10px] font-semibold text-gray-500">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="absolute bottom-2 left-2 right-16 z-20 rounded-xl bg-white/75 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span className="font-semibold text-pink-600">{pet.petName}</span>
            <span>Lv.{pet.level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden>
              {getHungerEmoji(pet.hunger)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-orange-400" style={{ width: `${pet.hunger}%` }} />
            </div>
            <span className="text-sm" aria-hidden>
              {getMoodEmoji(pet.mood)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-pink-400" style={{ width: `${pet.mood}%` }} />
            </div>
          </div>
        </div>
      </div>

      {showAchievements && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/20 p-1">
          <Card className="max-h-[55%] w-full overflow-y-auto">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-700">
                成就 ({pet.achievements.length}/{ACHIEVEMENTS.length})
              </h3>
              <button type="button" onClick={onToggleAchievements} className="min-h-11 px-2 text-sm text-pink-600">
                收起
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = pet.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm ${
                      unlocked ? "bg-yellow-50 text-yellow-800" : "bg-gray-100 text-gray-500"
                    }`}
                    title={ach.desc}
                  >
                    <span>{ach.icon}</span>
                    <span>{ach.name}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
