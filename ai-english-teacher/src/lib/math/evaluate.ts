const CN_DIGIT: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function parseNumber(token: string): number | null {
  const t = token.trim();
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  if (t in CN_DIGIT) return CN_DIGIT[t];
  if (t === "十") return 10;
  const m = t.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
  if (m) {
    const tens = m[1] ? CN_DIGIT[m[1]] : 1;
    const ones = m[2] ? CN_DIGIT[m[2]] : 0;
    return tens * 10 + ones;
  }
  return null;
}

export interface ParsedExpr {
  a: number;
  op: "+" | "-" | "*" | "/";
  b: number;
}

export function parseMathExpression(text: string): ParsedExpr | null {
  const cleaned = text
    .replace(/[？?。！!，,\s]/g, "")
    .replace(/等于几|是多少|多少|呢|吗/g, "");

  const m = cleaned.match(
    /^(\d+|[零一二两三四五六七八九十]+)\s*(加|减|乘|除以?|\+|\-|\*|×|÷|\/)\s*(\d+|[零一二两三四五六七八九十]+)/
  );
  if (!m) return null;

  const a = parseNumber(m[1]);
  const b = parseNumber(m[3]);
  if (a === null || b === null) return null;

  const opRaw = m[2];
  let op: ParsedExpr["op"];
  if (/加|\+/.test(opRaw)) op = "+";
  else if (/减|\-/.test(opRaw)) op = "-";
  else if (/乘|\*|×/.test(opRaw)) op = "*";
  else op = "/";

  return { a, op, b };
}

export function compute(a: number, op: ParsedExpr["op"], b: number): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? null : Math.floor(a / b);
    default:
      return null;
  }
}

const OP_SPEAK: Record<ParsedExpr["op"], string> = {
  "+": "加",
  "-": "减",
  "*": "乘",
  "/": "除以",
};

export function formatMathQuestion({ a, op, b }: ParsedExpr): string {
  return `${a} ${OP_SPEAK[op]} ${b} 等于几？`;
}

export function formatMathAnswer({ a, op, b }: ParsedExpr, result: number): string {
  return `${a} ${OP_SPEAK[op]} ${b} 等于 ${result}！`;
}

export function tryEvaluateFromText(text: string): { expr: ParsedExpr; result: number; reply: string } | null {
  const expr = parseMathExpression(text);
  if (!expr) return null;
  const result = compute(expr.a, expr.op, expr.b);
  if (result === null) return null;
  return { expr, result, reply: formatMathAnswer(expr, result) };
}

/** 口算进行中：用户只说了数字 */
export function parseAnswerNumber(text: string): number | null {
  const t = text.trim().replace(/[。！？!?\s]/g, "");
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  if (t in CN_DIGIT) return CN_DIGIT[t];
  return null;
}
