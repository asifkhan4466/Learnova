import type { LegacyValue } from "../../lib/legacy-types";
﻿import { useId } from "react";

export default function AdminCharts({ courses, enrollments, report = false }: LegacyValue){
 const id=useId();
 const months=new Map();
 for(const e of enrollments){const d=new Date(e.enrollmentDate);if(!Number.isNaN(d.getTime())){const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;months.set(key,(months.get(key)||0)+1);}}
 const points=[...months].sort(([a]: LegacyValue,[b]: LegacyValue)=>a.localeCompare(b)).reduce((list: LegacyValue,[month,count]: LegacyValue)=>[...list,{label:new Date(month+"-01T12:00:00").toLocaleDateString("en",{month:"short",year:"2-digit"}),value:(list.at(-1)?.value||0)+count}],[]);
 const max=Math.max(1,...points.map((p: LegacyValue)=>p.value));
 const coords=points.map((p: LegacyValue,i: LegacyValue)=>[48+i*400/Math.max(1,points.length-1),190-p.value/max*155]);
 const path=coords.map(([x,y]: LegacyValue,i: LegacyValue)=>`${i?"L":"M"}${x},${y}`).join(" ");
 const categories=[...new Set(courses.map((c: LegacyValue)=>c.category))].map((label: LegacyValue)=>({label,value:courses.filter((c: LegacyValue)=>c.category===label).length}));
 const top=[...courses].sort((a: LegacyValue,b: LegacyValue)=>Number(b.students||0)-Number(a.students||0)).slice(0,5);
 let offset=0;const colors=["#0068ff","#00bdd6","#843aff","#ffad16","#559eff","#031e50"];
 const gradient=categories.map((c: LegacyValue,i: LegacyValue)=>{const start=offset;offset+=c.value/Math.max(1,courses.length)*100;return `${colors[i%colors.length]} ${start}% ${offset}%`;}).join(",");
 return <div className="sa-two-col sa-charts"><section className="sa-panel"><h2>Enrollment Growth Trend</h2><p>Cumulative enrollments by recorded month</p><svg className="sa-line-chart" viewBox="0 0 480 230" role="img" aria-label={points.map((p: LegacyValue)=>`${p.label}: ${p.value} enrollments`).join(", ")||"No dated enrollments"}><defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0068ff" stopOpacity=".25"/><stop offset="1" stopColor="#0068ff" stopOpacity=".03"/></linearGradient></defs>{[0,1,2,3,4].map((n: LegacyValue)=><g key={n}><line x1="48" x2="455" y1={190-n*39} y2={190-n*39} stroke="#e5effc"/><text x="36" y={194-n*39} textAnchor="end">{Math.round(n*max/4)}</text></g>)}{coords.length>1&&<path d={`${path} L${coords.at(-1)[0]},190 L48,190 Z`} fill={`url(#${id})`}/>}<path d={path} fill="none" stroke="#0068ff" strokeWidth="3"/>{coords.map(([x,y]: LegacyValue,i: LegacyValue)=><g key={i}><circle cx={x} cy={y} r="5" fill="#0068ff" stroke="white"/><text x={x} y="217" textAnchor="middle">{points[i].label}</text><title>{points[i].value} enrollments</title></g>)}</svg></section>
 <section className="sa-panel"><h2>{report?"Top Courses by Enrollments":"Course Distribution"}</h2>{report?<div className="sa-column-chart">{top.map((c: LegacyValue,i: LegacyValue)=><div key={c.id}><strong>{c.students||0}</strong><span style={{height:`${Math.max(3,Number(c.students||0)/Math.max(1,...top.map((c: LegacyValue)=>Number(c.students||0)))*150)}px`,background:colors[i%colors.length]}}/><small>{c.title}</small></div>)}</div>:<div className="sa-distribution"><div className="sa-donut" style={{background:gradient?`conic-gradient(${gradient})`:"#e5effc"}}><div><strong>{courses.length}</strong><span>Courses</span></div></div><ul>{categories.map((c: LegacyValue,i: LegacyValue)=><li key={c.label}><i style={{background:colors[i%colors.length]}}/><span>{c.label}</span><strong>{c.value}</strong></li>)}</ul></div>}</section></div>;
}
