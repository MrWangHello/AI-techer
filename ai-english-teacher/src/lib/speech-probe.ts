export type SttEngine = "webspeech" | "local" | "none";

export const STT_PREF_KEY = "bella_stt_pref";
export type SttPref = "auto" | "webspeech" | "local";

export function readSttPref(): SttPref {
  if (typeof window === "undefined") return "auto";
  const raw = window.localStorage.getItem(STT_PREF_KEY);
  if (raw === "webspeech" || raw === "local" || raw === "auto") return raw;
  return "auto";
}

export function writeSttPref(pref: SttPref): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STT_PREF_KEY, pref);
}

/** 荣耀/华为/QQ/微信/Firefox：API 在也不稳，或根本没有 STT */
export function isHighRiskSttUa(ua: string): boolean {
  const u = ua.toLowerCase();
  return (
    /huawei|honor|hmos|harmony/.test(u) ||
    /mqqbrowser|qq\//.test(u) ||
    /micromessenger/.test(u) ||
    /firefox\//.test(u) ||
    /ucbrowser|ubrowser/.test(u)
  );
}

export function hasWebSpeechApi(win: { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }): boolean {
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function decideSttEngine(input: {
  webSpeechApi: boolean;
  ua: string;
  pref: SttPref;
  localReady: boolean;
}): { engine: SttEngine; shouldPrefetch: boolean; reason: string } {
  const highRisk = isHighRiskSttUa(input.ua);

  if (input.pref === "local") {
    return {
      engine: input.localReady ? "local" : "none",
      shouldPrefetch: true,
      reason: "force-local",
    };
  }

  if (input.pref === "webspeech") {
    return {
      engine: input.webSpeechApi ? "webspeech" : "none",
      shouldPrefetch: false,
      reason: "force-webspeech",
    };
  }

  if (!input.webSpeechApi) {
    return {
      engine: input.localReady ? "local" : "none",
      shouldPrefetch: true,
      reason: "no-webspeech-api",
    };
  }

  if (highRisk) {
    return {
      engine: input.localReady ? "local" : "webspeech",
      shouldPrefetch: true,
      reason: "high-risk-ua",
    };
  }

  return {
    engine: "webspeech",
    shouldPrefetch: false,
    reason: "webspeech-ok",
  };
}
