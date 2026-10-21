"use client";

import NextLink from "next/link";
import { useParams as nextParams, usePathname, useRouter, useSearchParams as nextSearch } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";

type Destination = string | { pathname?: string; search?: string; hash?: string };
function href(to: Destination) {
  return typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
}
function saveState(url: string, state: unknown) {
  try { sessionStorage.setItem(`learnova:navigation:${new URL(url, location.href).href}`, JSON.stringify(state ?? null)); } catch {}
}
type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { to: Destination; state?: unknown };
export function Link({ to, state, onClick, ...props }: LinkProps) {
  return <NextLink {...props} href={href(to)} onClick={event => {
    onClick?.(event);
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) saveState(href(to), state);
  }} />;
}
type NavProps = Omit<LinkProps, "className"> & { end?: boolean; className?: string | ((value: { isActive: boolean }) => string) };
export function NavLink({ to, end, className, ...props }: NavProps) {
  const pathname = usePathname() ?? "/";
  const target = href(to).split(/[?#]/)[0];
  const active = pathname === target || (!end && target !== "/" && pathname.startsWith(`${target}/`));
  const classes = typeof className === "function" ? className({ isActive: active }) : [className, active ? "active" : ""].filter(Boolean).join(" ");
  return <Link {...props} to={to} className={classes} aria-current={active ? "page" : undefined} />;
}
export function useNavigate() {
  const router = useRouter();
  return (to: Destination | number, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") { window.history.go(to); return; }
    const url = href(to);
    saveState(url, options?.state);
    if (options?.replace) router.replace(url); else router.push(url);
  };
}
export function useLocation() {
  const pathname = usePathname() ?? "/";
  const search = nextSearch()?.toString() ?? "";
  const route = `${pathname}${search ? `?${search}` : ""}`;
  const [transition, setTransition] = useState({ route, revision: 0 });
  let revision = transition.revision;
  // Revisiting a URL must not revive drafts stored under its earlier identity.
  // Adjust during render so consumers never commit the previous route's state.
  if (transition.route !== route) {
    revision += 1;
    setTransition({ route, revision });
  }
  let state = null;
  if (typeof window !== "undefined") {
    try { state = JSON.parse(sessionStorage.getItem(`learnova:navigation:${window.location.href}`) ?? "null"); } catch {}
  }
  return { pathname, search: search ? `?${search}` : "", hash: typeof window !== "undefined" ? window.location.hash : "", state, key: `${revision}:${route}` };
}
// All currently migrated dynamic segments are scalar [id] parameters.
export const useParams = nextParams as () => Record<string, string>;
export function useSearchParams() {
  const params = nextSearch() ?? new URLSearchParams();
  const navigate = useNavigate();
  const pathname = usePathname();
  return [params, (value: string | URLSearchParams) => navigate(`${pathname}?${value}`)] as const;
}
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => { if (replace) router.replace(to); else router.push(to); }, [router, to, replace]);
  return null;
}
const OutletContext = createContext<unknown>(null);
export function OutletProvider({ value, children }: { value: unknown; children: ReactNode }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}
export function useOutletContext<T = unknown>() { return useContext(OutletContext) as T; }
export function Outlet() { return null; }
