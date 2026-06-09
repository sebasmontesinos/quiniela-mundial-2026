/**
 * Fixture completo Mundial 2026 — 104 partidos (72 grupos + 32 eliminatoria).
 * 48 selecciones confirmadas en 12 grupos de 4. 16 sedes en México, EE. UU. y Canadá.
 *
 * Todas las fechas están en UTC con formato ISO 8601 (Z).
 * Los horarios siguen la franja oficial FIFA 2026:
 *   17:00 UTC — mañana (11:00 MX / 13:00 BO)
 *   20:00 UTC — tarde    (14:00 MX / 16:00 BO)
 *   23:00 UTC — noche    (17:00 MX / 19:00 BO)
 *   02:00 UTC — madrugada del día siguiente (20:00 MX / 22:00 BO)
 */

const VENUES = [
  { stadium: 'Estadio Azteca', city: 'Ciudad de México', country: 'México' },
  { stadium: 'Estadio Akron', city: 'Guadalajara', country: 'México' },
  { stadium: 'Estadio BBVA', city: 'Monterrey', country: 'México' },
  { stadium: 'MetLife Stadium', city: 'East Rutherford', country: 'USA' },
  { stadium: 'SoFi Stadium', city: 'Los Ángeles', country: 'USA' },
  { stadium: 'AT&T Stadium', city: 'Dallas', country: 'USA' },
  { stadium: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA' },
  { stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA' },
  { stadium: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA' },
  { stadium: 'Gillette Stadium', city: 'Boston', country: 'USA' },
  { stadium: 'Hard Rock Stadium', city: 'Miami', country: 'USA' },
  { stadium: 'Lumen Field', city: 'Seattle', country: 'USA' },
  { stadium: 'NRG Stadium', city: 'Houston', country: 'USA' },
  { stadium: "Levi's Stadium", city: 'San Francisco', country: 'USA' },
  { stadium: 'BMO Field', city: 'Toronto', country: 'Canadá' },
  { stadium: 'BC Place', city: 'Vancouver', country: 'Canadá' },
];

export const GROUPS = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

const GROUP_LETTERS = Object.keys(GROUPS);

function pickVenue(index) {
  return VENUES[index % VENUES.length];
}

const GROUP_PAIRINGS = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

const GROUP_DATES = {
  /* Group A */
  'GS_A_1': new Date('2026-06-11T19:00:00Z'),
  'GS_A_2': new Date('2026-06-12T02:00:00Z'),
  'GS_A_3': new Date('2026-06-19T01:00:00Z'),
  'GS_A_4': new Date('2026-06-18T16:00:00Z'),
  'GS_A_5': new Date('2026-06-25T01:00:00Z'),
  'GS_A_6': new Date('2026-06-25T01:00:00Z'),
  /* Group B */
  'GS_B_1': new Date('2026-06-12T19:00:00Z'),
  'GS_B_2': new Date('2026-06-13T19:00:00Z'),
  'GS_B_3': new Date('2026-06-18T22:00:00Z'),
  'GS_B_4': new Date('2026-06-18T19:00:00Z'),
  'GS_B_5': new Date('2026-06-24T19:00:00Z'),
  'GS_B_6': new Date('2026-06-24T19:00:00Z'),
  /* Group C */
  'GS_C_1': new Date('2026-06-13T22:00:00Z'),
  'GS_C_2': new Date('2026-06-14T01:00:00Z'),
  'GS_C_3': new Date('2026-06-19T22:00:00Z'),
  'GS_C_4': new Date('2026-06-20T00:30:00Z'),
  'GS_C_5': new Date('2026-06-24T22:00:00Z'),
  'GS_C_6': new Date('2026-06-24T22:00:00Z'),
  /* Group D */
  'GS_D_1': new Date('2026-06-13T01:00:00Z'),
  'GS_D_2': new Date('2026-06-14T04:00:00Z'),
  'GS_D_3': new Date('2026-06-19T19:00:00Z'),
  'GS_D_4': new Date('2026-06-20T03:00:00Z'),
  'GS_D_5': new Date('2026-06-26T02:00:00Z'),
  'GS_D_6': new Date('2026-06-26T02:00:00Z'),
  /* Group E */
  'GS_E_1': new Date('2026-06-14T17:00:00Z'),
  'GS_E_2': new Date('2026-06-14T23:00:00Z'),
  'GS_E_3': new Date('2026-06-20T20:00:00Z'),
  'GS_E_4': new Date('2026-06-21T00:00:00Z'),
  'GS_E_5': new Date('2026-06-25T20:00:00Z'),
  'GS_E_6': new Date('2026-06-25T20:00:00Z'),
  /* Group F */
  'GS_F_1': new Date('2026-06-14T20:00:00Z'),
  'GS_F_2': new Date('2026-06-15T02:00:00Z'),
  'GS_F_3': new Date('2026-06-20T17:00:00Z'),
  'GS_F_4': new Date('2026-06-21T04:00:00Z'),
  'GS_F_5': new Date('2026-06-25T23:00:00Z'),
  'GS_F_6': new Date('2026-06-25T23:00:00Z'),
  /* Group G */
  'GS_G_1': new Date('2026-06-15T19:00:00Z'),
  'GS_G_2': new Date('2026-06-16T01:00:00Z'),
  'GS_G_3': new Date('2026-06-21T19:00:00Z'),
  'GS_G_4': new Date('2026-06-22T01:00:00Z'),
  'GS_G_5': new Date('2026-06-27T03:00:00Z'),
  'GS_G_6': new Date('2026-06-27T03:00:00Z'),
  /* Group H */
  'GS_H_1': new Date('2026-06-15T16:00:00Z'),
  'GS_H_2': new Date('2026-06-15T22:00:00Z'),
  'GS_H_3': new Date('2026-06-21T16:00:00Z'),
  'GS_H_4': new Date('2026-06-21T22:00:00Z'),
  'GS_H_5': new Date('2026-06-27T00:00:00Z'),
  'GS_H_6': new Date('2026-06-27T00:00:00Z'),
  /* Group I */
  'GS_I_1': new Date('2026-06-16T19:00:00Z'),
  'GS_I_2': new Date('2026-06-16T22:00:00Z'),
  'GS_I_3': new Date('2026-06-22T21:00:00Z'),
  'GS_I_4': new Date('2026-06-23T00:00:00Z'),
  'GS_I_5': new Date('2026-06-26T19:00:00Z'),
  'GS_I_6': new Date('2026-06-26T19:00:00Z'),
  /* Group J */
  'GS_J_1': new Date('2026-06-17T01:00:00Z'),
  'GS_J_2': new Date('2026-06-17T04:00:00Z'),
  'GS_J_3': new Date('2026-06-22T17:00:00Z'),
  'GS_J_4': new Date('2026-06-23T03:00:00Z'),
  'GS_J_5': new Date('2026-06-28T02:00:00Z'),
  'GS_J_6': new Date('2026-06-28T02:00:00Z'),
  /* Group K */
  'GS_K_1': new Date('2026-06-17T17:00:00Z'),
  'GS_K_2': new Date('2026-06-18T02:00:00Z'),
  'GS_K_3': new Date('2026-06-23T17:00:00Z'),
  'GS_K_4': new Date('2026-06-24T02:00:00Z'),
  'GS_K_5': new Date('2026-06-27T23:30:00Z'),
  'GS_K_6': new Date('2026-06-27T23:30:00Z'),
  /* Group L */
  'GS_L_1': new Date('2026-06-17T20:00:00Z'),
  'GS_L_2': new Date('2026-06-17T23:00:00Z'),
  'GS_L_3': new Date('2026-06-23T20:00:00Z'),
  'GS_L_4': new Date('2026-06-23T23:00:00Z'),
  'GS_L_5': new Date('2026-06-27T21:00:00Z'),
  'GS_L_6': new Date('2026-06-27T21:00:00Z'),
};

function fmtDate(month, day, hour, minute = 0) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mi = String(minute).padStart(2, '0');
  return new Date(`2026-${mm}-${dd}T${hh}:${mi}:00Z`);
}

function buildGroupMatches() {
  const matches = [];
  let venueIndex = 0;

  GROUP_LETTERS.forEach((group, gIndex) => {
    const teams = GROUPS[group];

    GROUP_PAIRINGS.forEach((pair, matchIdx) => {
      const matchId = `GS_${group}_${matchIdx + 1}`;
      const matchDate = GROUP_DATES[matchId];

      let venue;
      if (group === 'A') {
        if (matchIdx === 0) venue = VENUES[0];
        else if (matchIdx === 2) venue = VENUES[1];
        else if (matchIdx === 4) venue = VENUES[0];
        else venue = VENUES[venueIndex % VENUES.length];
        venueIndex++;
      } else {
        venue = VENUES[venueIndex++ % VENUES.length];
      }

      let homeTeam = teams[pair[0]];
      let awayTeam = teams[pair[1]];

      if (group === 'A' && matchIdx === 4) {
        homeTeam = teams[3];
        awayTeam = teams[0];
      }

      matches.push({
        id: matchId,
        stage: 'group',
        group,
        matchNumber: gIndex * 6 + matchIdx + 1,
        homeTeam,
        awayTeam,
        matchDate,
        stadium: venue.stadium,
        city: `${venue.city}, ${venue.country}`,
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
        locked: false,
      });
    });
  });

  return matches;
}

function knockoutMatch(config) {
  return {
    stage: config.stage,
    group: null,
    matchNumber: config.matchNumber,
    homeTeam: config.homeTeam,
    awayTeam: config.awayTeam,
    matchDate: config.matchDate,
    stadium: config.venue.stadium,
    city: `${config.venue.city}, ${config.venue.country}`,
    status: 'upcoming',
    homeScore: null,
    awayScore: null,
    locked: false,
    id: config.id,
  };
}

function buildKnockoutMatches() {
  const r32Defs = [
    ['1º Grupo A', '3º Grupo E/F/H/I', fmtDate(6, 28, 17)],
    ['2º Grupo C', '2º Grupo D', fmtDate(6, 28, 20)],
    ['2º Grupo A', '2º Grupo B', fmtDate(6, 28, 23)],
    ['1º Grupo E', '3º Grupo A/B/C/D', fmtDate(6, 29, 17)],
    ['1º Grupo D', '3º Grupo C/E/H/I', fmtDate(6, 29, 20)],
    ['1º Grupo B', '3º Grupo A/C/F/G', fmtDate(6, 29, 23)],
    ['1º Grupo F', '2º Grupo E', fmtDate(6, 30, 17)],
    ['1º Grupo G', '3º Grupo A/B/C/F', fmtDate(6, 30, 20)],
    ['1º Grupo C', '3º Grupo B/E/F/I', fmtDate(6, 30, 23)],
    ['2º Grupo G', '2º Grupo H', fmtDate(7, 1, 17)],
    ['1º Grupo H', '2º Grupo I', fmtDate(7, 1, 20)],
    ['1º Grupo I', '2º Grupo J', fmtDate(7, 1, 23)],
    ['2º Grupo K', '2º Grupo L', fmtDate(7, 2, 17)],
    ['1º Grupo J', '2º Grupo F', fmtDate(7, 2, 20)],
    ['1º Grupo K', '3º Grupo D/E/I/J', fmtDate(7, 3, 17)],
    ['1º Grupo L', '3º Grupo E/H/I/J', fmtDate(7, 3, 20)],
  ];

  const r32 = r32Defs.map(([home, away, date], i) =>
    knockoutMatch({
      id: `R32_${i + 1}`,
      stage: 'r32',
      matchNumber: 73 + i,
      homeTeam: home,
      awayTeam: away,
      matchDate: date,
      venue: pickVenue(3 + i),
    })
  );

  const r16Defs = [
    ['Ganador R32 1', 'Ganador R32 2', fmtDate(7, 4, 17)],
    ['Ganador R32 3', 'Ganador R32 4', fmtDate(7, 4, 20)],
    ['Ganador R32 5', 'Ganador R32 6', fmtDate(7, 5, 17)],
    ['Ganador R32 7', 'Ganador R32 8', fmtDate(7, 5, 20)],
    ['Ganador R32 9', 'Ganador R32 10', fmtDate(7, 6, 17)],
    ['Ganador R32 11', 'Ganador R32 12', fmtDate(7, 6, 20)],
    ['Ganador R32 13', 'Ganador R32 14', fmtDate(7, 7, 17)],
    ['Ganador R32 15', 'Ganador R32 16', fmtDate(7, 7, 20)],
  ];

  const r16 = r16Defs.map(([home, away, date], i) =>
    knockoutMatch({
      id: `R16_${i + 1}`,
      stage: 'r16',
      matchNumber: 89 + i,
      homeTeam: home,
      awayTeam: away,
      matchDate: date,
      venue: pickVenue(11 + i),
    })
  );

  const qfDefs = [
    ['Ganador R16 1', 'Ganador R16 2', fmtDate(7, 9, 20)],
    ['Ganador R16 3', 'Ganador R16 4', fmtDate(7, 10, 17)],
    ['Ganador R16 5', 'Ganador R16 6', fmtDate(7, 11, 17)],
    ['Ganador R16 7', 'Ganador R16 8', fmtDate(7, 11, 20)],
  ];

  const qf = qfDefs.map(([home, away, date], i) =>
    knockoutMatch({
      id: `QF_${i + 1}`,
      stage: 'qf',
      matchNumber: 97 + i,
      homeTeam: home,
      awayTeam: away,
      matchDate: date,
      venue: pickVenue(6 + i),
    })
  );

  const sf = [
    knockoutMatch({
      id: 'SF_1',
      stage: 'sf',
      matchNumber: 101,
      homeTeam: 'Ganador QF 1',
      awayTeam: 'Ganador QF 2',
      matchDate: fmtDate(7, 14, 20),
      venue: VENUES[4],
    }),
    knockoutMatch({
      id: 'SF_2',
      stage: 'sf',
      matchNumber: 102,
      homeTeam: 'Ganador QF 3',
      awayTeam: 'Ganador QF 4',
      matchDate: fmtDate(7, 15, 20),
      venue: VENUES[3],
    }),
  ];

  const third = knockoutMatch({
    id: 'THIRD',
    stage: 'third',
    matchNumber: 103,
    homeTeam: 'Perdedor SF 1',
    awayTeam: 'Perdedor SF 2',
    matchDate: fmtDate(7, 18, 17),
    venue: VENUES[5],
  });

  const final = knockoutMatch({
    id: 'FINAL',
    stage: 'final',
    matchNumber: 104,
    homeTeam: 'Ganador SF 1',
    awayTeam: 'Ganador SF 2',
    matchDate: fmtDate(7, 19, 20),
    venue: VENUES[3],
  });

  return [...r32, ...r16, ...qf, ...sf, third, final];
}

const groupMatches = buildGroupMatches();
const knockoutMatches = buildKnockoutMatches();

export const MATCHES = [...groupMatches, ...knockoutMatches];

export const STAGE_LABELS = {
  group: 'Fase de grupos',
  r32: 'Dieciseisavos de final',
  r16: 'Octavos de final',
  qf: 'Cuartos de final',
  sf: 'Semifinales',
  third: 'Tercer puesto',
  final: 'Final',
};

export const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final'];

if (MATCHES.length !== 104) {
  console.warn(`[fixture] Se esperaban 104 partidos, hay ${MATCHES.length}`);
}
