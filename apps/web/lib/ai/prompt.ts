interface UserSettings {
  name: string;
  occupation: string;
  traits: string[];
  additionalContext: string;
  responseStyle: "concise" | "detailed" | "balanced";
  usePersonalization: boolean;
}

interface SystemPromptOptions {
  selectedModel: string;
  searchStrategy?: "tool" | "native" | "off";
  isImageGeneration?: boolean;
  userSettings?: UserSettings | null;
}

const getFormattedDateTime = (): string => {
  return new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

const getPersonalizationSection = (userSettings: UserSettings): string => {
  const { name, occupation, traits, additionalContext, responseStyle } =
    userSettings;

  let personalization = "";

  if (name) {
    personalization += `\n- Address the user as ${name}`;
  }

  if (occupation) {
    personalization += `\n- The user is a ${occupation}`;
  }

  if (traits.length > 0) {
    personalization += `\n- Adopt these traits: ${traits.slice(0, 5).join(", ")}`;
  }

  if (responseStyle !== "balanced") {
    const styleMap = {
      concise: "Keep responses brief and to the point",
      detailed: "Provide comprehensive, detailed explanations",
    };
    personalization += `\n- ${styleMap[responseStyle]}`;
  }

  if (additionalContext.trim()) {
    personalization += `\n- Context: ${additionalContext.slice(0, 200)}${additionalContext.length > 200 ? "..." : ""}`;
  }

  return personalization;
};

const BASE_SYSTEM_PROMPT = (
  model: string,
  dateTime: string,
  userSettings?: UserSettings | null
) => {
  const personalization = userSettings?.usePersonalization
    ? getPersonalizationSection(userSettings)
    : "";

  return `You are OneChat, an AI assistant powered by the ${model} model. Your role is to assist and engage in conversation while being helpful, respectful, and engaging.${personalization}
- If you are specifically asked about the model you are using, you may mention that you use the ${model} model. If you are not asked specifically about the model you are using, you do not need to mention it.
- The current date and time including timezone is ${dateTime}.
- Always use LaTeX for mathematical expressions:
    - Inline math must be wrapped in escaped parentheses: \( content \)
    - Do not use single dollar signs for inline math
    - Display math must be wrapped in double dollar signs: $$ content $$
- Ensure code is properly formatted using Prettier with a print width of 80 characters.
- Present code in Markdown code blocks with the correct language extension indicated.`;
};

const IMAGE_GENERATION_PROMPT = () =>
  "You are OneChat, an AI assistant powered by image generation capabilities. Your role is to assist and engage in conversation while being helpful, respectful, and engaging. You can generate images based on user prompts. Do not include image URLs in your response as the generated image will be automatically displayed in the UI.";

const WEB_SEARCH_PROMPT = (
  model: string,
  dateTime: string,
  userSettings?: UserSettings | null
) =>
  `${BASE_SYSTEM_PROMPT(model, dateTime, userSettings)}
- You can use the webSearch tool to search the web for up-to-date information. Answer based on the sources provided when using web search.`;

export const getSystemPrompt = (options: SystemPromptOptions): string => {
  const { selectedModel, searchStrategy, isImageGeneration, userSettings } =
    options;

  if (isImageGeneration) {
    return IMAGE_GENERATION_PROMPT();
  }

  const dateTime = getFormattedDateTime();

  if (searchStrategy === "tool") {
    return WEB_SEARCH_PROMPT(selectedModel, dateTime, userSettings);
  }

  return BASE_SYSTEM_PROMPT(selectedModel, dateTime, userSettings);
};
