import { supabase } from "@/lib/supabase/client";
import type { HomeContent } from "@/lib/types/database";

export async function getFallbackCoverImageUrl(): Promise<string | null> {
  const { data, error } = await supabase.from("site_settings").select("fallback_cover_image_url").eq("id", 1).single();
  if (error) throw error;
  return data.fallback_cover_image_url;
}

// Matches the 0015 migration's column default - only used if the site_settings row is
// ever missing/malformed, since the DB default already covers the normal "never edited" case.
export const DEFAULT_HOME_CONTENT: HomeContent = {
  brandName: "Āgata",
  heroSubtitle: "Find a Hyderabad caterer for your wedding, birthday, or event — with real prices, upfront.",
  heroCtaLabel: "Browse caterers",
  worriesHeading: "Every host worries about three things",
  worries: [
    { title: "Taste", body: "Don't book blind. Order a sample tasting box from any caterer and taste the actual menu before you decide." },
    { title: "Presentation", body: "See real photos from real events — plating, buffet counters and live stations from each caterer's recent functions." },
    { title: "Trust in price", body: "Transparent per-plate prices, upfront. Quotes adjust instantly to your plate count — no phone calls, no haggling, no surprises." },
  ],
  section2Heading: "You enjoy the event. We'll handle the food.",
  section2Body:
    "Spend the day with your loved ones, not chasing the caterer. Every Āgata booking comes with a dedicated event manager for the day — and 10% off your booking value.",
  section2Tc: "T&C apply.",
  section2CtaLabel: "Find your caterer",
  features: [
    { title: "Browse caterers instantly", body: "See real packages and prices from Hyderabad caterers the moment you land — no forms first." },
    { title: "Filter as you go", body: "Plates, budget, cuisine, event type — every filter is optional, and prices update live." },
    { title: "Book directly", body: "Check availability or request a sample box. Our team follows up — no middleman markup." },
  ],
};

export async function getHomeContent(): Promise<HomeContent> {
  const { data, error } = await supabase.from("site_settings").select("home_content").eq("id", 1).single();
  if (error) throw error;
  return data.home_content ?? DEFAULT_HOME_CONTENT;
}
