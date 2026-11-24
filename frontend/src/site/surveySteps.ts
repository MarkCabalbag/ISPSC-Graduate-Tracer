/** The survey's steps, shared by the survey page and its frame (SurveyShell). */
export const STEPS = ["privacy", "about", "degree", "work", "check", "done"] as const;
export type Step = (typeof STEPS)[number];

export const TITLES: Record<Step, string> = {
  privacy: "Before you start",
  about: "About you",
  degree: "Your degree",
  work: "Your work",
  check: "Check your answers",
  done: "Survey complete",
};

/** The three numbered question steps; privacy, check and done carry no number. */
export const NUMBERED: Partial<Record<Step, 1 | 2 | 3>> = { about: 1, degree: 2, work: 3 };
