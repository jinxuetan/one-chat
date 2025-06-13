import { env } from "@/env";
import FirecrawlApp from "@mendable/firecrawl-js";

export const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
