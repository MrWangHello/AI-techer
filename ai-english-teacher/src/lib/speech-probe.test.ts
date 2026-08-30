import { describe, expect, it } from "vitest";
import { decideSttEngine, isHighRiskSttUa } from "./speech-probe";

describe("isHighRiskSttUa", () => {
  it("flags honor / huawei / qq / wechat / firefox", () => {
    expect(isHighRiskSttUa("Mozilla/5.0 Honor ALI-AN00")).toBe(true);
    expect(isHighRiskSttUa("Mozilla/5.0 HUAWEI")).toBe(true);
    expect(isHighRiskSttUa("MQQBrowser/11.0")).toBe(true);
    expect(isHighRiskSttUa("MicroMessenger")).toBe(true);
    expect(isHighRiskSttUa("Firefox/128.0")).toBe(true);
  });

  it("lets normal Chrome through", () => {
    expect(isHighRiskSttUa("Mozilla/5.0 Chrome/126.0.0.0 Mobile Safari/537.36")).toBe(false);
  });
});

describe("decideSttEngine", () => {
  it("does not prefetch when Chrome Web Speech looks fine", () => {
    const d = decideSttEngine({
      webSpeechApi: true,
      ua: "Mozilla/5.0 Chrome/126.0.0.0",
      pref: "auto",
      localReady: false,
    });
    expect(d.engine).toBe("webspeech");
    expect(d.shouldPrefetch).toBe(false);
  });

  it("prefetches on honor even if API exists", () => {
    const d = decideSttEngine({
      webSpeechApi: true,
      ua: "Mozilla/5.0 Honor",
      pref: "auto",
      localReady: false,
    });
    expect(d.shouldPrefetch).toBe(true);
    expect(d.engine).toBe("webspeech");
  });

  it("uses cached local on high-risk when ready", () => {
    const d = decideSttEngine({
      webSpeechApi: true,
      ua: "Mozilla/5.0 Honor",
      pref: "auto",
      localReady: true,
    });
    expect(d.engine).toBe("local");
    expect(d.shouldPrefetch).toBe(true);
  });

  it("prefetches when there is no Web Speech API", () => {
    const d = decideSttEngine({
      webSpeechApi: false,
      ua: "Mozilla/5.0 Firefox/128.0",
      pref: "auto",
      localReady: false,
    });
    expect(d.engine).toBe("none");
    expect(d.shouldPrefetch).toBe(true);
  });
});
