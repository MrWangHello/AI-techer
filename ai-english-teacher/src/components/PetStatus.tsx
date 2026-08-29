"use client";

import { PetData, getMoodEmoji, getHungerEmoji } from "@/lib/pet-data";

interface PetStatusProps {
  pet: PetData;
}

export default function PetStatus({ pet }: PetStatusProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-pink-100">
      <div className="text-center mb-3">
        <span className="text-lg font-bold text-pink-600">{pet.petName}</span>
        <span className="text-gray-300 mx-2">|</span>
        <span className="text-sm text-gray-500">
          Lv.{pet.level}
        </span>
      </div>

      <div className="space-y-2">
        {/* 饱腹度 */}
        <div className="flex items-center gap-2">
          <span className="text-sm">{getHungerEmoji(pet.hunger)}</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${pet.hunger}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{pet.hunger}</span>
        </div>

        {/* 心情 */}
        <div className="flex items-center gap-2">
          <span className="text-sm">{getMoodEmoji(pet.mood)}</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${pet.mood}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{pet.mood}</span>
        </div>

        {/* 经验值 */}
        <div className="flex items-center gap-2">
          <span className="text-sm">⭐</span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${(pet.exp / (pet.level * 100)) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">
            {pet.exp}/{pet.level * 100}
          </span>
        </div>
      </div>
    </div>
  );
}