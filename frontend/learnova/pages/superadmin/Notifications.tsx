
import NotificationsManagement from "../admin/Notifications";
import PublicIcon from "../../components/PublicIcon";

export default function Notifications() {
  return <section className="admin-notifications"><header className="an-banner"><div><h1>Notifications</h1><p>Manage alerts, reminders, and learning activity across your platform.</p></div><blockquote>&ldquo;Good communication builds<br/>stronger learners.&rdquo;<cite>&mdash; Learnova</cite></blockquote><PublicIcon name="arrow"/></header><NotificationsManagement adminView/></section>;
}
