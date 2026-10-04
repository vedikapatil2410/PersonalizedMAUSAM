// src/types/demoReliability.ts
/**
 * Types for Phase 25 Demo Reliability / Readiness checking.
 * No duplicate engines – this file only defines shape of the readiness state.
 */
import type { DemoScenarioId } from './index';

export interface DemoReadinessItem {
  id: string;
  title: string;
  description?: string;
  passed: boolean;
}

export interface DemoReadinessState {
  /** Whether a controlled demo has been started */
  demoStarted: boolean;
  /** Current demo scenario identifier */
  scenario: DemoScenarioId;
  /** Presentation step index (0‑based) */
  presentationStep: number;
}
