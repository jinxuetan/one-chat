import { AppSidebar } from "@/components/nav/sidebar";

const DashboardLayout = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <>
      <AppSidebar />
      <main className="relative flex-1">{children}</main>
    </>
  );
};

export default DashboardLayout;
