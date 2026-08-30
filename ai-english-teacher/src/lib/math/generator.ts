export type MathOp = "+" | "-";

export interface MathQuestion {
  a: number;
  b: number;
  op: MathOp;
  answer: number;
  scenario: string;
  emoji: string;
}

const SCENARIOS = [
  { name: "小猴摘桃", emoji: "🍑", template: (a: number, b: number, ans: number, op: MathOp) =>
    op === "+"
      ? `小猴子摘了 ${a} 个桃，又摘 ${b} 个，一共几个？`
      : `小猴子有 ${a} 个桃，吃了 ${b} 个，还剩几个？` },
  { name: "喂 Bella 鱼", emoji: "🐟", template: (a: number, b: number, _ans: number, op: MathOp) =>
    op === "+"
      ? `Bella 有 ${a} 条鱼，又得到 ${b} 条，一共几条？`
      : `Bella 有 ${a} 条鱼，送给朋友 ${b} 条，还剩几条？` },
  { name: "数气球", emoji: "🎈", template: (a: number, b: number, _ans: number, op: MathOp) =>
    op === "+"
      ? `天空有 ${a} 个气球，又飘来 ${b} 个，一共几个？`
      : `有 ${a} 个气球，飞走了 ${b} 个，还剩几个？` },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestion(grade: 1 | 2 | 3 = 1): MathQuestion {
  const op: MathOp = Math.random() > 0.5 ? "+" : "-";
  let a: number;
  let b: number;

  if (grade === 1) {
    if (op === "+") {
      a = randInt(1, 9);
      b = randInt(1, 10 - a);
    } else {
      a = randInt(2, 10);
      b = randInt(1, a - 1);
    }
  } else if (grade === 2) {
    if (op === "+") {
      a = randInt(10, 50);
      b = randInt(1, 50);
    } else {
      a = randInt(20, 99);
      b = randInt(1, a - 1);
    }
  } else {
    if (op === "+") {
      a = randInt(1, 20);
      b = randInt(1, 20);
    } else {
      a = randInt(10, 30);
      b = randInt(1, a);
    }
  }

  const answer = op === "+" ? a + b : a - b;
  const scene = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

  return {
    a,
    b,
    op,
    answer,
    scenario: scene.template(a, b, answer, op),
    emoji: scene.emoji,
  };
}

export function renderEmojiCount(n: number, emoji: string): string {
  return emoji.repeat(Math.min(n, 10)) + (n > 10 ? `×${n}` : "");
}
