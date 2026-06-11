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

function normalizeMatch(apiMatch) {
  return {
    id: apiMatch.id,
    homeTeam: apiMatch.homeTeam?.name || '',
    awayTeam: apiMatch.awayTeam?.name || '',
    status: apiMatch.status,
    homeScore: apiMatch.score?.fullTime?.home ?? null,
    awayScore: apiMatch.score?.fullTime?.away ?? null,
    utcDate: apiMatch.utcDate || null,
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

const TEAM_NAME_MAP = {
  Mexico: 'México',
  'South Africa': 'Sudáfrica',
  'Korea Republic': 'Corea del Sur',
  'South Korea': 'Corea del Sur',
  'Czech Republic': 'República Checa',
  Canada: 'Canadá',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  Qatar: 'Catar',
  Switzerland: 'Suiza',
  Brazil: 'Brasil',
  Morocco: 'Marruecos',
  Haiti: 'Haití',
  Scotland: 'Escocia',
  'United States': 'Estados Unidos',
  USA: 'Estados Unidos',
  Paraguay: 'Paraguay',
  Australia: 'Australia',
  Turkey: 'Turquía',
  'Türkiye': 'Turquía',
  Germany: 'Alemania',
  'Curaçao': 'Curazao',
  Curacao: 'Curazao',
  'Ivory Coast': 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil',
  Ecuador: 'Ecuador',
  Netherlands: 'Países Bajos',
  Japan: 'Japón',
  Sweden: 'Suecia',
  Tunisia: 'Túnez',
  Belgium: 'Bélgica',
  Egypt: 'Egipto',
  Iran: 'Irán',
  'New Zealand': 'Nueva Zelanda',
  Spain: 'España',
  'Cape Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arabia Saudita',
  Uruguay: 'Uruguay',
  France: 'Francia',
  Senegal: 'Senegal',
  Iraq: 'Irak',
  Norway: 'Noruega',
  Argentina: 'Argentina',
  Algeria: 'Argelia',
  Austria: 'Austria',
  Jordan: 'Jordania',
  Portugal: 'Portugal',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  Uzbekistan: 'Uzbekistán',
  Colombia: 'Colombia',
  England: 'Inglaterra',
  Croatia: 'Croacia',
  Ghana: 'Ghana',
  Panama: 'Panamá',
};

export function matchTeamName(apiName) {
  return TEAM_NAME_MAP[apiName] || apiName;
}
