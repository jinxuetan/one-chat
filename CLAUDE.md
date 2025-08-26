# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneChat is an open-source AI chat application built on the T3 stack that provides access to multiple AI models (OpenAI, Anthropic, Google, open-source) in a single interface. The architecture includes real-time streaming, voice features, file attachments, web search, and conversation sharing.

## Common Development Commands

### Development Server
- `pnpm dev` - Start development server with Turbo (hot reload enabled)
- `pnpm start` - Start production server
- `pnpm build` - Build for production using Turbo

### Code Quality
- `pnpm lint` - Run ultracite linter
- `pnpm format` - Format code using ultracite
- `pnpm tc` - TypeScript type checking (in apps/web)

### Database Operations
- `pnpm db:generate` - Generate Drizzle schema
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio for database inspection

### UI Components
- `pnpm ui:shadcn` - Add new Shadcn UI components (run from root)
- `cd apps/web && pnpx shadcn@canary add COMPONENT` - Alternative method

### Utilities
- `pnpm clean` - Clean build artifacts and node_modules
- `pnpm wh` - Start ngrok webhook tunnel for development

## Architecture Overview

### Monorepo Structure
- **TurboRepo** manages the monorepo with workspace dependencies
- **apps/web** - Main Next.js application
- **packages/** - Shared workspace packages
- **biome.json** - Uses ultracite configuration for linting/formatting

### Tech Stack Core
- **Next.js 15** with **React 19** and TypeScript
- **TailwindCSS 4** for styling
- **tRPC** for type-safe API routes with React Query integration
- **Drizzle ORM** with PostgreSQL (Neon)
- **Better Auth** for authentication with Google OAuth
- **Vercel AI SDK** for model integrations
- **Redis (Upstash)** for real-time messaging and caching

### Key Directories

#### `/apps/web/lib/`
- `ai/` - AI model configuration, prompts, and provider setup
- `auth/` - Authentication server/client configuration using Better Auth
- `db/` - Drizzle schema, migrations, and database connection
- `trpc/` - tRPC server/client setup and type definitions
- `actions/` - Server actions for streaming, images, threads, web search
- `cache/` - Thread caching utilities
- `redis/` - Redis connection and rate limiting

#### `/apps/web/components/`
- `chat/` - Core chat interface components (messages, input, markdown rendering)
- `auth/` - OAuth buttons and user authentication UI
- `nav/` - Sidebar, navigation, and command palette
- `settings/` - User settings dialogs and API key management
- `byok/` - Bring Your Own Key (API key) management components

#### `/apps/web/hooks/`
Custom hooks for state management, local storage, voice transcription, message logic, etc.

### Authentication Flow
- Uses Better Auth with Google OAuth
- Session management through better-auth/next-js cookies
- Protected procedures in tRPC use auth context for authorization

### AI Integration
- Supports multiple providers: OpenAI, Anthropic, Google, OpenRouter
- Real-time streaming using Vercel AI SDK
- Model selection and configuration through `lib/ai/`
- BYOK (Bring Your Own Key) system for API key management

### Database Schema
- **Auth tables**: users, sessions, accounts (Better Auth schema)
- **Thread tables**: conversations, messages, attachments
- **Migrations**: Located in `lib/db/migrations/`

### Real-time Features
- Redis for WebSocket connections and message streaming
- Thread caching for performance
- Live conversation sharing with real-time updates

## Development Guidelines

### Code Style
- Use TypeScript throughout
- Follow early returns pattern for readability
- Use descriptive variable names with "handle" prefix for event functions
- Prefer const over function declarations
- Implement accessibility features (tabindex, aria-labels, keyboard handlers)

### Performance Rules
- Use Server Components by default, only add 'use client' for interactivity
- Leverage Next.js 15 explicit caching with `cache: 'force-cache'`
- Use React 19 `cache()` function for server-side data deduplication
- Implement code splitting with dynamic imports for large components
- Follow Core Web Vitals optimization (LCP, CLS, INP)

### UI Development
- Use Shadcn UI components with Tailwind for styling
- Mobile-first responsive design approach
- Use `next/image` for all image rendering
- Follow Radix UI patterns for accessibility

### Data Management
- Use tRPC for type-safe APIs with automatic React Query integration
- Drizzle ORM for database operations
- Server actions for complex operations (streaming, file uploads)
- Redis for caching and real-time features

## Testing and Quality

Run these commands before committing:
- `pnpm lint` - Ensure code follows project standards
- `pnpm tc` - Verify TypeScript types
- `pnpm build` - Confirm production build succeeds

The project uses ultracite (Biome-based) for linting and formatting with specific rule overrides in biome.json.