import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToMatches } from '../services/matches';
import { fetchUserPredictions } from '../services/predictions';
import { useAuth } from '../contexts/AuthContext';
import { teamFlagComponents } from '../data/teamCrests';

const PLACEHOLDER_WORDS = ['Ganador','Perdedor','1º','2º','3º','Grupo','Winner','Runner','Best'];
const isPlaceholder = (n) => !n || PLACEHOLDER_WORDS.some(p => n.includes(p));

const toBoliviaTime = (matchDate) => {
  if (!matchDate) return '';
  try {
    const d = typeof matchDate === 'string' ? new Date(matchDate) : matchDate.toDate?.() ?? new Date(matchDate);
    const b = new Date(d.getTime() - 4*3600000);
    const dias = ['D','L','M','X','J','V','S'];
    return `${dias[b.getUTCDay()]} ${b.getUTCDate()}/${b.getUTCMonth()+1} ${String(b.getUTCHours()).padStart(2,'0')}:${String(b.getUTCMinutes()).padStart(2,'0')}`;
  } catch { return ''; }
};

const COORDS = {
  left: {
    r32: ['R32_2','R32_5','R32_1','R32_3','R32_11','R32_12','R32_9','R32_10'],
    r16: [{id:'R16_1',top:57},{id:'R16_2',top:233},{id:'R16_5',top:409},{id:'R16_6',top:585}],
    qf:  [{id:'QF_1',top:145},{id:'QF_2',top:497}],
    sf:  [{id:'SF_1',top:321}],
  },
  right: {
    r32: ['R32_4','R32_6','R32_7','R32_8','R32_13','R32_15','R32_14','R32_16'],
    r16: [{id:'R16_3',top:57},{id:'R16_4',top:233},{id:'R16_8',top:409},{id:'R16_7',top:585}],
    qf:  [{id:'QF_3',top:145},{id:'QF_4',top:497}],
    sf:  [{id:'SF_2',top:321}],
  },
};

function TeamRow({ name, score, isHome, compact }) {
  const Flag = teamFlagComponents?.[name];
  const ph = isPlaceholder(name);
  const fs = compact ? 9 : 10;
  const flagW = compact ? 12 : 15;
  const flagH = compact ? 8 : 10;
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:`${compact?2:3}px 0`,borderTop:isHome?'none':'0.5px solid rgba(62,95,217,0.4)'}}>
      <div style={{display:'flex',alignItems:'center',gap:compact?3:4,overflow:'hidden',flex:1}}>
        {!ph && Flag
          ? <Flag style={{width:flagW,height:flagH,flexShrink:0,borderRadius:1}}/>
          : <span style={{width:flagW,height:flagH,background:'rgba(62,95,217,0.3)',borderRadius:1,display:'inline-block',flexShrink:0}}/>
        }
        <span style={{fontSize:fs,color:ph?'#5a6fa8':'#fff',fontStyle:ph?'italic':'normal',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:compact?34:80}}>
          {ph ? '?' : name}
        </span>
      </div>
      {score != null && <span style={{fontSize:compact?10:11,fontWeight:600,color:'#FFB800',marginLeft:2,flexShrink:0}}>{score}</span>}
    </div>
  );
}

function Card({ match, prediction, compact }) {
  const cw = compact ? 56 : 148;
  const pad = compact ? '3px 4px' : '4px 7px';
  if (!match) return (
    <div style={{width:cw,background:'#0c1f6e',borderRadius:4,padding:pad,borderLeft:'2px solid #2a3f8a',opacity:0.4}}>
      {!compact && <div style={{fontSize:8,color:'#3a4f8a',marginBottom:2}}>—</div>}
      <TeamRow name="" isHome compact={compact}/>
      <TeamRow name="" compact={compact}/>
    </div>
  );
  const hr = !isPlaceholder(match.homeTeam);
  const ar = !isPlaceholder(match.awayTeam);
  const border = (hr&&ar)?'#FFB800':(!hr&&!ar)?'#2a3f8a':'#2DD4A7';
  const finished = match.homeScore!=null && match.awayScore!=null;
  const hasPred = !compact && prediction?.predictedHomeScore!=null;
  const gotPts = (prediction?.points||0) > 0;
  return (
    <div style={{width:cw,background:'#12277E',borderRadius:4,padding:pad,borderLeft:`2px solid ${border}`,opacity:(!hr&&!ar)?0.45:1}}>
      {!compact && <div style={{fontSize:7,color:'#7C90D9',marginBottom:2}}>{toBoliviaTime(match.matchDate)}</div>}
      <TeamRow name={match.homeTeam} score={finished?match.homeScore:null} isHome compact={compact}/>
      <TeamRow name={match.awayTeam} score={finished?match.awayScore:null} compact={compact}/>
      {hasPred && (
        <div style={{fontSize:7,color:gotPts?'#34D399':'#5a6fa8',marginTop:2,paddingTop:2,borderTop:'0.5px solid rgba(62,95,217,0.3)'}}>
          {gotPts?'✓ ':''}Pred: {prediction.predictedHomeScore}-{prediction.predictedAwayScore}
        </div>
      )}
    </div>
  );
}

function Col({ slots, matches, predictions, isR32=false, compact }) {
  const SLOT = compact ? 52 : 88;
  const CARD_H = compact ? 38 : 62;
  const COL_W = compact ? 62 : 158;
  const TOTAL_H = 8 * SLOT;
  return (
    <div style={{position:'relative',width:COL_W,flexShrink:0,height:TOTAL_H}}>
      {isR32
        ? slots.map((id,i) => (
            <div key={id} style={{position:'absolute',top:i*SLOT+SLOT/2-CARD_H/2,left:compact?2:4}}>
              <Card match={matches[id]} prediction={predictions[id]} compact={compact}/>
            </div>
          ))
        : slots.map(({id,top: rawTop}) => {
            const scaledTop = compact ? Math.round(rawTop * 52/88) : rawTop;
            return (
              <div key={id} style={{position:'absolute',top:scaledTop,left:compact?2:4}}>
                <Card match={matches[id]} prediction={predictions[id]} compact={compact}/>
              </div>
            );
          })
      }
    </div>
  );
}

export default function BracketPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
      const m = {};
      Object.values(preds).forEach(p => { m[p.matchId] = p; });
      setPredictions(m);
    }).catch(()=>{});
  }, [currentUser]);

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{color:'#7C90D9',fontSize:14}}>Cargando eliminatorias...</span>
    </div>
  );

  const SLOT = compact ? 52 : 88;
  const TOTAL_H = 8 * SLOT;
  const COL_W = compact ? 62 : 158;
  const CENTER_W = compact ? 72 : 180;
  const TOTAL_W = 8 * COL_W + CENTER_W;

  return (
    <div style={{padding:'10px 8px',maxWidth:1800,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <button onClick={()=>navigate(-1)} style={{background:'rgba(255,184,0,0.15)',border:'1px solid rgba(255,184,0,0.4)',borderRadius:8,padding:'5px 10px',color:'#FFB800',fontSize:11,cursor:'pointer',flexShrink:0}}>← Volver</button>
        <div>
          <div style={{fontSize:compact?14:18,fontWeight:500,color:'#FFB800'}}>🏆 Eliminatorias</div>
          <div style={{fontSize:9,color:'#7C90D9'}}>Los ganadores avanzan solos</div>
        </div>
      </div>

      <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{display:'flex',alignItems:'flex-start',width:TOTAL_W,height:TOTAL_H+16,background:'#0A1F66',border:'1px solid rgba(255,184,0,0.2)',borderRadius:10,padding:'8px 0'}}>

          <Col slots={COORDS.left.r32}  matches={matches} predictions={predictions} isR32 compact={compact}/>
          <Col slots={COORDS.left.r16}  matches={matches} predictions={predictions} compact={compact}/>
          <Col slots={COORDS.left.qf}   matches={matches} predictions={predictions} compact={compact}/>
          <Col slots={COORDS.left.sf}   matches={matches} predictions={predictions} compact={compact}/>

          <div style={{width:CENTER_W,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:TOTAL_H,gap:compact?8:16}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:compact?14:20,marginBottom:2}}>🏆</div>
              <div style={{fontSize:compact?8:10,fontWeight:500,color:'#FFB800',letterSpacing:1,marginBottom:4}}>FINAL</div>
              <Card match={matches['FINAL']} prediction={predictions['FINAL']} compact={compact}/>
            </div>
            <div style={{textAlign:'center',opacity:0.7}}>
              <div style={{fontSize:7,color:'#7C90D9',marginBottom:2}}>3er Lugar</div>
              <Card match={matches['THIRD']} prediction={predictions['THIRD']} compact={compact}/>
            </div>
          </div>

          <Col slots={COORDS.right.sf}  matches={matches} predictions={predictions} compact={compact}/>
          <Col slots={COORDS.right.qf}  matches={matches} predictions={predictions} compact={compact}/>
          <Col slots={COORDS.right.r16} matches={matches} predictions={predictions} compact={compact}/>
          <Col slots={COORDS.right.r32} matches={matches} predictions={predictions} isR32 compact={compact}/>

        </div>
      </div>

      <div style={{display:'flex',gap:10,marginTop:8,flexWrap:'wrap'}}>
        {[['#FFB800','Ambos definidos'],['#2DD4A7','Uno definido'],['#2a3f8a','Por definir']].map(([c,l])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:7,height:7,background:c,borderRadius:2,flexShrink:0}}/>
            <span style={{fontSize:9,color:'#7C90D9'}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
