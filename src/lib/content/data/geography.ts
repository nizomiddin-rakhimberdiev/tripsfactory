import type { Region, Country, City } from "../types";

export const regions: Region[] = [
  { slug: "central-asia", name: "Central Asia" },
  { slug: "east-asia", name: "East Asia" },
  { slug: "middle-east", name: "Middle East" },
  { slug: "southeast-asia", name: "Southeast Asia" },
];

export const countries: Country[] = [
  {
    slug: "uzbekistan",
    regionSlug: "central-asia",
    name: "Uzbekistan",
    intro:
      "The heart of the Silk Road: turquoise domes of Samarkand, the living museum city of Khiva, holy Bukhara and the vibrant capital Tashkent. Uzbekistan combines two and a half millennia of history with legendary hospitality, delicious cuisine and remarkable affordability.",
    heroImage:
      "https://images.unsplash.com/photo-1596306499317-8490232098fa?w=1600",
    published: true,
  },
  {
    slug: "kyrgyzstan",
    regionSlug: "central-asia",
    name: "Kyrgyzstan",
    intro:
      "Celestial mountains, nomad yurts and alpine lakes — Kyrgyzstan is Central Asia's wild, hospitable outdoors.",
    heroImage:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1600",
    published: false,
  },
  {
    slug: "kazakhstan",
    regionSlug: "central-asia",
    name: "Kazakhstan",
    intro:
      "Endless steppe, futuristic Astana and the canyons of the south — the giant of Central Asia.",
    heroImage:
      "https://images.unsplash.com/photo-1558588942-930faae5a389?w=1600",
    published: false,
  },
  {
    slug: "china",
    regionSlug: "east-asia",
    name: "China",
    intro:
      "From the Great Wall to Kashgar's Sunday bazaar — the eastern end of the Silk Road.",
    heroImage:
      "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1600",
    published: false,
  },
  {
    slug: "uae",
    regionSlug: "middle-east",
    name: "United Arab Emirates",
    intro:
      "Dubai and beyond: desert luxury, record-breaking architecture and year-round sun.",
    heroImage:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600",
    published: false,
  },
  {
    slug: "philippines",
    regionSlug: "southeast-asia",
    name: "Philippines",
    intro:
      "Seven thousand islands of white sand, coral reefs and island-hopping adventures.",
    heroImage:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1600",
    published: false,
  },
];

export const cities: City[] = [
  {
    slug: "tashkent",
    countrySlug: "uzbekistan",
    name: "Tashkent",
    intro:
      "Central Asia's largest city blends Soviet modernism, ornate metro stations, leafy avenues and the old town around Chorsu Bazaar.",
    recommendedNights: 2,
    attractions: [
      "Khast-Imam Complex & the Ottoman Quran",
      "Chorsu Bazaar",
      "Tashkent Metro art stations",
      "Amir Timur Square",
      "Museum of Applied Arts",
    ],
    image: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=1200",
  },
  {
    slug: "samarkand",
    countrySlug: "uzbekistan",
    name: "Samarkand",
    intro:
      "Tamerlane's capital and the most iconic image of the Silk Road — the Registan's three majolica-covered madrasahs glow turquoise and gold.",
    recommendedNights: 2,
    attractions: [
      "Registan Square",
      "Shah-i-Zinda necropolis",
      "Gur-e-Amir Mausoleum",
      "Bibi-Khanym Mosque",
      "Ulugbek Observatory",
    ],
    image: "https://images.unsplash.com/photo-1596306499317-8490232098fa?w=1200",
  },
  {
    slug: "bukhara",
    countrySlug: "uzbekistan",
    name: "Bukhara",
    intro:
      "A holy city of 140 protected monuments where trading domes, madrasahs and caravanserais still line lanes little changed in 500 years.",
    recommendedNights: 2,
    attractions: [
      "Poi-Kalyan Ensemble",
      "Ark Fortress",
      "Lyabi-Hauz Square",
      "Trading Domes",
      "Sitorai Mokhi-Khosa Palace",
    ],
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200",
  },
  {
    slug: "khiva",
    countrySlug: "uzbekistan",
    name: "Khiva",
    intro:
      "An open-air museum: the walled inner town of Itchan Kala is a maze of minarets, madrasahs and mud-brick lanes best explored at sunset.",
    recommendedNights: 1,
    attractions: [
      "Itchan Kala walls",
      "Kalta Minor Minaret",
      "Kunya-Ark Citadel",
      "Islam Khodja Minaret",
      "Tash Hauli Palace",
    ],
    image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=1200",
  },
  {
    slug: "shakhrisabz",
    countrySlug: "uzbekistan",
    name: "Shakhrisabz",
    intro:
      "Tamerlane's birthplace across the mountains from Samarkand, home to the ruins of his colossal Ak-Saray palace.",
    recommendedNights: 1,
    attractions: ["Ak-Saray Palace", "Dorut Tilavat", "Kok Gumbaz Mosque"],
    image: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200",
  },
  {
    slug: "fergana-valley",
    countrySlug: "uzbekistan",
    name: "Fergana Valley",
    intro:
      "Uzbekistan's craft heartland: silk weaving in Margilan, ceramics in Rishtan and the country's most fertile orchards.",
    recommendedNights: 2,
    attractions: [
      "Yodgorlik Silk Factory (Margilan)",
      "Rishtan ceramics workshops",
      "Kokand Khan's Palace",
    ],
    image: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=1200",
  },
];
