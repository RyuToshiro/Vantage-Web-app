import "server-only";

export type GenerationMode = "mock" | "live";

export function getGenerationMode(): GenerationMode {
  return process.env.GENERATION_MODE?.trim().toLowerCase() === "live" ? "live" : "mock";
}

/**
 * Single entry point for the whole generation pipeline. Callers (the
 * /api/generate route) fire this without awaiting it to completion so the
 * client can poll /api/tours/[id] for progress.
 */
export async function processTour(tourId: string, userId: string): Promise<void> {
  if (getGenerationMode() === "live") {
    const { processTourLive } = await import("./live");
    return processTourLive(tourId);
  }
  const { processTourMock } = await import("./mock");
  return processTourMock(tourId, userId);
}
