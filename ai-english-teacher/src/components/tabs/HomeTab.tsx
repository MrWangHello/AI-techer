"use client";

import VoiceHintBar from "@/components/VoiceHintBar";
import Card from "@/components/ui/Card";
import IconTile from "@/components/ui/IconTile";
import SpeakableText from "@/components/ui/SpeakableText";
import StatBlock from "@/components/ui/StatBlock";
import { TAB_VOICE_HINTS } from "@/lib/voice-hints";
import { ACHIEVEMENTS, getLevelTitle, type PetData } from "@/lib/pet-data";
import { SUBJECT_PINYIN } from "@/lib/study-nav";

const CAT_POSTER = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/white-cat.jpg`;

export default function HomeTab({
  pet,
  interactionFeed,
  voiceSpeed,
  onGoStudy,
  onGoPet,
  onFeed,
  onPlay,
}: {
  pet: PetData;
  interactionFeed: { icon: string; text: string; time: string }[];
  voiceSpeed: number;
  onGoStudy: (section: string) => void;
  onGoPet: () => void;
  onFeed: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="space-y-4 animate-slideUp">
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base opacity-90">Bella 等你来互动</p>
            <p className="text-2xl font-bold mt-1">
              Lv.{pet.level} {pet.petName}
            </p>
            <p className="text-sm opacity-80 mt-0.5">{getLevelTitle(pet.level)}</p>
          </div>
          <img
            src={CAT_POSTER}
            alt=""
            width={72}
            height={72}
            className="w-18 h-18 w-[72px] h-[72px] rounded-2xl object-cover border-2 border-white/40"
          />
        </div>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div
              key={d}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                d <= pet.checkInStreak ? "bg-white/30 text-white" : "bg-white/10 text-white/60"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <p className="text-sm mt-2 opacity-80">连续签到 {pet.checkInStreak} 天</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-700">状态概览</h3>
          <span className="text-sm text-gray-600">金币 {pet.coins}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl">{pet.hunger >= 60 ? "😋" : pet.hunger >= 30 ? "😶" : "😰"}</div>
            <div className="text-sm text-gray-600 mt-1">饱腹 {pet.hunger}</div>
          </div>
          <div>
            <div className="text-2xl">{pet.mood >= 60 ? "😄" : pet.mood >= 30 ? "😐" : "😢"}</div>
            <div className="text-sm text-gray-600 mt-1">心情 {pet.mood}</div>
          </div>
          <div>
            <div className="text-2xl">⭐</div>
            <div className="text-sm text-gray-600 mt-1">等级 {pet.level}</div>
          </div>
        </div>
        {pet.achievements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pet.achievements.slice(0, 3).map((id) => {
              const ach = ACHIEVEMENTS.find((a) => a.id === id);
              return ach ? (
                <span key={id} className="text-base" title={ach.desc}>
                  {ach.icon}
                </span>
              ) : null;
            })}
            {pet.achievements.length > 3 && (
              <span className="text-sm text-gray-500">+{pet.achievements.length - 3}</span>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-bold text-gray-700 mb-3">快捷入口</h3>
        <div className="grid grid-cols-3 gap-2">
          <IconTile icon="🇬🇧" label="英语" pinyin={SUBJECT_PINYIN.english} onClick={() => onGoStudy("english.words")} />
          <IconTile icon="📝" label="语文" pinyin={SUBJECT_PINYIN.chinese} onClick={() => onGoStudy("chinese.hanzi")} />
          <IconTile icon="🔢" label="数学" pinyin={SUBJECT_PINYIN.math} onClick={() => onGoStudy("math.drill")} />
          <IconTile icon="📖" label="阅读" pinyin={SUBJECT_PINYIN.reading} onClick={() => onGoStudy("reading.story")} />
          <IconTile icon="🔍" label="探索" pinyin={SUBJECT_PINYIN.explore} onClick={() => onGoStudy("explore.weather")} />
          <IconTile icon="🐱" label="宠物" pinyin="chǒng wù" onClick={onGoPet} />
        </div>
      </Card>

      <VoiceHintBar text={TAB_VOICE_HINTS.home} voiceSpeed={voiceSpeed} />

      <div className="grid grid-cols-3 gap-3">
        <IconTile icon="🍖" label="喂食" className="bg-white border border-pink-50" onClick={onFeed} />
        <IconTile icon="🎮" label="玩耍" className="bg-white border border-pink-50" onClick={onPlay} />
        <IconTile icon="📚" label="学习" className="bg-white border border-pink-50" onClick={() => onGoStudy("english.words")} />
      </div>

      <Card>
        <h3 className="text-base font-bold text-gray-700 mb-3">今日学习</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock value={pet.learnedWords.length} label="已学单词" accent="purple" />
          <StatBlock
            value={pet.quizTotal > 0 ? `${Math.round((pet.quizCorrect / pet.quizTotal) * 100)}%` : "0%"}
            label="测验正确率"
            accent="green"
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-bold text-gray-700 mb-3">最近互动</h3>
        {interactionFeed.length === 0 ? (
          <SpeakableText
            text="还没有互动记录，试试和 Bella 说话吧！"
            lang="zh"
            voiceSpeed={voiceSpeed}
            align="center"
            className="py-4"
            textClassName="text-base text-gray-500"
          />
        ) : (
          <div className="space-y-2">
            {interactionFeed.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-base text-gray-600">
                <span>{item.icon}</span>
                <span className="flex-1">{item.text}</span>
                <span className="text-sm text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
