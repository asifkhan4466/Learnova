import type { LegacyValue } from "../../../lib/legacy-types";
import PublicSectionsEditor from "../../components/PublicSectionsEditor";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";
import { sections } from "../../utils/publicSections";
import { canManagePublicContent, currentSubAdminId } from "../../utils/adminPermissions";
import usePermissions from "../../utils/usePermissions";


export default function PublicContent() {
  const permissions = usePermissions();
  const allowed = sections.filter((s: LegacyValue) => canManagePublicContent("subadmin", currentSubAdminId, s.permission, permissions)).length;

  return (
    <section className="sa-page sa-public-content">
      <AdminHeading
        title="Public Website"
        subtitle="Manage public website sections allowed by your Super Admin."
        icon="globe"
      />
      <AdminSummary
        items={[
          ["Total Sections", sections.length, "globe"],
          ["Manageable", allowed, "check"],
          ["Restricted", sections.length - allowed, "close"],
          ["Status", allowed > 0 ? "Active" : "Restricted", "spark"],
        ]}
      />
      <PublicSectionsEditor role="subadmin" />
    </section>
  );
}
