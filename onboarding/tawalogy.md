# Vendor onboarding spec: Tawalogy by Shriji Rasoi

Target vendor id: `877771c8-e5a9-43cc-9f31-92d9464b8270` (already exists — update it, do not create a new vendor).

## Profile

- Name: Tawalogy by Shriji Rasoi
- Description: Pure vegetarian and Jain food specialists with 18 years of catering experience. House warmings, birthday parties, corporate events and wedding functions. Customisable menus, starting from ₹400 per person. "Smells like Home, Tastes like Heaven."
- Phone: 9347219603
- Email (internal note): tawalogy@gmail.com
- Address: 417, Raichandani Business Bay, Kokapet, Hyderabad, 500075
- Area: Kokapet
- Established year: 2008 (18 years experience as of 2026)
- Cuisine specialities: North Indian + Jain/Pure Veg (use closest existing cuisines; add "Jain" to the cuisines table if not present)
- Event specialities: Wedding, Corporate event
- Google rating: 4.7 (self-stated on flyer; verify/refresh from GBP later)
- is_verified: false (Sri flips this manually after vetting)
- Status: leave as-is (onboarding) — Sri reviews then goes live from admin

## Menu categories and items (pure veg — all items veg)

Welcome drinks: Mojito, Jaljeera, Fruit Punch
Soups: Tomato Soup, Hot and Sour Soup, Manchow Soup
Starters: Kebab, Mini Samosa, Veg Manchurian, Noodles
Dal: Dal Fry, Dal Tadka, Dal Makhani
Curries: Paneer Curry, Seasonal Veg Curry (non-paneer)
Rice: Plain Rice, Jeera Rice, Biryani
Breads: Phulka, Poori, Tawa Paratha
Desserts: Halwa, Kheer, Gulab Jamun, Ice Cream
Included with every package (single category "Accompaniments", not selectable): Green Salad, Papad, Pickle, Raita, Chutney, Mouth Freshener, Water Bottles (250ml)

No dish prices (optional field — leave null).

## Packages (prices are per plate; vendor quotes flat, min 50 people)

### Package 1 — "₹799 Grand Package" — base_price_pp 799, min_plates 50
Selection rules:
- Welcome drinks: pick 1 (from Mojito, Jaljeera, Fruit Punch)
- Soups: pick 1
- Starters: pick 3
- Dal: pick 1
- Curries: pick 2 (one paneer + one non-paneer — enforce as pick 2 from Curries)
- Rice: pick 1 (note: Biryani ₹50/plate extra — put this note in package description)
- Breads: pick 1
- Desserts: pick 3
- Accompaniments: all included (display, not selectable)
Description: "Full festive spread. Includes salad, papad, pickle, raita, chutney, mouth freshener, water bottles, melamine plates and eco-friendly disposables. Biryani ₹50/plate extra. 5% GST applicable. Minimum 50 plates."
Default package: yes.

### Package 2 — "₹699 Classic Package" — base_price_pp 699, min_plates 50
Selection rules:
- Welcome drinks: pick 1 (Mojito, Jaljeera only)
- Starters: pick 2
- Dal: pick 1
- Curries: pick 2
- Rice: pick 1 (Biryani ₹50/plate extra — note in description)
- Breads: pick 1
- Desserts: pick 2
- Accompaniments: all included
Description: "Compact celebration menu. Includes salad, papad, pickle, raita, chutney, mouth freshener, water bottles, melamine plates and eco-friendly disposables. Biryani ₹50/plate extra. 5% GST applicable. Minimum 50 plates."

## Caveats for the platform (do not build, just respect)

- Vendor GST note: 5% GST on final bill — packages show base price; GST mention already covered by the 10–15% disclaimer for now.
- "Biryani +₹50" per-item surcharges are not modeled — noted in package descriptions instead.
- Flyer mentions "starting from ₹400/person" — that is a discuss-with-team option, not a listed package. Ignore.

## Not in this spec (Sri does manually via admin UI afterwards)

- Owner photo, cover photo, presentation gallery, testimonial screenshots (from the Drive folder / WhatsApp)
