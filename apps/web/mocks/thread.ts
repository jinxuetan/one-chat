export const MOCK_USER_ID = "user_mock_123";

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

export const mockThreads = [
  // TODAY - Recent activity
  {
    id: "thread_today_1",
    title: "Why does my code work on my machine but not in production?",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(today.getTime() + 2 * 60 * 60 * 1000),
    lastMessageAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: "thread_today_2",
    title: "How to center a div (Yes, I'm asking this in 2024)",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: new Date(today.getTime() + 4 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 4 * 60 * 60 * 1000),
    lastMessageAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "thread_today_3",
    title: "Explain async/await like I'm 5 (but I have 10 years experience)",
    userId: MOCK_USER_ID,
    visibility: "public" as const,
    originThreadId: null,
    createdAt: today,
    updatedAt: today,
    lastMessageAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
  },

  // YESTERDAY - The classic "it was working yesterday" scenarios
  {
    id: "thread_yesterday_1",
    title: "Help! I accidentally deleted node_modules... again",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: yesterday,
    updatedAt: yesterday,
    lastMessageAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
  },
  {
    id: "thread_yesterday_2",
    title: "Is it bad practice to have 47 useEffect hooks in one component?",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: yesterday,
    updatedAt: yesterday,
    lastMessageAt: new Date(yesterday.getTime() + 12 * 60 * 60 * 1000),
  },

  // LAST 7 DAYS - Weekly struggles
  {
    id: "thread_week_1",
    title: "CSS is easy they said. It'll be fun they said.",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: threeDaysAgo,
    updatedAt: threeDaysAgo,
    lastMessageAt: threeDaysAgo,
  },
  {
    id: "thread_week_2",
    title: "TypeScript errors that make me question my life choices",
    userId: MOCK_USER_ID,
    visibility: "public" as const,
    originThreadId: null,
    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
    lastMessageAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "thread_week_3",
    title: "Redux vs Zustand vs useContext: The eternal battle",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    lastMessageAt: oneWeekAgo,
  },

  // LAST 30 DAYS - Monthly existential crises
  {
    id: "thread_month_1",
    title: "Should I rewrite everything in Rust? (Spoiler: No)",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: twoWeeksAgo,
    updatedAt: twoWeeksAgo,
    lastMessageAt: twoWeeksAgo,
  },
  {
    id: "thread_month_2",
    title: "Docker: Because it works on my container",
    userId: MOCK_USER_ID,
    visibility: "public" as const,
    originThreadId: null,
    createdAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000),
    lastMessageAt: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000),
  },
  {
    id: "thread_month_3",
    title: "Why my API returns 200 but the data is cursed",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: oneMonthAgo,
    updatedAt: oneMonthAgo,
    lastMessageAt: oneMonthAgo,
  },

  // OLDER - Ancient wisdom
  {
    id: "thread_old_1",
    title: "jQuery to React migration: A developer's journey through hell",
    userId: MOCK_USER_ID,
    visibility: "public" as const,
    originThreadId: null,
    createdAt: threeMonthsAgo,
    updatedAt: threeMonthsAgo,
    lastMessageAt: threeMonthsAgo,
  },
  {
    id: "thread_old_2",
    title: "The Great Semicolon Debate of 2023",
    userId: MOCK_USER_ID,
    visibility: "private" as const,
    originThreadId: null,
    createdAt: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000),
    lastMessageAt: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000),
  },
];
