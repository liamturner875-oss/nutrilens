// Shared helpers for the Open Food Facts open database (millions of branded
// products worldwide). Search always queries the GLOBAL catalog so every
// product around the world is reachable; the user's country catalog is only
// used to boost local brands to the top of the results.

const FIELDS = "product_name,generic_name,brands,nutriments,serving_size";

export function mapProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const protein = n["proteins_100g"] || 0;
  const carbs = n["carbohydrates_100g"] || 0;
  const fats = n["fat_100g"] || 0;
  let calories =
    n["energy-kcal_100g"] != null ? n["energy-kcal_100g"] : n["energy_100g"] != null ? n["energy_100g"] / 4.184 : null;
  if (calories == null) calories = 4 * protein + 4 * carbs + 9 * fats;
  if (!calories && !protein && !carbs && !fats) return null; // no nutrition data
  const m = /([\d.]+)\s*g/i.exec(p.serving_size || "");
  return {
    name: p.product_name || p.generic_name || "Product",
    brand: (p.brands || "").split(",")[0].trim(),
    per100: {
      calories,
      protein,
      carbs,
      fats,
      fiber: n["fiber_100g"] || 0,
      sodium_mg: (n["sodium_100g"] || 0) * 1000,
      potassium_mg: (n["potassium_100g"] || 0) * 1000,
    },
    servingGrams: m ? Math.round(parseFloat(m[1])) : 100,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The database sometimes answers bursts of requests with an HTML throttle
// page — back off and retry, and only ever accept real JSON.
async function fetchJson(url) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      throw new Error("Couldn't reach the food database. Check your connection and try again.");
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (attempt >= 2) throw new Error("Food database is busy — try again in a moment.");
      await sleep(1200 + attempt * 1500); // throttle page — back off and retry
      continue;
    }
    if (!res.ok) throw new Error("Food database request failed.");
    return data;
  }
}

const hostFor = (country) =>
  /^[a-z]{2}$/.test(country || "") ? `https://${country}.openfoodfacts.org` : "https://world.openfoodfacts.org";

async function searchOn(base, params) {
  const data = await fetchJson(`${base}/api/v2/search?${params}&fields=${FIELDS}&page_size=50`);
  return (data?.products || []).map(mapProduct).filter(Boolean);
}

// Global search — the world catalog contains every product from every country
async function queryWorld(params) {
  return searchOn(hostFor(), params);
}

export async function fetchProductByBarcode(code, country) {
  const bases = country ? [hostFor(country), hostFor()] : [hostFor()];
  let lastError = null;
  for (const base of bases) {
    try {
      const data = await fetchJson(`${base}/api/v2/product/${code}.json`);
      if (data?.status !== 0 && data.product) return mapProduct(data.product);
      lastError = null; // genuinely not on this catalog
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) throw lastError;
  return null;
}

// Rank how well a product matches the user's keywords: name matches beat brand
// matches, full-phrase beats partial words, local and brand-catalog hits get a boost.
function rankProduct(p, term, isBrandHit, isLocalHit) {
  const phrase = term.toLowerCase();
  const name = (p.name || "").toLowerCase();
  const brand = (p.brand || "").toLowerCase();
  const tokens = phrase.split(/\s+/).filter(Boolean);
  let score = 0;
  if (name === phrase) score += 100;
  else if (name.startsWith(phrase)) score += 60;
  else if (name.includes(phrase)) score += 40;
  if (brand === phrase) score += 70;
  else if (brand.startsWith(phrase)) score += 45;
  else if (brand.includes(phrase)) score += 25;
  const nameWords = name.split(/[^a-z0-9]+/);
  score += tokens.filter((t) => nameWords.includes(t) || name.includes(t)).length * 12;
  score += tokens.filter((t) => brand.includes(t)).length * 6;
  if (isBrandHit) score += 15; // came from the brand's own catalog query
  if (isLocalHit) score += 20; // sold in the user's country
  return score;
}

function dedupeRanked(products, term, brandKeys, localKeys) {
  const seen = new Set();
  const scored = [];
  for (const p of products) {
    const key = `${p.name}|${p.brand}`;
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({ p, score: rankProduct(p, term, brandKeys.has(key), localKeys.has(key)) });
  }
  scored.sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0);
  return (relevant.length ? relevant : scored).map((s) => s.p);
}

const STOPWORDS = new Set(["and", "or", "with", "the", "of", "a", "an", "some", "my", "lite"]);

// Full search across the worldwide catalog. A product can be found by its
// brand ("pams", "molenberg", "dairyworks"), by its full category name
// ("rolled oats", "cheddar cheese", "pea puffs") or — when the phrase isn't a
// known category — by the key food word ("baby carrots" -> "carrots"),
// with an OR fallback for anything still unmatched.
export async function searchProducts(term, country) {
  const tokens = term.trim().toLowerCase().split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
  if (!tokens.length) return [];
  const phrase = tokens.join(" ");

  // Keep the burst small — the database throttles rapid-fire requests, so
  // the brand and full-phrase queries go first and the wider fallbacks only
  // run when those come back empty.
  const settled = await Promise.allSettled([
    queryWorld(`brands_tags=${encodeURIComponent(tokens[0])}`),
    queryWorld(`categories_tags_en=${encodeURIComponent(phrase)}`),
    // Local catalog (same worldwide data, filtered to products sold in the
    // user's country) only boosts ranking — never restricts the results.
    country
      ? searchOn(hostFor(country), `categories_tags_en=${encodeURIComponent(phrase)}`).catch(() => [])
      : Promise.resolve([]),
  ]);
  const brandHits = settled[0].status === "fulfilled" ? settled[0].value : [];
  const phraseHits = settled[1].status === "fulfilled" ? settled[1].value : [];
  const localHits = settled[2].status === "fulfilled" ? settled[2].value : [];

  let hits = [...brandHits, ...phraseHits];
  if (!phraseHits.length && tokens.length > 1) {
    // The phrase isn't a known category ("baby carrots") — fall back to the
    // key food word alone ("carrots")
    try {
      hits.push(...(await queryWorld(`categories_tags_en=${encodeURIComponent(tokens[tokens.length - 1])}`)));
    } catch (e) {
      /* fall through */
    }
  }
  if (!hits.length) {
    // Widen: any category matching any keyword ("blueberries OR yogurts")
    try {
      hits = await queryWorld(`categories_tags_en=${encodeURIComponent(tokens.join("|"))}`);
    } catch (e) {
      /* fall through */
    }
  }

  if (!hits.length && !localHits.length) {
    if (settled[0].status === "rejected" && settled[1].status === "rejected") throw settled[0].reason;
    return [];
  }
  const brandKeys = new Set(brandHits.map((p) => `${p.name}|${p.brand}`));
  const localKeys = new Set(localHits.map((p) => `${p.name}|${p.brand}`));
  return dedupeRanked([...hits, ...localHits], phrase, brandKeys, localKeys).slice(0, 24);
}

// Lightweight autocomplete for the "related products" dropdown while typing
export async function suggestProducts(term, country) {
  const tokens = term.trim().toLowerCase().split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
  if (!tokens.length) return [];
  const phrase = tokens.join(" ");
  let found;
  try {
    found = await queryWorld(`categories_tags_en=${encodeURIComponent(phrase)}`);
  } catch (e) {
    return [];
  }
  if (!found.length && tokens.length === 1) {
    try {
      found = await queryWorld(`brands_tags=${encodeURIComponent(phrase)}`);
    } catch (e) {
      return [];
    }
  }
  return dedupeRanked(found, phrase, new Set(), new Set()).slice(0, 6);
}
