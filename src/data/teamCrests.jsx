/* eslint-disable react-refresh/only-export-components */
import { 
  MX, ZA, KR, CZ, CA, BA, QA, CH, BR, MA, HT, GB_SCT,
  US, PY, AU, TR, DE, CW, CI, EC, NL, JP, SE, TN, BE,
  EG, IR, NZ, ES, CV, SA, UY, FR, SN, IQ, NO, AR, DZ,
  AT, JO, PT, CD, UZ, CO, GB_ENG, HR, GH, PA
} from 'country-flag-icons/react/3x2'

export const teamFlagComponents = {
  "Mexico": MX, "South Africa": ZA, "South Korea": KR,
  "Czech Republic": CZ, "Canada": CA, 
  "Bosnia and Herzegovina": BA, "Qatar": QA,
  "Switzerland": CH, "Brazil": BR, "Morocco": MA,
  "Haiti": HT, "Scotland": GB_SCT, "United States": US,
  "Paraguay": PY, "Australia": AU, "Turkey": TR,
  "Germany": DE, "Curacao": CW, "Ivory Coast": CI,
  "Ecuador": EC, "Netherlands": NL, "Japan": JP,
  "Sweden": SE, "Tunisia": TN, "Belgium": BE,
  "Egypt": EG, "Iran": IR, "New Zealand": NZ,
  "Spain": ES, "Cape Verde": CV, "Saudi Arabia": SA,
  "Uruguay": UY, "France": FR, "Senegal": SN,
  "Iraq": IQ, "Norway": NO, "Argentina": AR,
  "Algeria": DZ, "Austria": AT, "Jordan": JO,
  "Portugal": PT, "DR Congo": CD, "Uzbekistan": UZ,
  "Colombia": CO, "England": GB_ENG, "Croatia": HR,
  "Ghana": GH, "Panama": PA
}

export function TeamFlag({ teamName, size = 28 }) {
  const FlagComponent = teamFlagComponents[teamName]
  if (!FlagComponent) {
    return <span style={{
      fontSize: `${size}px`, 
      marginRight: '8px'
    }}>⚽</span>
  }
  return (
    <FlagComponent 
      style={{
        width: `${size}px`, 
        height: `${size * 0.66}px`,
        marginRight: '8px',
        borderRadius: '3px',
        verticalAlign: 'middle',
        display: 'inline-block',
        objectFit: 'cover'
      }}
      title={teamName}
    />
  )
}
