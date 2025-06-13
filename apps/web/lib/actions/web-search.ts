import { firecrawl } from "@/lib/firecrawl";
import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description: "Search the web for up-to-date information",
  parameters: z.object({
    query: z.string().describe("The query to search for"),
  }),
  execute: async ({ query }) => {
    const crawlResponse = await firecrawl.search(query, {
      limit: 3,
      scrapeOptions: {
        formats: ["markdown"],
      },
    });
    if (!crawlResponse.success) {
      throw new Error(`Failed to crawl: ${crawlResponse.error}`);
    }
    return crawlResponse.data;
  },
});
