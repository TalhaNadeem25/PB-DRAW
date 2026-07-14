import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import Footer from "./Footer";
import MinimalNavbar from "./MinimalNavbar";
import MobileNav from "./MobileNav";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  variant?: "default" | "minimal" | "auth";
}

const isNative = Capacitor.isNativePlatform();

const Layout = ({ children, variant = "default" }: LayoutProps) => {
  return (
    <div className="h-dvh md:h-auto md:min-h-screen flex flex-col">
      <NotificationListener />
      {variant === "default" && <Navbar />}
      {variant === "minimal" && <MinimalNavbar />}
      <main className={`flex-1 min-h-0 overflow-y-auto md:overflow-y-visible${variant === "default" ? " md:pb-0" : ""}`}>
        {children}
        {variant === "default" && <div className="hidden md:block"><Footer /></div>}
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
