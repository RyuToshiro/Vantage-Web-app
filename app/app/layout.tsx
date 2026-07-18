import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders — middleware already gates /app/**.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, credits")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        fullName={profile?.full_name ?? null}
        email={user.email ?? null}
        credits={profile?.credits ?? 0}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
