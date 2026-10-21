import OriginalLayout from "@/learnova/layouts/TeacherLayout";
// The migrated UI mounts after hydration because it initializes browser storage.
export const instant = false;
export default function Layout({ children }: { children: React.ReactNode }) { return <OriginalLayout>{children}</OriginalLayout>; }
