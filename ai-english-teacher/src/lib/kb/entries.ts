/** 云库拉下来的行（内存）。没配地址时始终为空，不当本机 JSON 库。 */

export type KbKind = "word" | "story" | "word_problem" | "joke";

export type KbWordPayload = { zh: string; en: string; sentence?: string };
export type KbStoryPayload = { title: string; text: string; followup?: string };
export type KbProblemPayload = { question: string; answer: number; explain?: string; emoji?: string };
export type KbJokePayload = { text: string };

export type KbEntry =
  | { id: string; kind: "word"; payload: KbWordPayload; enabled: boolean }
  | { id: string; kind: "story"; payload: KbStoryPayload; enabled: boolean }
  | { id: string; kind: "word_problem"; payload: KbProblemPayload; enabled: boolean }
  | { id: string; kind: "joke"; payload: KbJokePayload; enabled: boolean };

let rows: KbEntry[] = [];

export function getKbEntries(): KbEntry[] {
  return rows.filter((r) => r.enabled);
}

export function getKbWords(): KbWordPayload[] {
  return getKbEntries()
    .filter((r): r is Extract<KbEntry, { kind: "word" }> => r.kind === "word")
    .map((r) => r.payload);
}

export function getKbStories(): KbStoryPayload[] {
  return getKbEntries()
    .filter((r): r is Extract<KbEntry, { kind: "story" }> => r.kind === "story")
    .map((r) => r.payload);
}

export function getKbProblems(): KbProblemPayload[] {
  return getKbEntries()
    .filter((r): r is Extract<KbEntry, { kind: "word_problem" }> => r.kind === "word_problem")
    .map((r) => r.payload);
}

export function getKbJokes(): KbJokePayload[] {
  return getKbEntries()
    .filter((r): r is Extract<KbEntry, { kind: "joke" }> => r.kind === "joke")
    .map((r) => r.payload);
}

export function setKbEntries(next: KbEntry[]): void {
  rows = next.map((r) => ({ ...r, enabled: r.enabled !== false }));
}

export function resetKbEntries(): void {
  rows = [];
}
