// src/types/demoPresentation.ts
/**
 * Types for the SIH Demo Presentation Mode.
 * These are temporary/session-only and orchestrate navigation through existing screens.
 */
import type { UserPersonaType, DemoScenarioId } from './index';

export type DemoPresentationStep = {
  /** Unique identifier for the step */
  id: string;
  /** Human-readable title shown on the step card */
  title: string;
  /** Short explanation presented to the judge */
  description: string;
  /** Destination screen name or special action identifier */
  destination: 'PersonalizedHome' | 'Alerts' | 'DataTransparency' | 'JudgeEvaluation' | 'None';
  /** Optional persona to set for this step */
  persona?: UserPersonaType;
  /** Optional weather scenario id to activate */
  weatherScenario?: DemoScenarioId;
  /** Optional location name */
  location?: string;
  /** What the judge should notice (extra note) */
  notice?: string;
  /** Step number (1-based) */
  stepNumber: number;
};

export type DemoPresentationScenario = {
  /** Identifier for the overall demo run */
  id: string;
  /** Ordered list of steps */
  steps: DemoPresentationStep[];
};

/**
 * Temporary UI state for the presentation.
 * This lives only while the DemoPresentationScreen is mounted.
 */
export type DemoPresentationState = {
  /** Index of the currently active step */
  currentStepIndex: number;
  /** Whether the demo is currently running */
  isRunning: boolean;
};
