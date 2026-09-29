import Header from "../components/layout/Header";
import { EmptyState } from "../components/ui/States";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title, description, phaseNote }) {
  return (
    <div>
      <Header title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="This module arrives in a later phase"
        description={phaseNote || "Phase 1 establishes the layout and navigation for this section. Functionality is built out in the phase that owns it."}
      />
    </div>
  );
}
