import DashboardShell from "@/components/layout/DashboardShell";
import UsageTracker from "@/components/layout/UsageTracker";

export default function DashboardLayout({ children }) {
    return (
        <DashboardShell>
            <UsageTracker />
            {children}
        </DashboardShell>
    );
}
