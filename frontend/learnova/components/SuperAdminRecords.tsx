import type { LegacyValue } from "../../lib/legacy-types";

import { useRef, useState } from "react";

export default function SuperAdminRecords({ title, subtitle, rows, columns, action, actionLabel = "View", viewAction, viewLabel, detailAction, detailRenderer, heading, filters = [], paginate = false, children }: LegacyValue) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<LegacyValue>(null);
  const [choices, setChoices] = useState<Record<string, LegacyValue>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const dialog = useRef<LegacyValue>(null);
  const statuses = [...new Set(rows.map((row: LegacyValue) => row.status).filter(Boolean))];
  const visible = rows.filter((row: LegacyValue) => (!status || row.status === status) && filters.every(([key]: LegacyValue) => !choices[key] || String(row[key]) === choices[key]) && columns.some(([key]: LegacyValue) => String(row[key] ?? "").toLowerCase().includes(search.trim().toLowerCase())));
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pages);
  const displayed = paginate ? visible.slice((currentPage - 1) * pageSize, currentPage * pageSize) : visible;
  return <section className="admin-records">
    {heading || <header><h1>{title}</h1><p>{subtitle}</p></header>}
    {children}
    <div className="admin-records-tools">
      <input type="search" aria-label={`Search ${title}`} placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(event: LegacyValue) => { setSearch(event.target.value); setPage(1); }} />
      {filters.map(([key, label]: LegacyValue) => <select key={key} aria-label={`Filter ${label}`} value={choices[key] || ""} onChange={(event: LegacyValue) => { setChoices({...choices, [key]:event.target.value}); setPage(1); }}><option value="">All {label}</option>{[...new Set(rows.map((row: LegacyValue)=>row[key]).filter(Boolean))].map((value: LegacyValue)=><option key={value}>{value}</option>)}</select>)}
      {!!statuses.length && <select aria-label="Filter status" value={status} onChange={(event: LegacyValue) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map((value: LegacyValue) => <option key={value}>{value}</option>)}</select>}
      <span role="status">{visible.length} of {rows.length} records</span>
    </div>
    <div className="admin-records-table" tabIndex={"0" as unknown as number} aria-label={`${title} records`}><table>
      <thead><tr>{columns.map(([key, label]: LegacyValue) => <th key={key} scope="col">{label}</th>)}<th scope="col">Action</th></tr></thead>
      <tbody>{displayed.map((row: LegacyValue, index: LegacyValue) => <tr key={row.id ?? index}>{columns.map(([key, , render]: LegacyValue) => <td key={key}>{render ? render(row) : row[key] ?? "Not provided"}</td>)}<td><div className="admin-records-actions"><button type="button" onClick={() => viewAction ? viewAction(row) : (setSelected(row), dialog.current.showModal())}>{typeof viewLabel === "function" ? viewLabel(row) : viewLabel || actionLabel}</button>{action?.(row)}</div></td></tr>)}
        {!visible.length && <tr><td colSpan={columns.length + 1}>No matching records.</td></tr>}
      </tbody>
    </table></div>
    {paginate && <footer className="sa-records-pagination"><span role="status">Showing {visible.length ? (currentPage-1)*pageSize+1 : 0} to {Math.min(currentPage*pageSize,visible.length)} of {visible.length} records</span><select aria-label="Records per page" value={pageSize} onChange={(e: LegacyValue)=>{setPageSize(Number(e.target.value));setPage(1);}}>{[10,20,50].map((n: LegacyValue)=><option key={n} value={n}>{n} per page</option>)}</select><button disabled={currentPage===1} onClick={()=>setPage(currentPage-1)} aria-label="Previous page">&lsaquo;</button><span>{currentPage} / {pages}</span><button disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)} aria-label="Next page">&rsaquo;</button></footer>}
    <dialog ref={dialog} aria-labelledby="admin-record-title">
      <h2 id="admin-record-title">{title} &mdash; Details</h2>
      {selected && (detailRenderer ? detailRenderer(rows.find((row: LegacyValue) => row === selected || (row.transactionId && row.transactionId === selected.transactionId)) || selected) : <dl>{columns.map(([key, label]: LegacyValue) => <div key={key}><dt>{label}</dt><dd>{(rows.find((row: LegacyValue) => row === selected || (row.transactionId && row.transactionId === selected.transactionId)) || selected)[key] ?? "Not provided"}</dd></div>)}</dl>)}
      {selected && detailAction?.(rows.find((row: LegacyValue) => row === selected || (row.transactionId && row.transactionId === selected.transactionId)) || selected)}
      <form className="payment-detail-close" method="dialog"><button>Close</button></form>
    </dialog>
  </section>;
}
