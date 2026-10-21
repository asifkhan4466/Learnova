import type { LegacyValue } from "../../lib/legacy-types";


const paths: LegacyValue = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
  design: "m4 16 12-12 4 4L8 20H4v-4Zm9-9 4 4M4 4h5M4 8h2",
  chart: "M4 3v17h17M8 15v-4m5 4V7m5 8V4",
  phone: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm2 16h4",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
  database: "M20 6c0 2-3.6 3-8 3S4 8 4 6s3.6-3 8-3 8 1 8 3Zm-16 0v12c0 2 3.6 3 8 3s8-1 8-3V6M4 12c0 2 3.6 3 8 3s8-1 8-3",
  book: "M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Zm0 0v15",
  briefcase: "M8 6V3h8v3M3 6h18v14H3V6Zm0 6c6 3 12 3 18 0m-9 0v4",
  cap: "m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v9",
  target: "M20 12a8 8 0 1 1-8-8m4 8a4 4 0 1 1-4-4m0 4 9-9m-5 0h5v5",
  users: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2m0-17a4 4 0 0 1 0 8m3 3a6 6 0 0 1 3 6",
  video: "M3 5h12v14H3V5Zm12 5 6-4v12l-6-4",
  award: "M16 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM8 13 6 22l6-3 6 3-2-9M6 3h12v12H6V3Z",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-10-6v6l4 2",
  check: "m5 12 4 4L19 6",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  play: "m9 5 11 7-11 7V5Z",
  globe: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c5 5 5 15 0 20-5-5-5-15 0-20Z",
};

export default function PublicIcon({ name, className = "" }: LegacyValue) {
  return <svg className={`public-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] || paths.book} /></svg>;
}
