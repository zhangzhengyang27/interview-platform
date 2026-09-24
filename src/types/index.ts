export type Difficulty = "easy" | "medium" | "hard";
export type Mastery = "unsolved" | "learning" | "mastered";
export type PracticeStatus = "completed" | "failed";
export type QuestionType = "code" | "qa";

export interface Question {
  id: string;
  title: string;
  content: string;
  solution?: string | null;
  codeTemplate?: Record<string, string> | null;
  questionType: QuestionType;
  difficulty: Difficulty;
  source?: string;
  mastery: Mastery;
  isBookmarked: boolean;
  tags: { tag: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  company?: string;
  questionIds: string[];
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeRecord {
  id: string;
  questionId: string;
  status: PracticeStatus;
  durationSeconds?: number;
  attemptedAt: string;
}

export interface TestCase {
  input: string;
  expected: string;
  isPublic: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
