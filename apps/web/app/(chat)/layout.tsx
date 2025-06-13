import { AppSidebar } from "@/components/nav/sidebar";
import { SidebarInset } from "@workspace/ui/components/sidebar";

const ChatLayout = ({ children }: Readonly<React.PropsWithChildren>) => (
  <>
    <AppSidebar />
    <SidebarInset>{children}</SidebarInset>
  </>
);

export default ChatLayout;
