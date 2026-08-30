# 测试用例目录（固化到代码）

> 原则：一条用户说法 = 一条可跑用例。目录在 `src/lib/eval/feature-catalog.ts`。

## 1. 自动化分层

| 层 | 命令 | 文件 |
|----|------|------|
| 功能目录 | `npx vitest run src/lib/eval` | `feature-catalog.test.ts`（~50 条短语） |
| 意图/技能 | `npm run test` | `orchestrator.test.ts` 等 |
| 页面 | `npm run test:e2e` | `e2e/features.spec.ts` `e2e/study-content.spec.ts` `e2e/catalog.spec.ts` |
| 全量 | `npm run test:all` | 以上全部 |

沙箱**不能**测真实麦克风/扬声器。STT/TTS 用文字模拟 + 真机清单。

## 2. 目录驱动用例（语音 → 期望）

由 `FEATURE_CASES` 自动生成，禁止只改测试不改目录。

覆盖：帮助、四 Tab 导航、学英语、英/中查词、每日英语、测验（进 UI）、汉字拼音句子古诗成语美句、口算、1加1、应用题（出题+判分）、故事笑话、天气百科、宠物四动作、签到、装扮占位、你好。

## 3. 专项用例（已有）

| 编号 | 场景 | 文件 |
|------|------|------|
| U-MATH-01 | 1加1=2 | orchestrator / evaluate / e2e |
| U-MATH-02 | 口算开始 + 10个 | orchestrator / drill-answer |
| U-MATH-03 | 口算中说故事被拦截 | orchestrator |
| U-MATH-04 | 键盘 1+0 再确定 | e2e features |
| U-MATH-05 | 应用题出题 + 说数字判对错 | orchestrator / word-problem-skills / e2e |
| U-QUIZ-01 | 「考我/测验」进入单词测验 UI | orchestrator / e2e features |
| U-DICT-01 | 书本→book、apple→苹果 | local-dictionary |
| U-STT-01 | 美剧→美句 | normalize / orchestrator / e2e |
| U-WIKI-01 | 猫/恐龙离线 | wiki.test / e2e |
| U-HINT-01 | 各 section 有引导文案 | voice-hints.test |

## 4. 真机手工清单（无法自动化）

部署后在 **手机 Chrome** 勾选：

- [ ] 轻点麦克风能识别一句中文
- [ ] 长按能连续说
- [ ] 设置 1.7x 试听有快慢差
- [ ] 讲故事有声音
- [ ] 口算语音说答案能进入下一题
- [ ] 应用题说数字能判对错
- [ ] 「考我」进入单词测验并点选项
- [ ] 弱网下查词不进错误页（本地词库）

## 5. 给后续 AI 的规则

1. 新语音指令：先加 `FEATURE_CASES` 再实现，CI 会红
2. 改变 intent 名：同步改 catalog `expected.intent`
3. 不要用 E2E 测真实 Speech API
4. `status=broken` 的功能禁止在 hint 里承诺未实现的能力
