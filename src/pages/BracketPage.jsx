import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToMatches } from '../services/matches';
import { fetchUserPredictions } from '../services/predictions';
import { useAuth } from '../contexts/AuthContext';
import { BRACKET_LEFT, BRACKET_RIGHT } from '../data/bracketTree';
import { teamFlagComponents } from '../data/teamCrests';

const PLACEHOLDER_WORDS = ['Ganador','Perdedor','1º','2º','3º','Grupo','Winner','Runner','Best'];
const isPlaceholder = (name) => !name || PLACEHOLDER_WORDS.some(p => name.includes(p));

const toBoliviaTime = (matchDate) => {
  if (!matchDate) return '';
  try {
    const d = typeof matchDate === 'string' ? new Date(matchDate) : matchDate.toDate?.() ?? new Date(matchDate);
    const bol = new Date(d.getTime() - 4 * 60 * 60 * 1000);
    const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    return `${dias[bol.getUTCDay()]} ${bol.getUTCDate()}/${bol.getUTCMonth()+1} · ${String(bol.getUTCHours()).padStart(2,'0')}:${String(bol.getUTCMinutes()).padStart(2,'0')}`;
  } catch { return ''; }
};

function TeamRow({ name, score, isHome }) {
  const Flag = teamFlagComponents?.[name];
  const ph = isPlaceholder(name);
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0', borderTop: isHome ? 'none' : '0.5px solid rgba(62,95,217,0.5)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
        {!ph && Flag
          ? <Flag style={{ width:16, height:11, flexShrink:0, borderRadius:1 }} />
          : <span style={{ width:16, height:11, flexShrink:0, background:'rgba(62,95,217,0.3)', borderRadius:1, display:'inline-block' }} />
        }
        <span style={{ fontSize:11, color: ph ? '#6B7FC7' : '#fff', fontStyle: ph ? 'italic' : 'normal', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:85 }}>
          {ph ? 'Por definir' : name}
        </span>
      </div>
      {score != null && <span style={{ fontSize:12, fontWeight:500, color:'#FFB800', marginLeft:4, flexShrink:0 }}>{score}</span>}
    </div>
  );
}

function MatchCard({ match, prediction }) {
  if (!match) return (
    <div style={{ background:'#0E2272', borderRadius:6, padding:'5px 8px', borderLeft:'2px solid #3E5FD9', opacity:0.35, width:148 }}>
      <div style={{ fontSize:9, color:'#4A5FA0', marginBottom:3 }}>—</div>
      <TeamRow name="" isHome />
      <TeamRow name="" />
    </div>
  );
  const homeReal = !isPlaceholder(match.homeTeam);
  const awayReal = !isPlaceholder(match.awayTeam);
  const bothReal = homeReal && awayReal;
  const noneReal = !homeReal && !awayReal;
  const borderColor = bothReal ? '#FFB800' : noneReal ? '#3E5FD9' : '#2DD4A7';
  const finished = match.homeScore != null && match.awayScore != null;
  const hasPred = prediction?.predictedHomeScore != null;
  const gotPoints = prediction?.points > 0;
  return (
    <div style={{ background:'#12277E', borderRadius:6, padding:'5px 8px', borderLeft:`2px solid ${borderColor}`, opacity: noneReal ? 0.5 : 1, width:148 }}>
      <div style={{ fontSize:9, color:'#7C90D9', marginBottom:3 }}>{toBoliviaTime(match.matchDate)}</div>
      <TeamRow name={match.homeTeam} score={finished ? match.homeScore : null} isHome />
      <TeamRow name={match.awayTeam} score={finished ? match.awayScore : null} />
      {hasPred && (
        <div style={{ fontSize:9, color: gotPoints ? '#34D399' : '#7C90D9', marginTop:3, paddingTop:2, borderTop:'0.5px solid rgba(62,95,217,0.3)' }}>
          {gotPoints ? '✓ ' : ''}Tu pred: {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
        </div>
      )}
    </div>
  );
}

function BracketColumn({ ids, matches, predictions, totalSlots }) {
  const slots = totalSlots || ids.length;
  return (
    <div style={{ display:'flex', flexDirection:'column', width:160, flexShrink:0 }}>
      {ids.map((id) => (
        <div key={id} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:`${(slots / ids.length) * 88}px` }}>
          <MatchCard match={matches[id]} prediction={predictions[id]} />
        </div>
      ))}
    </div>
  );
}

export default function BracketPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToMatches(
      (list) => {
        const map = {};
        list.forEach(m => { if (m.stage !== 'group') map[m.id] = m; });
        setMatches(map);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchUserPredictions(currentUser.uid).then(preds => {
      const byMatch = {};
      Object.values(preds).forEach(p => { byMatch[p.matchId] = p; });
      setPredictions(byMatch);
    }).catch(() => {});
  }, [currentUser]);

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#7C90D9', fontSize:14 }}>Cargando eliminatorias...</div>
    </div>
  );

  return (
    <div style={{ padding:'16px 12px', maxWidth:1600, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background:'rgba(255,184,0,0.15)', border:'1px solid rgba(255,184,0,0.4)', borderRadius:8, padding:'6px 12px', color:'#FFB800', fontSize:13, cursor:'pointer', flexShrink:0 }}
        >
          ← Volver
        </button>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, color:'#FFB800', margin:0 }}>🏆 Eliminatorias</h1>
          <p style={{ fontSize:11, color:'#7C90D9', margin:0 }}>Los equipos se colocan solos a medida que se definen los cruces</p>
        </div>
      </div>

      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', borderRadius:12 }}>
        <div style={{ display:'flex', alignItems:'stretch', width:1620, height:728, background:'#0A1F66', border:'1px solid rgba(255,184,0,0.2)', borderRadius:12, padding:'12px 0' }}>
          <BracketColumn ids={BRACKET_LEFT.r32} matches={matches} predictions={predictions} totalSlots={8} />
          <BracketColumn ids={BRACKET_LEFT.r16} matches={matches} predictions={predictions} totalSlots={8} />
          <BracketColumn ids={BRACKET_LEFT.qf}  matches={matches} predictions={predictions} totalSlots={8} />
          <BracketColumn ids={BRACKET_LEFT.sf}  matches={matches} predictions={predictions} totalSlots={8} />
          <div style={{ width:180, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:4 }}>🏆</div>
              <div style={{ fontSize:12, fontWeight:500, color:'#FFB800', letterSpacing:1, marginBottom:8 }}>FINAL</div>
              <MatchCard match={matches['FINAL']} prediction={predictions['FINAL']} />
            </div>
            <div style={{ textAlign:'center', opacity:0.7 }}>
              <div style={{ fontSize:10, color:'#7C90D9', marginBottom:4 }}>3er Lugar</div>
              <MatchCard match={matches['THIRD']} prediction={predictions['THIRD']} />
            </div>
          </div>
          <BracketColumn ids={BRACKET_RIGHT.sf}  matches={matches} predictions={predictions} totalSlots={8} />
          <BracketColumn ids={BRACKET_RIGHT.qf}  matches={matches} predictions={predictions} totalSlots={8} />
          <BracketColumn ids={BRACKET_RIGHT.r16} matches={matches} predictions={predictions} totalSlots={8} />
          <BracketColumn ids={BRACKET_RIGHT.r32} matches={matches} predictions={predictions} totalSlots={8} />
        </div>
      </div>

      <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
        {[['#FFB800','Ambos equipos definidos'],['#2DD4A7','Un equipo definido'],['#3E5FD9','Por definir']].map(([color,label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, background:color, borderRadius:2, flexShrink:0 }} />
            <span style={{ fontSize:11, color:'#7C90D9' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
