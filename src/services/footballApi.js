/* global process */

const API_BASE = 'https://api.football-data.org/v4';

function env(key, fallback) {
  return (
    (typeof process !== 'undefined' && process.env?.[key]) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.[key]) ||
    fallback
  );
}

const COMPETITION_CODE = env('FOOTBALL_DATA_COMPETITION_CODE', 'WC');

function getHeaders() {
  return { 'X-Auth-Token': env('FOOTBALL_DATA_API_KEY', '') };
}

async function apiFetch(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    console.warn(`[footballApi] HTTP ${res.status} for ${url}`);
    return { matches: [] };
  }
  return res.json();
}

export function normalizeMatch(apiMatch) {
  const score = apiMatch.score || {};
  const regular = score.regularTime || {};
  return {
    id: apiMatch.id,
    homeTeam: apiMatch.homeTeam?.name || '',
    awayTeam: apiMatch.awayTeam?.name || '',
    status: apiMatch.status,
    homeScore: score.fullTime?.home ?? null,
    awayScore: score.fullTime?.away ?? null,
    fullTimeRaw: score.fullTime ?? null,
    utcDate: apiMatch.utcDate || null,
    stage: apiMatch.stage || null,
    regularTimeHome: regular.home ?? null,
    regularTimeAway: regular.away ?? null,
    extraTimeHome: score.extraTime?.home ?? null,
    extraTimeAway: score.extraTime?.away ?? null,
    winner: score.winner ?? null,
    duration: score.duration ?? null,
    penalties: score.penalties ?? null,
  };
}

export async function fetchLiveAndRecentMatches() {
  const endpoint = `/competitions/${COMPETITION_CODE}/matches?status=IN_PLAY,PAUSED,FINISHED`;
  console.log(`[footballApi] GET ${API_BASE}${endpoint}`);
  const data = await apiFetch(endpoint);
  return (data.matches || []).map(normalizeMatch);
}

export async function fetchUpcomingMatches() {
  const endpoint = `/competitions/${COMPETITION_CODE}/matches?status=SCHEDULED,TIMED`;
  console.log(`[footballApi] GET ${API_BASE}${endpoint}`);
  const data = await apiFetch(endpoint);
  return (data.matches || []).map(normalizeMatch);
}

export async function fetchAllMatches() {
  const endpoint = `/competitions/${COMPETITION_CODE}/matches`;
  console.log(`[footballApi] GET ${API_BASE}${endpoint}`);
  const data = await apiFetch(endpoint);
  return (data.matches || []).map(normalizeMatch);
}

const TEAM_NAME_MAP = {
  Afghanistan: 'Afganistán',
  Albania: 'Albania',
  Algeria: 'Argelia',
  Angola: 'Angola',
  Argentina: 'Argentina',
  Armenia: 'Armenia',
  Australia: 'Australia',
  Austria: 'Austria',
  Azerbaijan: 'Azerbaiyán',
  Bahrain: 'Baréin',
  Bangladesh: 'Bangladés',
  Belarus: 'Bielorrusia',
  Belgium: 'Bélgica',
  Benin: 'Benín',
  Bolivia: 'Bolivia',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'Bosnia Herzegovina': 'Bosnia y Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  Brazil: 'Brasil',
  Bulgaria: 'Bulgaria',
  Cameroon: 'Camerún',
  Canada: 'Canadá',
  'Cape Verde': 'Cabo Verde',
  'Cape Verde Islands': 'Cabo Verde',
  Chile: 'Chile',
  'China PR': 'China',
  Colombia: 'Colombia',
  Comoros: 'Comoras',
  'Congo DR': 'RD Congo',
  'Costa Rica': 'Costa Rica',
  "Côte d'Ivoire": 'Costa de Marfil',
  Croatia: 'Croacia',
  Curacao: 'Curazao',
  'Curaçao': 'Curazao',
  Cyprus: 'Chipre',
  Czechia: 'República Checa',
  'Czech Republic': 'República Checa',
  Denmark: 'Dinamarca',
  'DR Congo': 'RD Congo',
  Ecuador: 'Ecuador',
  Egypt: 'Egipto',
  England: 'Inglaterra',
  Finland: 'Finlandia',
  France: 'Francia',
  Georgia: 'Georgia',
  Germany: 'Alemania',
  Ghana: 'Ghana',
  Greece: 'Grecia',
  Guinea: 'Guinea',
  Haiti: 'Haití',
  Honduras: 'Honduras',
  Hungary: 'Hungría',
  Iceland: 'Islandia',
  India: 'India',
  Indonesia: 'Indonesia',
  Iran: 'Irán',
  Iraq: 'Irak',
  'IR Iran': 'Irán',
  Italy: 'Italia',
  'Ivory Coast': 'Costa de Marfil',
  Jamaica: 'Jamaica',
  Japan: 'Japón',
  Jordan: 'Jordania',
  Kazakhstan: 'Kazajistán',
  'Korea Republic': 'Corea del Sur',
  Kosovo: 'Kosovo',
  Kuwait: 'Kuwait',
  Kyrgyzstan: 'Kirguistán',
  Lebanon: 'Líbano',
  Luxembourg: 'Luxemburgo',
  Mali: 'Mali',
  Malta: 'Malta',
  Mexico: 'México',
  Montenegro: 'Montenegro',
  Morocco: 'Marruecos',
  Mozambique: 'Mozambique',
  Nepal: 'Nepal',
  Netherlands: 'Países Bajos',
  'New Zealand': 'Nueva Zelanda',
  Nigeria: 'Nigeria',
  'North Macedonia': 'Macedonia del Norte',
  'Northern Ireland': 'Irlanda del Norte',
  Norway: 'Noruega',
  Oman: 'Omán',
  Pakistan: 'Pakistán',
  Palestine: 'Palestina',
  Panama: 'Panamá',
  Paraguay: 'Paraguay',
  Peru: 'Perú',
  Philippines: 'Filipinas',
  Poland: 'Polonia',
  Portugal: 'Portugal',
  Qatar: 'Catar',
  'Republic of Ireland': 'República de Irlanda',
  Romania: 'Rumanía',
  Russia: 'Rusia',
  Rwanda: 'Ruanda',
  'Saudi Arabia': 'Arabia Saudita',
  Scotland: 'Escocia',
  Senegal: 'Senegal',
  Serbia: 'Serbia',
  Slovakia: 'Eslovaquia',
  Slovenia: 'Eslovenia',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  Spain: 'España',
  'Sri Lanka': 'Sri Lanka',
  Sweden: 'Suecia',
  Switzerland: 'Suiza',
  Syria: 'Siria',
  Tajikistan: 'Tayikistán',
  Tanzania: 'Tanzania',
  Thailand: 'Tailandia',
  'Trinidad and Tobago': 'Trinidad y Tobago',
  Tunisia: 'Túnez',
  Turkey: 'Turquía',
  'Türkiye': 'Turquía',
  Turkmenistan: 'Turkmenistán',
  Ukraine: 'Ucrania',
  'United States': 'Estados Unidos',
  Uruguay: 'Uruguay',
  USA: 'Estados Unidos',
  Uzbekistan: 'Uzbekistán',
  Venezuela: 'Venezuela',
  Vietnam: 'Vietnam',
  Wales: 'Gales',
  Yemen: 'Yemen',
};

export function matchTeamName(apiName) {
  return TEAM_NAME_MAP[apiName] || apiName;
}
