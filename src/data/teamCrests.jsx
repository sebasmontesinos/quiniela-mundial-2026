/* eslint-disable react-refresh/only-export-components */
import { 
  MX, ZA, KR, CZ, CA, BA, QA, CH, BR, MA, HT, GB_SCT,
  US, PY, AU, TR, DE, CW, CI, EC, NL, JP, SE, TN, BE,
  EG, IR, NZ, ES, CV, SA, UY, FR, SN, IQ, NO, AR, DZ,
  AT, JO, PT, CD, UZ, CO, GB_ENG, HR, GH, PA
} from 'country-flag-icons/react/3x2'

export const teamFlagComponents = {
  "México": MX,
  "Sudáfrica": ZA,
  "Corea del Sur": KR,
  "República Checa": CZ,
  "Canadá": CA,
  "Bosnia y Herzegovina": BA,
  "Catar": QA,
  "Suiza": CH,
  "Brasil": BR,
  "Marruecos": MA,
  "Haití": HT,
  "Escocia": GB_SCT,
  "Estados Unidos": US,
  "Paraguay": PY,
  "Australia": AU,
  "Turquía": TR,
  "Alemania": DE,
  "Curazao": CW,
  "Costa de Marfil": CI,
  "Ecuador": EC,
  "Países Bajos": NL,
  "Japón": JP,
  "Suecia": SE,
  "Túnez": TN,
  "Bélgica": BE,
  "Egipto": EG,
  "Irán": IR,
  "Nueva Zelanda": NZ,
  "España": ES,
  "Cabo Verde": CV,
  "Arabia Saudita": SA,
  "Uruguay": UY,
  "Francia": FR,
  "Senegal": SN,
  "Irak": IQ,
  "Noruega": NO,
  "Argentina": AR,
  "Argelia": DZ,
  "Austria": AT,
  "Jordania": JO,
  "Portugal": PT,
  "RD Congo": CD,
  "Uzbekistán": UZ,
  "Colombia": CO,
  "Inglaterra": GB_ENG,
  "Croacia": HR,
  "Ghana": GH,
  "Panamá": PA
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
