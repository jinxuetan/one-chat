# Image Generation Code Cleanup

Clean up and optimize the image generation functionality to improve readability, maintainability, and performance.

## Problem Statement

The current image generation code has several issues:
- Mixed concerns: Image generation logic embedded in main chat route
- Redundant operations and verbose code
- Poor separation of concerns
- Inconsistent error handling patterns
- Duplicate attachment creation functions

## Completed Tasks

- [x] Initial analysis of current implementation
- [x] Identified cleanup opportunities
- [x] Create dedicated image generation handler
- [x] Simplify attachment creation flow
- [x] Extract reusable message creation logic
- [x] Consolidate duplicate functions
- [x] Improve error handling consistency

## In Progress Tasks

- [ ] Verify all functionality works correctly
- [ ] Performance testing

## Future Tasks

- [ ] Add comprehensive error handling
- [ ] Optimize database operations
- [ ] Add proper logging
- [ ] Create unit tests for new functions

## Implementation Plan

### 1. Extract Image Generation Logic
Create a dedicated handler for image generation that:
- Handles the complete image generation flow
- Uses clean, readable code patterns
- Proper error boundaries

### 2. Consolidate Attachment Functions
Remove duplicate functions and create a single, efficient attachment creation method

### 3. Simplify Main Route
Keep the main POST route clean with clear separation between:
- Regular text chat
- Image generation
- Common initialization logic

### Relevant Files

- `apps/web/app/api/chat/route.ts` - Main chat API route ✅ (cleaned up, reduced from 170+ to 6 lines for image generation)
- `apps/web/lib/actions/chat.ts` - Chat actions and database operations ✅ (removed duplicate `createAttachmentForUser` function)
- `apps/web/lib/actions/image.ts` - New dedicated image generation logic ✅ (created with clean, focused functions) 