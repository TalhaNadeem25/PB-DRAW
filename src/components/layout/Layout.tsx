import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { ReactNode } from "react";
import Footer from "./Footer";
import MinimalNavbar from "./MinimalNavbar";
import MobileNav from "./MobileNav";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  variant?: "default" | "minimal" | "auth";
}

const Layout = ({ children, variant = "default" }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <NotificationListener />
      <ConnectionStatus />
      {variant === "default" && <Navbar />}
      {variant === "minimal" && <MinimalNavbar />}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      {variant === "default" && <Footer />}
      <MobileNav />
    </div>
  );
};

export default Layout;
