// ============================================================================
// AI provider abstraction. Every concrete provider (OpenAI, Anthropic,
// Gemini, Demo) implements this same interface so the rest of the app never
// needs to know which one is active.
// ============================================================================

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  /** System prompt built by the context builder (persona + retrieved memory/goals/journal context). */
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResult {
  content: string;
  /** True if this came from the no-credentials demo fallback rather than a real model. */
  isDemo: boolean;
}

export interface SummarizeOptions {
  text: string;
  instructions?: string;
}

export interface ExtractedMemory {
  category:
    | "about_me"
    | "goals"
    | "preferences"
    | "values"
    | "important_context"
    | "relationships"
    | "other";
  content: string;
  sourceExcerpt?: string;
}

export interface ExtractMemoriesOptions {
  text: string;
  /** Existing memory contents, so the model avoids proposing exact duplicates. */
  existingMemories?: string[];
}

export interface ReflectOptions {
  /** Free-form prompt describing what kind of reflection is needed (journal reflection, confused-mode synthesis, etc). */
  instructions: string;
  context: string;
}

export interface AIProvider {
  readonly name: string;
  chat(options: ChatOptions): Promise<ChatResult>;
  summarize(options: SummarizeOptions): Promise<string>;
  extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]>;
  reflect(options: ReflectOptions): Promise<string>;
}
