import { CommandPalette } from "@/components/chat/command-palette";
import { AppSidebar } from "@/components/nav/sidebar";
import { SidebarActions } from "@/components/nav/sidebar-header";
import { SidebarInset } from "@workspace/ui/components/sidebar";

const ChatLayout = ({ children }: Readonly<React.PropsWithChildren>) => (
  <>
    <AppSidebar />
    <CommandPalette />
    <SidebarActions />
    <SidebarInset>{children}</SidebarInset>
  </>
);

export default ChatLayout;
