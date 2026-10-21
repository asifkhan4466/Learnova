import type { LegacyValue } from "../../../lib/legacy-types";
import ReceivingAccount from "../../components/ReceivingAccount";
import { useState } from "react";
import useBatches from "../../utils/useBatches";
import { paymentRecords, approvePayment, rejectPayment } from "../../utils/batchStorage";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";


const columns = [["student", "Student"], ["studentId", "Student ID"], ["course", "Course"], ["batch", "Batch"], ["method", "Payment Method"], ["senderName", "Sender Name"], ["senderAccount", "Sender Account"], ["receiver", "Receiving Account"], ["transactionId", "Transaction ID"], ["amount", "Amount"], ["date", "Date"], ["status", "Status", (row: LegacyValue) => <span className="sa-status" data-status={row.status}>{row.status}</span>]];
function receivingDetails(row: LegacyValue) {
  let account = row.receivingAccount;
  if (typeof account === "string") {
    try { account = JSON.parse(account); } catch { account = null; }
  }
  return {
    holder: account?.accountHolderName || account?.owner || row.receivingAccountHolderName || "Not provided",
    provider: account?.providerName || account?.provider || row.receivingAccountProvider || "Not provided",
    number: account?.accountNumber || account?.number || row.receivingAccountNumber || "Not provided",
    method: account?.paymentMethod || account?.method || row.paymentMethod || row.method || "Not provided",
  };
}
function detailRenderer(row: LegacyValue) {
  const account = receivingDetails(row);
  const receipt = row.receipt || row.proof || row.receiptMetadata;
  return <div className="payment-detail-modal">
    <div className="payment-detail-status" data-status={row.status}>{row.status || "Pending"}</div>
    <section><h3>Student Information</h3><div className="payment-detail-grid"><div><span>Student Name</span><strong>{row.studentName || row.student || "Not provided"}</strong></div><div><span>Student ID</span><strong>{row.studentId || "Not provided"}</strong></div></div></section>
    <section><h3>Course &amp; Enrollment</h3><div className="payment-detail-grid"><div><span>Course</span><strong>{row.courseTitle || row.course || "Not provided"}</strong></div><div><span>Batch</span><strong>{row.batch || "Awaiting assignment"}</strong></div><div><span>Enrollment Status</span><strong>{row.enrollmentStatus || row.status || "Not provided"}</strong></div></div></section>
    <section><h3>Payment Information</h3><div className="payment-detail-grid"><div><span>Payment Method</span><strong>{row.paymentMethod || row.method || "Not provided"}</strong></div><div><span>Transaction ID</span><strong>{row.transactionId || row.studentTransactionId || "Not provided"}</strong></div><div><span>Amount</span><strong>{row.amount || "Not provided"}</strong></div><div><span>Payment Date</span><strong>{row.paymentDate || row.submittedAt || row.date || "Not provided"}</strong></div><div><span>Status</span><strong>{row.status || "Pending"}</strong></div></div></section>
    <section className="payment-receiving-card"><h3>Receiving Account</h3><div className="payment-detail-grid"><div><span>Account Holder Name</span><strong>{account.holder}</strong></div><div><span>Bank / Wallet Provider</span><strong>{account.provider}</strong></div><div><span>Account / IBAN / Wallet Number</span><strong>{account.number}</strong></div><div><span>Payment Method</span><strong>{account.method}</strong></div></div></section>
    <section><h3>Payment Proof</h3>{receipt ? <div className="payment-proof-row"><strong>{receipt.fileName || receipt.name || "Uploaded receipt"}</strong>{(receipt.fileData || receipt.url) && <a href={receipt.fileData || receipt.url} target="_blank" rel="noreferrer">View / Open</a>}</div> : <p className="payment-detail-empty">No receipt uploaded</p>}</section>
  </div>;
}
export default function Payments() {
  const rows = paymentRecords(useBatches());
  const [message, setMessage] = useState("");
  const approval = (row: LegacyValue) => <><div className="payment-detail-actions">{row.status === "Pending" && <button type="button" className="payment-approve" onClick={() => {
    try { approvePayment(row.transactionId, "subadmin"); setMessage("Payment approved. Course assigned to student."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }}>Approve Payment</button>}{row.status === "Pending" && <button className="payment-reject" onClick={()=>{try{rejectPayment(row.transactionId,"subadmin");setMessage("Request rejected; no course access granted.");}catch(error: LegacyValue){setMessage(error.message);}}}>Reject Request</button>}</div>{message && <p className="payment-detail-alert" role="status">{message}</p>}</>;

  
  return <div className="sa-record-page"><SuperAdminRecords detailAction={approval} detailRenderer={detailRenderer} paginate filters={[["course","Courses"],["method","Payment Methods"]]} title="Payments & Verification" subtitle="Review student payment transactions and verification status." heading={<AdminHeading title="Payments & Verification" subtitle="Review student payment transactions and verification status." icon="briefcase"/>} rows={rows} columns={columns}>
    <ReceivingAccount editable role="subadmin"/><AdminSummary items={[["Total Payments", rows.length, "briefcase"], ["Approved", rows.filter((r: LegacyValue) => r.status === "Approved").length, "check"], ["Pending", rows.filter((r: LegacyValue) => r.status === "Pending").length, "clock"], ["Rejected", rows.filter((r: LegacyValue) => r.status === "Rejected").length, "close"]]}/>
  </SuperAdminRecords></div>;
}
