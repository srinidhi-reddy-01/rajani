import { supabase } from "@/lib/supabase/client";
import type { Cuisine, EventType } from "@/lib/types/database";

export async function getCuisines(): Promise<Cuisine[]> {
  const { data, error } = await supabase.from("cuisines").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getEventTypes(): Promise<EventType[]> {
  const { data, error } = await supabase.from("event_types").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
