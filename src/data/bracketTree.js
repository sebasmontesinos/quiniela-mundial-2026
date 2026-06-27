// Official FIFA 2026 World Cup bracket tree (verified against fifa.com).
// Maps each knockout slot to the two slots that feed into it.
// Our slot IDs: R32_1..R32_16, R16_1..R16_8, QF_1..QF_4, SF_1, SF_2, THIRD, FINAL.

export const BRACKET_TREE = {
  R16_1: ['R32_2', 'R32_5'],
  R16_2: ['R32_1', 'R32_3'],
  R16_3: ['R32_4', 'R32_6'],
  R16_4: ['R32_7', 'R32_8'],
  R16_5: ['R32_11', 'R32_12'],
  R16_6: ['R32_9', 'R32_10'],
  R16_7: ['R32_14', 'R32_16'],
  R16_8: ['R32_13', 'R32_15'],
  QF_1: ['R16_1', 'R16_2'],
  QF_2: ['R16_5', 'R16_6'],
  QF_3: ['R16_3', 'R16_4'],
  QF_4: ['R16_7', 'R16_8'],
  SF_1: ['QF_1', 'QF_2'],
  SF_2: ['QF_3', 'QF_4'],
  FINAL: ['SF_1', 'SF_2'],
};

// The two sides of the bracket (for the ESPN-style symmetric layout).
// Left side feeds SF_1, right side feeds SF_2.
export const BRACKET_LEFT = {
  r32: ['R32_1','R32_3','R32_2','R32_5','R32_9','R32_10','R32_11','R32_12'],
  r16: [
    {id:'R16_2', top:44},
    {id:'R16_1', top:220},
    {id:'R16_6', top:396},
    {id:'R16_5', top:572},
  ],
  qf: [
    {id:'QF_1', top:132},
    {id:'QF_2', top:484},
  ],
  sf: [{id:'SF_1', top:308}],
};

export const BRACKET_RIGHT = {
  r32: ['R32_4','R32_6','R32_7','R32_8','R32_13','R32_15','R32_14','R32_16'],
  r16: [
    {id:'R16_3', top:44},
    {id:'R16_4', top:220},
    {id:'R16_8', top:396},
    {id:'R16_7', top:572},
  ],
  qf: [
    {id:'QF_3', top:132},
    {id:'QF_4', top:453},
  ],
  sf: [{id:'SF_2', top:308}],
};
