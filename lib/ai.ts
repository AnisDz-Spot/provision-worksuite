import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { decrypt } from "./encryption";
import prisma from "./prisma";

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

    settings.forEach((s: any) => {
      const value = s.isEncrypted ? decrypt(s.settingValue) : s.settingValue;
      if (s.settingKey === "ai_provider") config.provider = value as AIProvider;
      if (s.settingKey === "ai_model") config.model = value;
      if (s.settingKey === "ai_api_key") config.apiKey = value;
      if (s.settingKey === "ai_base_url") config.baseUrl = value;
    });

    if (!config.provider || !config.model || !config.apiKey) return null;

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
