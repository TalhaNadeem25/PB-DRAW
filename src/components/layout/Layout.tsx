import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationListener />
      <ConnectionStatus />
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
