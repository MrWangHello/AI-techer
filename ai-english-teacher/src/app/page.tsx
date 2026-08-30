"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";
import HomeTab from "@/components/tabs/HomeTab";
import PetTab from "@/components/tabs/PetTab";
import StudyTab from "@/components/tabs/StudyTab";
import SettingsTab from "@/components/tabs/SettingsTab";
import { initKnowledgeBase } from "@/lib/kb/cloud";
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
  ACHIEVEMENTS,
  PetData,
} from "@/lib/pet-data";
import { speak, stopSpeaking } from "@/lib/speech";
import { isSpeechSupported, isSTTSupported } from "@/lib/speech";
import type { AgentResponse } from "@/lib/mock-agent";
import type { ContentCard } from "@/lib/core/types";
import type { MathQuestion } from "@/lib/math/generator";
import { getStreak } from "@/lib/math/drill-state";
import { submitDrillAnswer } from "@/lib/skills/math-skills";
import { loadDefaultContentForSection } from "@/lib/study-content-loader";
import { Word, loadWordBatch, refreshWordBatch } from "@/lib/words";
import type { Tab } from "@/lib/app-nav";
import type { PetAction } from "@/components/Cat3D";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [pet, setPet] = useState<PetData>({ ...loadPetData() });
  const [petLoaded, setPetLoaded] = useState(false);
  const [agentEmotion, setAgentEmotion] = useState<"happy" | "sad" | "surprised" | "neutral" | "thinking">("neutral");
  const [petAction, setPetAction] = useState<PetAction>("idle");
  const [lastReply, setLastReply] = useState<string>("");
  const [lastUserText, setLastUserText] = useState<string>("");
  const [checkinMsg, setCheckinMsg] = useState<string>("");
  const [achievementMsg, setAchievementMsg] = useState<string>("");
  const [interactionFeed, setInteractionFeed] = useState<{ icon: string; text: string; time: string }[]>([]);
  const [showPetNameInput, setShowPetNameInput] = useState(false);
  const [newPetName, setNewPetName] = useState("");
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
  const speedPreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakWithSpeed = useCallback(
    (text: string, onEnd?: () => void) => {
      speak(text, onEnd, pet.voiceSpeed);
    },
    [pet.voiceSpeed]
  );

  useEffect(() => {
    setPet(loadPetData());
    setPetLoaded(true);
    setSpeechSupported(isSpeechSupported());
    setSttSupported(isSTTSupported());
    setStudyWords(loadWordBatch());
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "home" || tab === "pet" || tab === "study" || tab === "settings") {
      setActiveTab(tab);
    }
    void initKnowledgeBase().then(() => {
      setStudyWords(loadWordBatch());
    });
  }, []);

  useEffect(() => {
    if (petLoaded) {
      savePetData(pet);
    }
  }, [pet, petLoaded]);

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

  const addFeed = useCallback((icon: string, text: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setInteractionFeed((prev) => [{ icon, text, time }, ...prev].slice(0, 20));
  }, []);

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

  const applyStudySection = useCallback((section: string) => {
    setStudySection(section);
    const loaded = loadDefaultContentForSection(section);
    setContentCard(loaded.contentCard);
    setMathQuestion(loaded.mathQuestion);
    setMathStreak(getStreak());
  }, []);

  const handleAgentResponse = useCallback(
    (response: AgentResponse) => {
      setAgentEmotion(response.emotion);
      setLastReply(response.reply);

      if (response.navigate) {
        setActiveTab(response.navigate);
      }

      if (response.contentCard) {
        setContentCard(response.contentCard);
        if (response.contentCard.type === "math-drill") {
          const q = (response.contentCard.payload as { question?: MathQuestion })?.question;
          if (q) setMathQuestion(q);
        }
      } else if (response.studySection) {
        const loaded = loadDefaultContentForSection(response.studySection);
        if (loaded.contentCard) setContentCard(loaded.contentCard);
        if (loaded.mathQuestion) setMathQuestion(loaded.mathQuestion);
      }

      if (response.studySection) {
        setStudySection(response.studySection);
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
      const response = submitDrillAnswer(n);
      if (!response) return;
      handleAgentResponse(response);
      setCatSpeaking(true);
      speakWithSpeed(response.reply, () => setCatSpeaking(false));
    },
    [handleAgentResponse, speakWithSpeed]
  );

  const goStudy = useCallback(
    (section: string) => {
      setActiveTab("study");
      applyStudySection(section);
    },
    [applyStudySection]
  );

  const handleFeed = () => {
    setPetAction("eat");
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
    setPetAction("play");
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
    setPetAction("bathe");
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
    setPetAction("sleep");
    setPet((prev) => {
      const updated = sleepPet(prev);
      addFeed("💤", "Bella 睡觉了");
      setCatSpeaking(true);
      speakWithSpeed("晚安，做个好梦~", () => setCatSpeaking(false));
      setAgentEmotion("sad");
      return checkAndAwardAchievements(updated);
    });
  };

  const handlePetActionEnd = useCallback(() => {
    setPetAction("idle");
    setAgentEmotion("neutral");
  }, []);

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

  const previewVoiceSpeed = useCallback((speed: number) => {
    stopSpeaking();
    setCatSpeaking(true);
    speak(`当前语速 ${speed.toFixed(1)} 倍`, () => setCatSpeaking(false), speed);
  }, []);

  const handleVoiceSpeedSlider = (speed: number) => {
    setPet((prev) => ({ ...prev, voiceSpeed: speed }));
    if (speedPreviewTimer.current) clearTimeout(speedPreviewTimer.current);
    speedPreviewTimer.current = setTimeout(() => previewVoiceSpeed(speed), 500);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      coins={pet.coins}
      onCheckin={handleCheckin}
      onToggleAchievements={() => setShowAchievements((v) => !v)}
      achievementCount={pet.achievements.length}
      checkinMsg={checkinMsg}
      achievementMsg={achievementMsg}
      onDismissCheckin={() => setCheckinMsg("")}
      onDismissAchievement={() => setAchievementMsg("")}
      lastUserText={lastUserText}
      lastReply={lastReply}
      compactReply={activeTab === "study" && !!contentCard}
      onDismissReply={() => {
        setLastReply("");
        setLastUserText("");
      }}
      voiceSpeed={pet.voiceSpeed}
      onAgentResponse={handleAgentResponse}
      onTranscript={handleVoiceTranscript}
      onSpeakingChange={setCatSpeaking}
    >
      {activeTab === "home" && (
        <HomeTab
          pet={pet}
          interactionFeed={interactionFeed}
          voiceSpeed={pet.voiceSpeed}
          onGoStudy={goStudy}
          onGoPet={() => setActiveTab("pet")}
          onFeed={handleFeed}
          onPlay={handlePlay}
        />
      )}
      {activeTab === "pet" && (
        <PetTab
          pet={pet}
          mood={agentEmotion}
          action={petAction}
          speaking={catSpeaking}
          showAchievements={showAchievements}
          voiceSpeed={pet.voiceSpeed}
          onActionEnd={handlePetActionEnd}
          onTapCat={() => {
            setAgentEmotion("happy");
            setCatSpeaking(true);
            speakWithSpeed("嘿嘿，别戳我！", () => setCatSpeaking(false));
          }}
          onFeed={handleFeed}
          onPlay={handlePlay}
          onBathe={handleBathe}
          onSleep={handleSleep}
          onToggleAchievements={() => setShowAchievements((v) => !v)}
        />
      )}
      {activeTab === "study" && (
        <StudyTab
          pet={pet}
          studySection={studySection}
          contentCard={contentCard}
          mathQuestion={mathQuestion}
          mathStreak={mathStreak}
          words={studyWords}
          voiceSpeed={pet.voiceSpeed}
          onSectionChange={applyStudySection}
          onMathAnswer={handleMathAnswer}
          onRefreshContent={() => applyStudySection(studySection)}
          onWordLearned={handleWordLearned}
          onQuizResult={handleQuizResult}
        />
      )}
      {activeTab === "settings" && (
        <SettingsTab
          pet={pet}
          showPetNameInput={showPetNameInput}
          newPetName={newPetName}
          showResetConfirm={showResetConfirm}
          speechSupported={speechSupported}
          sttSupported={sttSupported}
          voiceSpeed={pet.voiceSpeed}
          onNewPetNameChange={setNewPetName}
          onStartRename={() => {
            setNewPetName(pet.petName);
            setShowPetNameInput(true);
          }}
          onRename={handleRenamePet}
          onCancelRename={() => setShowPetNameInput(false)}
          onVoiceSpeedSlider={handleVoiceSpeedSlider}
          onPreviewVoiceSpeed={previewVoiceSpeed}
          onShowReset={() => setShowResetConfirm(true)}
          onCancelReset={() => setShowResetConfirm(false)}
          onResetData={handleResetData}
        />
      )}
    </AppShell>
  );
}
