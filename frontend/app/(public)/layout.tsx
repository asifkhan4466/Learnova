"use client";
import Navbar from "@/learnova/components/Navbar";
import Footer from "@/learnova/components/Footer";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><Navbar />{children}<Footer /></>;
}
