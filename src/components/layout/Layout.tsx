import { ReactNode } from "react";
import Navbar from "./Navbar";
import MinimalNavbar from "./MinimalNavbar";
import Footer from "./Footer";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ConnectionStatus } from "@/components/ui/connection-status";

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
      <main className="flex-1">
        {children}
      </main>
      {variant === "default" && <Footer />}
    </div>
  );
};

export default Layout;
