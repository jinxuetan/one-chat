# OneChat

![OG Image](https://www.1chat.tech/opengraph-image.jpg)

> Open-source AI chat application that brings together the best of multiple AI models in one seamless experience.

## What is OneChat?

OneChat is a modern AI chat platform that lets you access multiple AI models from different providers in a single interface. Instead of juggling multiple subscriptions and interfaces, you can compare responses from GPT-4o/4.1, Claude, Gemini, and other models.

We built this because switching between different AI chat apps was getting annoying, and frankly, most of them have pretty limited model selection. OneChat solves that by supporting 20+ models through both direct provider APIs and OpenRouter.

### Key Benefits

- **Multiple AI Models**: Access OpenAI, Anthropic, Google, and open-source models in one place
- **Real-Time Streaming**: See AI responses as they're generated, not after they're complete
- **Cross-Device Sync**: Your conversations sync between all your devices
- **Secure API Key Management**: Your keys are encrypted and stored locally
- **Advanced Features**: Voice input/output, file attachments, web search, and chat sharing

## Features

### AI Model Support
We support pretty much every major AI provider:
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google**: Gemini Pro, Gemini Ultra
- **Open Source Models**: Llama 3, Qwen, DeepSeek (through OpenRouter)
- **Many Others**: 20+ models and we're adding more regularly

### Real-Time Features
- Stream AI responses in real-time across all connected devices
- Share conversations with live updates - others can watch responses generate
- Resumable streams with global replication for low latency

### Voice & Speech
- Text-to-speech using OpenAI and Google models
- Real-time speech-to-text transcription with GPT-4o mini
- Works better than most browser-native speech recognition

### File Support & Media
- Upload multiple files (support varies by model)
- Generate images through OpenAI's GPT Image 1
- Syntax highlighting for code and math formulas

### Web Search
Two different search options:
- **Native Search**: Uses the model's built-in search (Gemini models only)
- **FireCrawl Integration**: Universal web search that works with all models

### Chat Management
- **Branching**: Try the same prompt with different models
- **Selective Sharing**: Share full conversations or just up to a specific message  
- **Reasoning Control**: Adjust how much reasoning models "think" before responding
- **Personalization**: Configure AI personality and response preferences

## Technical Stack

### Frontend
- **React 19** with **Next.js 15**
- **TypeScript** for type safety
- **TailwindCSS 4** for styling
- **tRPC** for type-safe APIs

### Backend
- **PostgreSQL 17** (Neon) for data storage
- **Redis** (Upstash) for real-time messaging and caching
- **Drizzle ORM** for database operations
- **Vercel AI SDK** for model integrations

### Infrastructure
- **TurboRepo** for monorepo management
- **Deployed on Vercel** with global edge optimization

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash works well)

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/your-username/one-chat.git
   cd one-chat
   pnpm install
   ```

2. **Environment setup**
   ```bash
   cd apps/web && cp .env.example .env.local
   # Add your database URLs and other config
   ```

3. **Database setup**
   ```bash
   pnpm db:generate && pnpm db:push
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

Open `http://localhost:3000` and you should be good to go.

### API Key Setup

You have a few options for API keys:

1. **OpenRouter** (easiest): One key gets you access to 20+ models
2. **Individual Providers**: Add keys for OpenAI, Anthropic, Google separately  
3. **Mix Both**: Use direct providers for some models, OpenRouter for others

All keys are encrypted before storage and never leave your device unencrypted.

## Usage

1. Sign in with Google
2. Add your API keys in settings
3. Start a new conversation and select your preferred model
4. Try out voice input, file uploads, or web search

### Tips
- Switch models mid-conversation to compare responses
- Use chat branching to explore different approaches to the same question
- Share conversations with colleagues (they'll see live updates)
- Enable voice mode for hands-free conversations

## Why We Built This

Most AI chat applications lock you into a single provider or have clunky interfaces for switching between models. We wanted something that made it easy to access the best models available without dealing with multiple subscriptions or comparing responses across different apps.

The real-time streaming and sharing features came from our own needs - sometimes you want to show someone how an AI is responding to a complex prompt, and static screenshots don't cut it.

## Performance Notes

We spent a lot of time optimizing for speed. The app uses aggressive caching, optimized database queries, and global CDN distribution. Most interactions should feel instant, and AI responses stream in real-time without buffering.

The backend is designed to handle multiple concurrent conversations efficiently, so response times shouldn't degrade as more people use the platform.

## Contributing

We welcome contributions! Here's how:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test them
4. Submit a pull request

### Development Guidelines
- Use TypeScript everywhere
- Follow the existing code style

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with the T3 stack and powered by AI models from OpenAI, Anthropic, Google, and the open-source community.

---

Questions? Issues? Feel free to open an issue or start a discussion.
