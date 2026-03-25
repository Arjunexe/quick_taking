import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CEONavbar } from "@/components/CEONavbar";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import { getNotes } from "@/actions/notes";

export default async function CEODashboardPage() {
    const cookieStore = await cookies();
    const ceoCookie = cookieStore.get("ceo-session");

    if (ceoCookie?.value !== "authenticated") {
        redirect("/ceo");
    }

    const { notes } = await getNotes("ceo");

    return (
        <div className="min-h-screen">
            <CEONavbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DashboardClient initialNotes={notes} workspace="ceo" />
            </main>
        </div>
    );
}
