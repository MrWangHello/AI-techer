"use client";

import { PetData, getMoodEmoji, getHungerEmoji } from "@/lib/pet-data";

interface PetStatusProps {
  pet: PetData;
}

export default function PetStatus({ pet }: PetStatusProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100">
      <div className="text-center mb-4">
        <span className="text-xl font-bold text-pink-600">{pet.petName}</span>
        <span className="text-gray-300 mx-2">|</span>
        <span className="text-base text-gray-600">
          Lv.{pet.level}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getHungerEmoji(pet.hunger)}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${pet.hunger}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 w-10 text-right">{pet.hunger}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg">{getMoodEmoji(pet.mood)}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${pet.mood}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 w-10 text-right">{pet.mood}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${(pet.exp / (pet.level * 100)) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 w-16 text-right">
            {pet.exp}/{pet.level * 100}
          </span>
        </div>
      </div>
    </div>
  );
}