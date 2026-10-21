import type { LegacyValue } from "../../lib/legacy-types";
﻿import PublicIcon from "./PublicIcon";


export default function AdminSummary({ items }: LegacyValue) {
  return <div className="sa-summary">{items.map(([label, value, icon]: LegacyValue, index: LegacyValue) =>
    <article key={label} className={`sa-summary-tone-${index % 4}`}>
      <span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div>
    </article>
  )}</div>;
}

export function AdminHeading({title, subtitle, icon = "book", children}: LegacyValue) {
  return <header className="sa-page-heading"><span className="sa-heading-icon"><PublicIcon name={icon}/></span><div><h1>{title}</h1><p>{subtitle}</p></div>{children}</header>;
}
