import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Generator } from "@/components/app/Generator";

export default async function NewTourPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <Generator userId={user.id} />;
}
