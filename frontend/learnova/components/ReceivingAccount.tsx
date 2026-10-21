import type { LegacyValue } from "../../lib/legacy-types";
import { useState, useRef } from "react";
import useBatches from "../utils/useBatches";
import { saveReceivingAccount, deleteReceivingAccount, receivingAccounts, setReceivingAccountStatus } from "../utils/batchStorage";

const fields = [["accountHolderName","Account Holder Name"],["accountNumber","Account / IBAN / Wallet Number"],["providerName","Bank / Wallet Provider"],["paymentMethod","Payment Method (Bank or Wallet)"]];
export default function ReceivingAccount({editable=false, role="admin", selectable=false, selectedId="", onSelect, title="Receiving Bank / Wallet Accounts"}: LegacyValue) {
 const formRef=useRef<LegacyValue>(null);
 const state=useBatches(), accounts=receivingAccounts(state, !editable);
 const [draft,setDraft]=useState<Record<string, LegacyValue>>({}), [message,setMessage]=useState("");
 return <section className="receiving-account"><h2>{title}</h2>
 {editable && <><p>Add accounts where students can send their course payment. Saved accounts appear below and during enrollment.</p><form ref={formRef} onSubmit={(event: LegacyValue)=>{event.preventDefault();try{saveReceivingAccount(draft,role);setDraft({});setMessage(draft.id ? "Account updated." : "Account saved below. You can add another account.");}catch(error: LegacyValue){setMessage(error.message);}}}>{fields.map(([key,label]: LegacyValue)=><label key={key}>{label}<input required value={draft[key] || ""} onChange={(event: LegacyValue)=>setDraft({...draft,[key]:event.target.value})}/></label>)}<button type="submit">{draft.id ? "Save Changes" : "Save Account"}</button>{draft.id && <button type="button" onClick={()=>{setDraft({});setMessage("");}}>Cancel Edit</button>}</form></>}
 {message && <p role="status">{message}</p>}
 {editable && <h3>Saved Accounts</h3>}
 <div className="receiving-account-list">{accounts.map((account: LegacyValue)=><article key={account.id} className={selectable && selectedId === account.id ? "selected" : ""}>{selectable && <label className="receiving-account-choice"><input type="radio" name="receivingAccount" value={account.id} checked={selectedId === account.id} onChange={() => onSelect?.(account.id)} /> Use this account</label>}<h3>{account.providerName}</h3><dl>{fields.map(([key,label]: LegacyValue)=><div key={key}><dt>{label}</dt><dd>{account[key]}</dd></div>)}{editable && <div><dt>Status</dt><dd>{account.status}</dd></div>}</dl>{editable && <div className="receiving-account-actions"><button type="button" onClick={()=>{setDraft({...account});setMessage("");formRef.current?.scrollIntoView({behavior:"smooth",block:"center"});formRef.current?.querySelector("input")?.focus({preventScroll:true});}}>Edit</button><button type="button" onClick={()=>{try{setReceivingAccountStatus(account.id,account.status==="Active"?"Inactive":"Active",role);setMessage(`Account ${account.status==="Active"?"deactivated":"activated"}.`);}catch(error: LegacyValue){setMessage(error.message);}}}>{account.status==="Active"?"Deactivate":"Activate"}</button><button type="button" onClick={()=>{if(!window.confirm("Delete this receiving account?")) return;try{deleteReceivingAccount(account.id,role);if(draft.id===account.id)setDraft({});setMessage("Account deleted.");}catch(error: LegacyValue){setMessage(error.message);}}}>Delete</button></div>}</article>)}</div>
 {!accounts.length && <p>No receiving accounts added yet.</p>}
 </section>;
}
