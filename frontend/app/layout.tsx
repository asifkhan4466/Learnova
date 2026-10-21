import type { Metadata } from "next";
import { Suspense } from "react";
import ClientRuntime from "./client-runtime";
import "./learnova.css";
export const metadata: Metadata = {
  title: "Learnova — Learn. Grow. Achieve.",
  description: "Build practical skill with Learnova. Explore expert-led courses, live classes, and learning paths for your next chapter.",
  icons: { icon: "/Logo.png" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><div id="root"><Suspense fallback={null}><ClientRuntime>{children}</ClientRuntime></Suspense></div></body></html>;
}
