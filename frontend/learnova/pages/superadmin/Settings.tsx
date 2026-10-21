import type { LegacyValue } from "../../../lib/legacy-types";

import PublicIcon from "../../components/PublicIcon";
import { useState } from "react";

const defaults = { enrollmentUpdates: true, paymentUpdates: true, learningUpdates: true, showHelp: true };
const storageKey = "learnova_admin_preferences";
const preferences = [["enrollmentUpdates", "Enrollment notifications"], ["paymentUpdates", "Payment review notifications"], ["learningUpdates", "Live class and assignment notifications"], ["showHelp", "Show LMS guidance"]];
export default function Settings() {
  const [values, setValues] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return Object.fromEntries(Object.entries(defaults).map(([key, value]: LegacyValue) => [key, typeof saved?.[key] === "boolean" ? saved[key] : value]));
    } catch { return defaults; }
  });
  const [message, setMessage] = useState("");
  function save(event: LegacyValue) {
    event.preventDefault();
    try { localStorage.setItem(storageKey, JSON.stringify(values)); setMessage("Preferences saved in this browser. Platform-wide integration will follow in a later step."); }
    catch { setMessage("Preferences could not be saved in this browser."); }
  }
  return <section className="admin-settings">
    <header className="ast-banner"><div><h1>Settings</h1><p>Manage platform identity and your notification and learning preferences.</p></div><blockquote>&ldquo;Better settings.<br/>A brighter learning tomorrow.&rdquo;<cite>&mdash; Learnova</cite></blockquote><PublicIcon name="spark"/></header>
    <div className="ast-layout"><nav className="ast-navigation" aria-label="Settings sections"><a href="#platform-identity"><PublicIcon name="globe"/><span><strong>General Settings</strong><small>Platform information</small></span></a><a href="#platform-branding"><PublicIcon name="design"/><span><strong>Branding</strong><small>Logo and visual identity</small></span></a><a href="#notification-preferences"><PublicIcon name="book"/><span><strong>Notification Settings</strong><small>Learning and payment updates</small></span></a></nav><div className="ast-content">
    <section className="ast-panel" id="platform-identity"><h2>General Settings</h2><p>Current platform identity and super administrator preferences.</p><div className="ast-fields"><div><span>Platform Name</span><p>Learnova</p></div><div><span>Platform Tagline</span><p>Learn. Grow. Achieve.</p></div><div><span>Portal</span><p>Super Admin Portal</p></div><div><span>Access Level</span><p>Full Access</p></div></div></section>
    <div className="ast-bottom"><section className="admin-settings-brand" id="platform-branding"><h2>Branding</h2><p>Official logo and shared Learnova theme.</p><div className="ast-logo"><img src="/Logo.png" alt="Learnova"/><p>The official logo and brand palette stay consistent across all portals.</p></div><h3>Brand Colors</h3><div className="ast-swatches">{[["Blue","--learnova-blue"],["Cyan","--learnova-cyan"],["Purple","--learnova-purple"],["Navy","--learnova-navy"]].map(([name,variable]: LegacyValue) => <div key={name}><span style={{background: `var(${variable})`}}/><small>{name}</small></div>)}</div></section>
    <form onSubmit={save} id="notification-preferences"><h2>Notification Settings</h2><p>Choose your notification and LMS preferences.</p>{preferences.map(([key, label]: LegacyValue) => <label key={key}><span>{label}</span><input type="checkbox" role="switch" checked={values[key]} onChange={(event: LegacyValue) => { setValues({ ...values, [key]: event.target.checked }); setMessage(""); }} /></label>)}<button type="submit">Save Preferences</button>{message && <p role="status">{message}</p>}</form></div></div></div>
  </section>;
}
