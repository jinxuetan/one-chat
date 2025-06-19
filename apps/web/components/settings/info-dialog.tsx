"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Separator } from "@workspace/ui/components/separator";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import {
  CircleHelp,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Search,
  Share2,
  Shield,
  Sparkles,
  Twitter,
  Volume2,
} from "lucide-react";

export const InfoDialog = () => {
  const { open: sidebarOpen } = useSidebar();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <CircleHelp />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[90vh] max-w-[90%] overflow-y-auto md:max-w-2xl",
          sidebarOpen && "md:left-[calc(50%+8rem)]"
        )}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
            About OneChat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* App Description */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm leading-relaxed">
              A high-performance, open-source AI chat application built for the{" "}
              <a
                href="https://cloneathon.t3.chat/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                T3 Cloneathon
                <ExternalLink className="h-3 w-3" />
              </a>
              . Experience lightning-fast conversations with multiple AI models,
              enhanced with modern features for the ultimate chat experience.
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
              <div className="flex items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Multiple AI Providers</p>
                  <p className="text-muted-foreground text-xs">
                    OpenAI, Gemini, Anthropic, OpenRouter with 20+ models
                    including DeepSeek, Qwen & Llama3
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium text-sm">
                    BYOK (Bring Your Own Keys)
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Securely encrypted API keys stored locally with validation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                <div>
                  <p className="font-medium text-sm">Multi-Modal Support</p>
                  <p className="text-muted-foreground text-xs">
                    File attachments, image generation, syntax highlighting for
                    code & math
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Volume2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">Voice Features</p>
                  <p className="text-muted-foreground text-xs">
                    Text-to-Speech (OpenAI & Google) and real-time
                    Speech-to-Text
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Search className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-500" />
                <div>
                  <p className="font-medium text-sm">Web Search Integration</p>
                  <p className="text-muted-foreground text-xs">
                    Native search (Gemini) and tool-based search (FireCrawl) for
                    all models
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Share2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-pink-500" />
                <div>
                  <p className="font-medium text-sm">Advanced Sharing & Sync</p>
                  <p className="text-muted-foreground text-xs">
                    Real-time stream sharing, chat branching, and global
                    low-latency access
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                🧠 <span>Reasoning Models</span>
              </Badge>
              <Badge variant="secondary">
                🎨 <span>AI Personalization</span>
              </Badge>
              <Badge variant="secondary">
                🌙 <span>Dark/Light Theme</span>
              </Badge>
              <Badge variant="secondary">
                ⚡ <span>Resumable Streams</span>
              </Badge>
              <Badge variant="secondary">
                🔄 <span>Real-time Sync</span>
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Connect Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">
              Connect with the Developer
            </h3>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a
                  href="https://github.com/BharathxD/one-chat"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a
                  href="https://x.com/Bharath_uwu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-4 w-4" />
                  Follow on X
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4">
            <p className="text-center text-muted-foreground text-xs">
              Built with ❤️ using Next.js 15, React 19, TypeScript, and
              TailwindCSS
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
