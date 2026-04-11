import { describe, it, expect } from "vitest";
import {
  EI_QUIZ_QUESTIONS,
  calculatePillarScores,
  getEILevel,
} from "../shared/eiQuizData";

// ── Question bank integrity ───────────────────────────────────────────────────
describe("EI Quiz question bank", () => {
  it("has exactly 25 questions", () => {
    expect(EI_QUIZ_QUESTIONS).toHaveLength(25);
  });

  it("has 5 questions per pillar", () => {
    const pillars = ["self-awareness", "self-regulation", "motivation", "empathy", "social-skills"];
    for (const pillar of pillars) {
      const count = EI_QUIZ_QUESTIONS.filter((q) => q.pillar === pillar).length;
      expect(count, `pillar ${pillar} should have 5 questions`).toBe(5);
    }
  });

  it("every question has exactly 4 options", () => {
    for (const q of EI_QUIZ_QUESTIONS) {
      expect(q.options, `question ${q.id} should have 4 options`).toHaveLength(4);
    }
  });

  it("every option has a score between 1 and 4", () => {
    for (const q of EI_QUIZ_QUESTIONS) {
      for (const opt of q.options) {
        expect(opt.score, `option ${opt.id} score out of range`).toBeGreaterThanOrEqual(1);
        expect(opt.score, `option ${opt.id} score out of range`).toBeLessThanOrEqual(4);
      }
    }
  });

  it("every question has a unique id", () => {
    const ids = EI_QUIZ_QUESTIONS.map((q) => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── Score calculation ─────────────────────────────────────────────────────────
describe("calculatePillarScores", () => {
  it("returns 100% when all answers are max score (4)", () => {
    const answers: Record<string, number> = {};
    for (const q of EI_QUIZ_QUESTIONS) {
      answers[q.id] = 4;
    }
    const scores = calculatePillarScores(answers);
    expect(scores.selfAwareness).toBe(100);
    expect(scores.selfRegulation).toBe(100);
    expect(scores.motivation).toBe(100);
    expect(scores.empathy).toBe(100);
    expect(scores.socialSkills).toBe(100);
    expect(scores.total).toBe(100);
  });

  it("returns 25% when all answers are min score (1)", () => {
    const answers: Record<string, number> = {};
    for (const q of EI_QUIZ_QUESTIONS) {
      answers[q.id] = 1;
    }
    const scores = calculatePillarScores(answers);
    expect(scores.selfAwareness).toBe(25);
    expect(scores.selfRegulation).toBe(25);
    expect(scores.motivation).toBe(25);
    expect(scores.empathy).toBe(25);
    expect(scores.socialSkills).toBe(25);
    expect(scores.total).toBe(25);
  });

  it("returns 0 for missing answers (empty object)", () => {
    const scores = calculatePillarScores({});
    expect(scores.selfAwareness).toBe(0);
    expect(scores.total).toBe(0);
  });

  it("calculates mixed scores correctly", () => {
    const answers: Record<string, number> = {};
    // Self-awareness questions: sa1-sa5 all score 4 → 100%
    const saQuestions = EI_QUIZ_QUESTIONS.filter((q) => q.pillar === "self-awareness");
    for (const q of saQuestions) answers[q.id] = 4;
    // Self-regulation questions: sr1-sr5 all score 1 → 25%
    const srQuestions = EI_QUIZ_QUESTIONS.filter((q) => q.pillar === "self-regulation");
    for (const q of srQuestions) answers[q.id] = 1;
    // Others: score 2 → 50%
    const otherQuestions = EI_QUIZ_QUESTIONS.filter(
      (q) => q.pillar !== "self-awareness" && q.pillar !== "self-regulation"
    );
    for (const q of otherQuestions) answers[q.id] = 2;

    const scores = calculatePillarScores(answers);
    expect(scores.selfAwareness).toBe(100);
    expect(scores.selfRegulation).toBe(25);
    expect(scores.motivation).toBe(50);
    expect(scores.empathy).toBe(50);
    expect(scores.socialSkills).toBe(50);
    // total = (100 + 25 + 50 + 50 + 50) / 5 = 55
    expect(scores.total).toBe(55);
  });
});

// ── EI Level classification ───────────────────────────────────────────────────
describe("getEILevel", () => {
  it("returns Emerging for scores 0-34", () => {
    expect(getEILevel(0)).toBe("Emerging");
    expect(getEILevel(20)).toBe("Emerging");
    expect(getEILevel(34)).toBe("Emerging");
  });

  it("returns Developing for scores 35-54", () => {
    expect(getEILevel(35)).toBe("Developing");
    expect(getEILevel(45)).toBe("Developing");
    expect(getEILevel(54)).toBe("Developing");
  });

  it("returns Proficient for scores 55-74", () => {
    expect(getEILevel(55)).toBe("Proficient");
    expect(getEILevel(65)).toBe("Proficient");
    expect(getEILevel(74)).toBe("Proficient");
  });

  it("returns Advanced for scores 75-89", () => {
    expect(getEILevel(75)).toBe("Advanced");
    expect(getEILevel(82)).toBe("Advanced");
    expect(getEILevel(89)).toBe("Advanced");
  });

  it("returns Exceptional for scores 90-100", () => {
    expect(getEILevel(90)).toBe("Exceptional");
    expect(getEILevel(95)).toBe("Exceptional");
    expect(getEILevel(100)).toBe("Exceptional");
  });
});

// ── Quiz router (public procedures) ──────────────────────────────────────────
describe("quiz.getQuestions (public procedure)", () => {
  it("returns 25 questions via tRPC caller", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: null,
      req: {} as never,
      res: { cookie: () => {}, clearCookie: () => {} } as never,
    };
    const caller = appRouter.createCaller(ctx as never);
    const questions = await caller.quiz.getQuestions();
    expect(questions).toHaveLength(25);
    expect(questions[0]).toHaveProperty("id");
    expect(questions[0]).toHaveProperty("pillar");
    expect(questions[0]).toHaveProperty("text");
    expect(questions[0]).toHaveProperty("options");
  });
});
