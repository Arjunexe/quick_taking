import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DashboardClient } from "./DashboardClient";
import { getNotes } from "@/actions/notes";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/signin");
    }

    const { notes } = await getNotes();

    return (
        <div className="min-h-screen">
            <Navbar user={session.user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DashboardClient initialNotes={notes} />
            </main>
        </div>
    );
}
