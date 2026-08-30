/**
 * Mock Agent — 薄封装，导出统一入口
 * 意图识别：规则 Router（后续可换 LLM，Skill 层不变）
 */
export {
  handleUserMessage,
  processUserInput,
  type AgentResponse,
  type TabTarget,
} from "@/lib/core/orchestrator";
