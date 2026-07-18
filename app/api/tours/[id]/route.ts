import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { presentTour } from "@/lib/tours";
import type { Tour } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
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
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Tour not found." }, { status: 404 });
  }

  const tour = await presentTour(data as Tour, supabase);
  return NextResponse.json({ tour });
}
