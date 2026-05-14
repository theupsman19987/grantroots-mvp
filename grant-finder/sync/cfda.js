/**
 * CFDA (Catalog of Federal Domestic Assistance) prefix → category mapping.
 *
 * The first two digits of a CFDA number identify the sponsoring agency/program area.
 * e.g., CFDA 93.226 → prefix "93" → Health (HHS)
 *
 * Reference: https://sam.gov/content/assistance-listings
 */

export const CFDA_PREFIX_MAP = {
  '10': 'Agriculture',          // USDA — food, farming, rural
  '11': 'Business & commerce',  // Commerce / EDA — economic development
  '12': 'Other',                // Defense — mostly restricted
  '14': 'Housing',              // HUD — housing, community block grants
  '15': 'Natural resources',    // Interior — tribal, public lands, wildlife
  '16': 'Justice',              // DOJ — public safety, violence prevention, reentry
  '17': 'Workforce',            // DOL — job training, labor standards
  '19': 'Community development',// State Dept — exchange programs, diplomacy
  '20': 'Transportation',       // DOT — transit, roads, safe routes
  '21': 'Business & commerce',  // Treasury — CDFI, financial inclusion
  '23': 'Community development',// ARC / Delta Regional — Appalachian/rural development
  '39': 'Other',                // GSA — government management
  '43': 'Science & tech',       // NASA — STEM, space science
  '45': 'Arts & culture',       // NEA / NEH — arts, humanities, cultural orgs
  '47': 'Science & tech',       // NSF — research, STEM education
  '59': 'Business & commerce',  // SBA — small business, entrepreneurship
  '64': 'Social services',      // VA — veterans services
  '66': 'Natural resources',    // EPA — environmental, clean air/water, justice
  '76': 'Education',            // DOEd — education programs
  '81': 'Natural resources',    // DOE Energy — clean energy, environment
  '84': 'Education',            // DOEd — largest education grant portfolio
  '85': 'Other',                // OIG
  '86': 'Disaster relief',      // Mostly inactive (legacy FEMA codes)
  '87': 'Disaster relief',      // Legacy FEMA
  '90': 'Disaster relief',      // DHS / FEMA — emergency management, preparedness
  '93': 'Health',               // HHS — the largest health/human services funder
  '94': 'Community development',// AmeriCorps — national service, community orgs
  '95': 'Other',                // DHS (non-FEMA)
  '96': 'Social services',      // SSA — disability, social security
  '97': 'Disaster relief',      // DHS / FEMA — homeland security grants
};

/**
 * Map an array of CFDA numbers to normalized category strings.
 * Deduplicates and returns only known categories.
 *
 * @param {string[]} cfdaList  e.g. ["93.226", "84.002"]
 * @returns {string[]}
 */
export function cfdaToCategories(cfdaList) {
  if (!Array.isArray(cfdaList) || cfdaList.length === 0) return [];
  const cats = new Set();
  for (const cfda of cfdaList) {
    // CFDA numbers are "XX.YYY" — take only the prefix (first two digits)
    const prefix = String(cfda).split('.')[0].replace(/\D/g, '').padStart(2, '0').slice(0, 2);
    const cat = CFDA_PREFIX_MAP[prefix];
    if (cat && cat !== 'Other') cats.add(cat);
  }
  return [...cats];
}
