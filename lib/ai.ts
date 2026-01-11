import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { decrypt, decryptWithKey } from "./encryption";
import { getTenantKey } from "./tenant-encryption";
import prisma from "./prisma";
import { getAuthenticatedUser } from "./auth";

export type AIProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "groq"
  | "together";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AIResponse {
  content: string;
  raw?: any;
}

/**
 * Validates and corrects AI model names for each provider.
 * Maps common variations to the correct API model names.
 */
function validateAndCorrectModelName(
  provider: AIProvider,
  model: string
): string {
  const modelLower = model.toLowerCase();

  switch (provider) {
    case "gemini":
      // Gemini model name corrections (based on official Google AI docs)
      // Latest models as of 2026
      if (modelLower.includes("2.5") && modelLower.includes("flash")) {
        return "gemini-2.5-flash";
      }
      if (modelLower.includes("2.0") && modelLower.includes("flash")) {
        return "gemini-2.0-flash-exp";
      }
      if (modelLower.includes("1.5") && modelLower.includes("pro")) {
        return "gemini-1.5-pro";
      }
      if (modelLower.includes("1.5") && modelLower.includes("flash")) {
        return "gemini-1.5-flash";
      }
      if (modelLower === "gemini-pro" || modelLower === "gemini") {
        return "gemini-1.5-pro"; // Default to 1.5 Pro
      }
      if (modelLower.includes("pro-vision")) {
        return "gemini-1.5-pro-vision";
      }
      // Return as-is if already correct
      return model;

    case "openai":
      // OpenAI model name corrections
      if (modelLower.includes("gpt-4") && !modelLower.includes("turbo")) {
        return "gpt-4-turbo-preview";
      }
      if (modelLower === "gpt-3.5") {
        return "gpt-3.5-turbo";
      }
      if (modelLower === "gpt-4o") {
        return "gpt-4o";
      }
      return model;

    case "anthropic":
      // Anthropic model name corrections
      if (modelLower.includes("claude-3") && modelLower.includes("opus")) {
        return "claude-3-opus-20240229";
      }
      if (modelLower.includes("claude-3") && modelLower.includes("sonnet")) {
        return "claude-3-5-sonnet-20241022";
      }
      if (modelLower.includes("claude-3") && modelLower.includes("haiku")) {
        return "claude-3-5-haiku-20241022";
      }
      return model;

    case "groq":
      // Groq model name corrections
      if (modelLower.includes("llama") && modelLower.includes("70b")) {
        return "llama-3.1-70b-versatile";
      }
      if (modelLower.includes("llama") && modelLower.includes("8b")) {
        return "llama-3.1-8b-instant";
      }
      if (modelLower.includes("mixtral")) {
        return "mixtral-8x7b-32768";
      }
      return model;

    case "together":
      // Together AI uses various model names, generally pass through
      return model;

    default:
      return model;
  }
}

/**
 * Fetches the AI configuration for the current tenant from the system settings.
 * Returns null if the AI is not configured.
 */
export async function getTenantAIConfig(): Promise<AIConfig | null> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        settingKey: {
          in: ["ai_provider", "ai_model", "ai_api_key", "ai_base_url"],
        },
      },
    });

    const config: Partial<AIConfig> = {};

    // Get current user's tenant context if available
    const user = await getAuthenticatedUser();
    const dbUser = user?.email
      ? await prisma.user.findUnique({
          where: { email: user.email },
          select: { tenantId: true },
        })
      : null;

    const tenantId = dbUser?.tenantId;
    const tenantKey = tenantId ? await getTenantKey(tenantId) : null;

    settings.forEach((s: any) => {
      let value = s.settingValue;
      if (s.isEncrypted) {
        // Try tenant key first, fallback to master key (legacy)
        if (tenantKey) {
          try {
            value = decryptWithKey(s.settingValue, tenantKey);
          } catch {
            value = decrypt(s.settingValue);
          }
        } else {
          value = decrypt(s.settingValue);
        }
      }

      if (s.settingKey === "ai_provider") config.provider = value as AIProvider;
      if (s.settingKey === "ai_model") config.model = value;
      if (s.settingKey === "ai_api_key") config.apiKey = value;
      if (s.settingKey === "ai_base_url") config.baseUrl = value;
    });

    if (!config.provider || !config.model || !config.apiKey) return null;

    // Validate and correct model name
    config.model = validateAndCorrectModelName(config.provider, config.model);

    return config as AIConfig;
  } catch (error) {
    console.error("Error fetching AI config:", error);
    return null;
  }
}

/**
 * Generates content using the tenant-configured AI provider.
 */
export async function generateAIContent(
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  const config = await getTenantAIConfig();

  if (!config) {
    throw new Error(
      "AI is not configured. Please go to Settings > AI to set up your API keys."
    );
  }

  try {
    switch (config.provider) {
      case "gemini":
        return await callGemini(config, prompt, systemPrompt);
      case "openai":
      case "groq":
      case "together":
        return await callOpenAICompatible(config, prompt, systemPrompt);
      case "anthropic":
        return await callAnthropic(config, prompt, systemPrompt);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  } catch (error: any) {
    console.error(`AI generation error (${config.provider}):`, error);
    throw new Error(error.message || "Failed to generate AI content");
  }
}

async function callGemini(
  config: AIConfig,
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  const genAI = new GoogleGenerativeAI(config.apiKey);
  // Gemini 1.5 allows system instructions in the model configuration
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return { content: response.text() };
}

async function callOpenAICompatible(
  config: AIConfig,
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  // Groq and Together AI are OpenAI-compatible, we just need to set the base URL
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  });

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  return { content: response.choices[0].message.content || "" };
}

async function callAnthropic(
  config: AIConfig,
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  const anthropic = new Anthropic({ apiKey: config.apiKey });

  const response = await anthropic.messages.create({
    model: config.model,
    system: systemPrompt,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  return {
    content: textContent && "text" in textContent ? textContent.text : "",
  };
}
