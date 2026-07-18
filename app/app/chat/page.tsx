import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/chat/Chat";

export default async function ChatPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <Chat userId={user.id} />;
}
