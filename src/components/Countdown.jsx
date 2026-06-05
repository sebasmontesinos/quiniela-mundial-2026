import { useEffect, useState } from 'react';

const TARGET = new Date('2026-06-11T19:00:00Z').getTime();
const MS_IN_DAY = 1000 * 60 * 60 * 24;

function calc(now) {
  const diff = TARGET - now;
  if (diff <= 0) return { ended: true, diff: 0 };
  const totalSec = Math.floor(diff / 1000);
  return {
    ended: false,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    diff,
  };
}

function Unit({ value, label }) {
  return (
    <div className="fifa-card flex flex-col items-center justify-center p-3 min-w-[80px]">
      <span className="text-[2.5rem] font-bold text-fifa-gold leading-none">{value}</span>
      <span className="text-[0.75rem] uppercase text-[#94A3B8] mt-1 tracking-wider">{label}</span>
    </div>
  );
}

export default function Countdown() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = calc(now);

  if (t.ended && t.diff === 0) {
    return null;
  }

  if (t.diff > MS_IN_DAY * 365) {
    return null;
  }

  if (t.ended) {
    if (t.diff < -MS_IN_DAY) return null;
    return (
      <div className="text-center py-6 border-y border-fifa-gold/30 mb-8">
        <p className="text-fifa-gold text-xl font-bold">⚽ ¡El Mundial ha comenzado!</p>
      </div>
    );
  }

  return (
    <div className="border-y border-fifa-gold/30 py-6 mb-8">
      <p className="text-center text-[#94A3B8] text-sm mb-4">Faltan para el primer partido:</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
        <Unit value={t.days} label="días" />
        <Unit value={t.hours} label="horas" />
        <Unit value={t.minutes} label="min" />
        <Unit value={t.seconds} label="seg" />
      </div>
    </div>
  );
}
