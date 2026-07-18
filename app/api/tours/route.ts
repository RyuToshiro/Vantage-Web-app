import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { presentTours } from "@/lib/tours";
import type { Tour } from "@/lib/types";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: "Could not load tours." }, { status: 500 });
  }

  const tours = await presentTours((data ?? []) as Tour[], supabase);
  return NextResponse.json({ tours });
}
