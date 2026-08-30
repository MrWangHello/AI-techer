import type { SessionContext } from "@/lib/core/types";

let session: SessionContext = { channel: "web" };

export function getSession(): SessionContext {
  return { ...session };
}

export function updateSession(partial: Partial<SessionContext>): SessionContext {
  session = { ...session, ...partial };
  return getSession();
}

export function resetSessionChannel(channel: SessionContext["channel"]): void {
  session = { channel, lastStudySection: session.lastStudySection };
}
