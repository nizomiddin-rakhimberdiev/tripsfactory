/**
 * Coordinates for places that appear in tour routes but are not Cities in the CMS.
 *
 * The map on a tour page is drawn from `tour.route` — a list of name/lat/lng
 * points. Those normally come from the linked City documents, which is right for
 * places the site gives a page of its own. But a sheet naming thirty Chinese
 * stops would otherwise produce no map at all: the importer skipped every name
 * it could not find, and sixty-seven tours arrived with an empty route.
 *
 * Creating a City record per name was the obvious alternative and is worse. A
 * City is public content — it renders as a card with a photo and a description
 * on the country page — so auto-creating thirty of them would put thirty
 * unfinished cards on the live China page to make a map work.
 *
 * So: CMS cities stay authoritative, and this table fills the gap for the rest.
 * A name here draws a pin; a name in neither is reported in the preview.
 * Adding a place is one line.
 */
export type Place = { lat: number; lng: number };

/** Keys are matched case-insensitively, ignoring punctuation and spacing. */
const PLACES: Record<string, Place> = {
  // China — eastern seaboard and the Yangtze delta
  beijing: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  suzhou: { lat: 31.2989, lng: 120.5853 },
  hangzhou: { lat: 30.2741, lng: 120.1551 },
  zhujiajiao: { lat: 31.1122, lng: 121.053 },
  tongli: { lat: 31.16, lng: 120.72 },
  zhouzhuang: { lat: 31.1156, lng: 120.8508 },

  // China — the classical route
  xian: { lat: 34.3416, lng: 108.9398 },
  luoyang: { lat: 34.6197, lng: 112.454 },
  shaolin: { lat: 34.5075, lng: 112.9353 },
  huashan: { lat: 34.4772, lng: 110.085 },
  chengde: { lat: 40.9515, lng: 117.9382 },
  gubei: { lat: 40.6386, lng: 117.1682 },

  // China — south and west
  guilin: { lat: 25.2736, lng: 110.29 },
  yangshuo: { lat: 24.7784, lng: 110.496 },
  zhangjiajie: { lat: 29.117, lng: 110.4794 },
  fenghuang: { lat: 27.9481, lng: 109.599 },
  dehang: { lat: 28.45, lng: 109.6167 },
  kunming: { lat: 25.0389, lng: 102.7183 },
  lijiang: { lat: 26.8721, lng: 100.2299 },
  shuhe: { lat: 26.9257, lng: 100.2136 },
  chengdu: { lat: 30.5728, lng: 104.0668 },
  chongqing: { lat: 29.563, lng: 106.5516 },
  yichang: { lat: 30.6919, lng: 111.2864 },
  yangtzeriver: { lat: 30.8233, lng: 111.0033 },
  lhasa: { lat: 29.652, lng: 91.1721 },
  hongkong: { lat: 22.3193, lng: 114.1694 },

  // China — coast and islands
  sanya: { lat: 18.2528, lng: 109.5119 },
  beidaihe: { lat: 39.8244, lng: 119.5178 },
  weihai: { lat: 37.5128, lng: 122.1201 },
  beihai: { lat: 21.4811, lng: 109.12 },

  // China — the north-east, used by the winter tours
  harbin: { lat: 45.8038, lng: 126.5349 },
  shenyang: { lat: 41.8057, lng: 123.4315 },
  jilin: { lat: 43.8378, lng: 126.5495 },
  xuegu: { lat: 44.32, lng: 128.9 },
  snowvalley: { lat: 44.32, lng: 128.9 },

  // Uzbekistan. The gazetteer held only Chinese cities, so an Uzbek itinerary
  // drew no route at all unless every stop already had a city page.
  tashkent: { lat: 41.2995, lng: 69.2401 },
  samarkand: { lat: 39.627, lng: 66.975 },
  bukhara: { lat: 39.7747, lng: 64.4286 },
  khiva: { lat: 41.3775, lng: 60.3619 },
  shakhrisabz: { lat: 39.0578, lng: 66.83 },
  urgench: { lat: 41.55, lng: 60.6333 },
  nukus: { lat: 42.46, lng: 59.61 },
  termez: { lat: 37.2242, lng: 67.2783 },
  navoi: { lat: 40.0844, lng: 65.3792 },
  nurata: { lat: 40.5606, lng: 65.6889 },
  fergana: { lat: 40.3864, lng: 71.7864 },
  kokand: { lat: 40.5283, lng: 70.9425 },
  andijan: { lat: 40.7821, lng: 72.3442 },
  namangan: { lat: 41.0011, lng: 71.6673 },
  muynak: { lat: 43.7681, lng: 59.0219 },
  chimgan: { lat: 41.55, lng: 70.0167 },
  charvak: { lat: 41.6333, lng: 70.1 },

  // Neighbours that appear on Silk Road itineraries
  almaty: { lat: 43.222, lng: 76.8512 },
  astana: { lat: 51.1605, lng: 71.4704 },
  bishkek: { lat: 42.8746, lng: 74.5698 },
  dushanbe: { lat: 38.5598, lng: 68.787 },
  ashgabat: { lat: 37.9601, lng: 58.3261 },
  merv: { lat: 37.6614, lng: 62.1922 },
  khujand: { lat: 40.2833, lng: 69.6333 },
};

/**
 * Spelling variants that resolve to the same place.
 *
 * The import sheet is written in Uzbek, so an editor types "Toshkent",
 * "Samarqand", "Buxoro" — while both the gazetteer and the city pages are
 * keyed on the English forms. Nothing matched, so the cities were silently
 * dropped from the tour and the map came out empty. Neither spelling is a
 * mistake, so both resolve.
 *
 * Keys are already normalised: lower case, apostrophes and punctuation gone.
 */
const ALIASES: Record<string, string> = {
  // Uzbek Latin
  toshkent: "tashkent",
  samarqand: "samarkand",
  buxoro: "bukhara",
  xiva: "khiva",
  shahrisabz: "shakhrisabz",
  shahrisabaz: "shakhrisabz",
  urganch: "urgench",
  termiz: "termez",
  navoiy: "navoi",
  nurota: "nurata",
  fargona: "fergana",
  fergonavodiysi: "fergana",
  fergonavalley: "fergana",
  qoqon: "kokand",
  andijon: "andijan",
  moynoq: "muynak",
  chimyon: "chimgan",
  chorvoq: "charvak",
  // Russian-influenced Latin spellings that also turn up
  tashkand: "tashkent",
  samarcand: "samarkand",
  bukhoro: "bukhara",
  boukhara: "bukhara",
  khiwa: "khiva",
  // Neighbours
  olmaota: "almaty",
  almaata: "almaty",
  nursultan: "astana",
  ashkhabad: "ashgabat",
  ashgabad: "ashgabat",
};

const normalise = (name: string) =>
  name
    .toLowerCase()
    .replace(/[’‘'`´ʻʼ]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * One key for a place however it was spelled.
 *
 * Used for the gazetteer *and* for matching the sheet against existing city
 * pages, so "Toshkent" in the sheet finds the Tashkent page — which is what
 * links the city to the tour and puts the pin on the map.
 */
export function placeKey(name: string): string {
  const n = normalise(name);
  return ALIASES[n] ?? n;
}

export function lookupPlace(name: string): Place | null {
  return PLACES[placeKey(name)] ?? null;
}
