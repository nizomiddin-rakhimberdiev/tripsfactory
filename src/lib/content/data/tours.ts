import type { Tour } from "../types";

export const tours: Tour[] = [
  {
    slug: "classic-uzbekistan-group-tour",
    countrySlug: "uzbekistan",
    title: "Classic Uzbekistan Group Tour",
    summary:
      "Our most popular escorted tour: the ancient cities of Khiva, Bukhara and Samarkand plus the modern capital Tashkent, in one seamless 8-day journey with guaranteed departures.",
    type: "group",
    tier: "standard",
    durationDays: 8,
    citySlugs: ["tashkent", "khiva", "bukhara", "samarkand"],
    priceFromUsd: 1240,
    singleSupplementUsd: 250,
    departures: [
      { date: "2026-08-07", priceUsd: 1390, status: "guaranteed" },
      { date: "2026-08-21", priceUsd: 1390, status: "available" },
      { date: "2026-09-04", priceUsd: 1390, status: "guaranteed" },
      { date: "2026-09-18", priceUsd: 1390, status: "available" },
      { date: "2026-10-02", priceUsd: 1390, status: "available" },
      { date: "2026-10-16", priceUsd: 1390, status: "available" },
      { date: "2026-11-13", priceUsd: 1240, status: "available" },
      { date: "2026-12-04", priceUsd: 1240, status: "available" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Tashkent",
        description:
          "Meet at the airport, transfer to your hotel and rest. In the evening, an optional welcome walk along Amir Timur Square.",
      },
      {
        day: 2,
        title: "Tashkent city tour",
        description:
          "Khast-Imam Complex with the 7th-century Ottoman Quran, Chorsu Bazaar, the Museum of Applied Arts and the famously ornate metro stations.",
      },
      {
        day: 3,
        title: "Fly to Urgench — Khiva",
        description:
          "Morning flight and full-day walking tour of Itchan Kala: Kalta Minor, Kunya-Ark, Tash Hauli Palace and sunset from the city walls.",
      },
      {
        day: 4,
        title: "Khiva → Bukhara",
        description:
          "Cross the Kyzylkum desert along the Amu Darya river. Evening arrival in Bukhara, dinner in a former madrasah courtyard.",
      },
      {
        day: 5,
        title: "Bukhara old town",
        description:
          "Poi-Kalyan ensemble, Ark Fortress, trading domes and Lyabi-Hauz, finishing with a folklore show in the Nodir Devon Begi madrasah.",
      },
      {
        day: 6,
        title: "Bukhara → Samarkand",
        description:
          "Drive to Samarkand with a stop at the Sitorai Mokhi-Khosa summer palace. Afternoon visit to Gur-e-Amir, Tamerlane's mausoleum.",
      },
      {
        day: 7,
        title: "Samarkand highlights",
        description:
          "Registan Square, Bibi-Khanym Mosque, the Shah-i-Zinda necropolis and the Siab Bazaar; evening high-speed Afrosiyob train to Tashkent.",
      },
      {
        day: 8,
        title: "Departure",
        description: "Transfer to Tashkent airport for your flight home.",
      },
    ],
    included: [
      "7 nights in double room with breakfast",
      "All transfers and transport per itinerary",
      "Domestic flight Tashkent–Urgench",
      "Afrosiyob high-speed train Samarkand–Tashkent",
      "English-speaking local guides",
      "Entrance fees to all listed sites",
      "Visa support letter (if required)",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Lunches and dinners (except two cultural meals)",
      "Personal expenses and tips",
    ],
    heroImage:
      "https://images.unsplash.com/photo-1596306499317-8490232098fa?w=1600",
    gallery: [],
    featured: true,
    published: true,
  },
  {
    slug: "uzbekistan-highlights-private-tour",
    countrySlug: "uzbekistan",
    title: "Uzbekistan Highlights Private Tour",
    summary:
      "Samarkand, Bukhara and Tashkent at your own pace with a private guide and driver — start any day of the year.",
    type: "private",
    tier: "standard",
    durationDays: 6,
    citySlugs: ["tashkent", "bukhara", "samarkand"],
    priceFromUsd: 980,
    singleSupplementUsd: null,
    departures: [],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Tashkent",
        description: "Private airport meet-and-greet, city orientation walk.",
      },
      {
        day: 2,
        title: "Tashkent → Samarkand",
        description:
          "Morning Afrosiyob train; afternoon at the Registan and Gur-e-Amir.",
      },
      {
        day: 3,
        title: "Samarkand in depth",
        description:
          "Shah-i-Zinda, Bibi-Khanym, Ulugbek Observatory and a paper-mill workshop in Konigil village.",
      },
      {
        day: 4,
        title: "Samarkand → Bukhara",
        description:
          "Train to Bukhara; evening stroll around Lyabi-Hauz with dinner recommendations from your guide.",
      },
      {
        day: 5,
        title: "Bukhara old town",
        description:
          "Full-day tour of the Ark, Poi-Kalyan and the trading domes with a silk-and-spice tasting.",
      },
      {
        day: 6,
        title: "Return & departure",
        description: "Train back to Tashkent and airport transfer.",
      },
    ],
    included: [
      "5 nights with breakfast",
      "Private guide and driver",
      "All train tickets",
      "Entrance fees",
    ],
    excluded: ["International flights", "Insurance", "Meals not listed"],
    heroImage:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600",
    gallery: [],
    featured: true,
    published: true,
  },
  {
    slug: "uzbekistan-winter-group-tour",
    countrySlug: "uzbekistan",
    title: "Uzbekistan Winter Group Tour",
    summary:
      "The same legendary cities without the crowds — plus seasonal prices. Khiva, Bukhara and Samarkand under crisp blue winter skies.",
    type: "group",
    tier: "standard",
    durationDays: 8,
    citySlugs: ["tashkent", "khiva", "bukhara", "samarkand"],
    priceFromUsd: 890,
    singleSupplementUsd: 180,
    departures: [
      { date: "2026-12-26", priceUsd: 890, status: "available" },
      { date: "2027-01-16", priceUsd: 890, status: "available" },
      { date: "2027-02-13", priceUsd: 890, status: "available" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Tashkent",
        description: "Airport transfer and rest day.",
      },
      {
        day: 2,
        title: "Tashkent sightseeing",
        description: "Khast-Imam, Chorsu Bazaar and the metro tour.",
      },
      {
        day: 3,
        title: "Fly to Khiva",
        description: "Itchan Kala walking day.",
      },
      {
        day: 4,
        title: "Desert road to Bukhara",
        description: "Kyzylkum crossing with tea stops.",
      },
      {
        day: 5,
        title: "Bukhara",
        description: "Old town monuments and evening plov masterclass.",
      },
      {
        day: 6,
        title: "To Samarkand",
        description: "Via Sitorai Mokhi-Khosa palace.",
      },
      {
        day: 7,
        title: "Samarkand",
        description: "Registan, Shah-i-Zinda and Siab Bazaar; train back.",
      },
      { day: 8, title: "Departure", description: "Airport transfer." },
    ],
    included: [
      "7 nights with breakfast",
      "All transport per itinerary",
      "Guides and entrance fees",
      "Plov masterclass",
    ],
    excluded: ["International flights", "Insurance", "Most meals"],
    heroImage:
      "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=1600",
    gallery: [],
    featured: false,
    published: true,
  },
  {
    slug: "silk-road-residences",
    countrySlug: "uzbekistan",
    title: "Silk Road Residences",
    summary:
      "Ten days across Uzbekistan in boutique residences and restored merchant houses, with after-hours access to the Registan, private artisan ateliers and a dedicated concierge throughout.",
    type: "private",
    tier: "premium",
    durationDays: 10,
    citySlugs: ["tashkent", "samarkand", "bukhara", "khiva"],
    priceFromUsd: null,
    singleSupplementUsd: null,
    departures: [],
    itinerary: [
      {
        day: 1,
        title: "Arrival — Tashkent",
        description:
          "Fast-track arrival, private transfer and a rooftop welcome dinner curated by a leading Uzbek chef.",
      },
      {
        day: 2,
        title: "Tashkent, privately",
        description:
          "Collections opened privately at the State Museum of Applied Arts; evening at a contemporary artist's studio.",
      },
      {
        day: 3,
        title: "Samarkand by Afrosiyob",
        description:
          "First-class rail, check-in at a boutique residence overlooking Gur-e-Amir.",
      },
      {
        day: 4,
        title: "The Registan after hours",
        description:
          "Private evening access to Registan Square with an art historian, followed by dinner in a madrasah courtyard.",
      },
      {
        day: 5,
        title: "Winemakers & observatories",
        description:
          "Ulugbek Observatory with a historian, tasting at a family winery in the Zarafshan foothills.",
      },
      {
        day: 6,
        title: "Bukhara",
        description:
          "Private rail transfer; evening hammam reserved exclusively for you.",
      },
      {
        day: 7,
        title: "Bukhara's masters",
        description:
          "Gold-embroidery and miniature-painting ateliers behind closed doors; twilight rooftop dinner over Poi-Kalyan.",
      },
      {
        day: 8,
        title: "Flight to Khiva",
        description:
          "Charter option available. Sunset walk on the Itchan Kala walls with the city's chief conservator.",
      },
      {
        day: 9,
        title: "Desert & stars",
        description:
          "Private 4x4 to the Ayaz-Kala fortresses, dinner and stargazing in a luxury desert camp.",
      },
      {
        day: 10,
        title: "Departure",
        description: "Private transfers home, at your hour.",
      },
    ],
    included: [
      "Boutique residences & finest hotels throughout",
      "Dedicated concierge, 24/7",
      "All private guides, drivers and first-class rail",
      "After-hours and behind-closed-doors access as listed",
      "All meals with wine pairings",
    ],
    excluded: ["International flights", "Charter flight supplement"],
    heroImage:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600",
    gallery: [],
    featured: true,
    published: true,
  },
];
