import { useState } from 'react';
import { PROFIT_MISSION_USD } from '../config.js';

// ร่างเนื้อหา — ตรวจแก้ได้ที่ไฟล์นี้ (ไทย/อังกฤษ)
const LESSONS = [
  { t: ['หุ้นคืออะไร', 'What is a stock?'], b: ['หุ้นคือส่วนแบ่งความเป็นเจ้าของในบริษัท เมื่อบริษัทมีมูลค่าเพิ่มขึ้น ราคาหุ้นมักเพิ่มตาม แต่ก็ลดลงได้เช่นกัน', 'A stock is a share of ownership in a company. Its price can rise when the company is worth more, and it can fall too.'] },
  { t: ['กองทุนและ ETF', 'Funds and ETFs'], b: ['กองทุนรวมสินทรัพย์หลายตัวไว้ด้วยกัน ETF เป็นกองทุนประเภทหนึ่งที่ซื้อขายในตลาดได้เหมือนหุ้น ช่วยให้ถือหลายสินทรัพย์ด้วยการซื้อครั้งเดียว', 'A fund pools many assets together. An ETF is a fund you can trade on the market like a stock, so one purchase gives you exposure to many assets.'] },
  { t: ['ความเสี่ยงและการกระจายการลงทุน', 'Risk and diversification'], b: ['ผลตอบแทนสูงมักมาพร้อมความเสี่ยงสูง การกระจายเงินไปหลายสินทรัพย์ช่วยลดผลกระทบเมื่อสินทรัพย์ใดตัวหนึ่งราคาตก และควรลงทุนเฉพาะเงินที่รับความผันผวนได้', 'Higher potential returns usually come with higher risk. Spreading money across several assets reduces the damage if one falls. Invest only what you can afford to see fluctuate.'] },
];
const QUIZ = [
  { q: ['หุ้นคืออะไร?', 'What is a stock?'], o: [['ส่วนแบ่งความเป็นเจ้าของในบริษัท', 'A share of ownership in a company'], ['เงินกู้ให้บริษัท', 'A loan to a company'], ['ใบฝากเงินกับธนาคาร', 'A bank deposit slip'], ['กรมธรรม์ประกัน', 'An insurance policy']], a: 0 },
  { q: ['ETF คืออะไร?', 'What is an ETF?'], o: [['กองทุนที่รวมหลายสินทรัพย์และซื้อขายได้เหมือนหุ้น', 'A fund holding many assets that trades like a stock'], ['หุ้นของบริษัทเดียว', 'Shares of a single company'], ['บัญชีเงินฝากประจำ', 'A fixed deposit account'], ['สกุลเงินดิจิทัล', 'A digital currency']], a: 0 },
  { q: ['การกระจายการลงทุนคืออะไร?', 'What is diversification?'], o: [['ใส่เงินทั้งหมดในสินทรัพย์ที่ดีที่สุด', 'Putting everything in the best asset'], ['แบ่งเงินไปหลายสินทรัพย์เพื่อลดความเสี่ยง', 'Splitting money across assets to reduce risk'], ['ขายทุกอย่างเมื่อราคาตก', 'Selling everything when prices fall'], ['ซื้อเฉพาะวันศุกร์', 'Buying only on Fridays']], a: 1 },
  { q: ['โดยทั่วไป ข้อใดมีความเสี่ยงต่ำที่สุด?', 'Generally, which is the least risky?'], o: [['สัญญาฟิวเจอร์ส', 'Futures'], ['หุ้นรายตัว', 'A single stock'], ['บิตคอยน์', 'Bitcoin'], ['พันธบัตรรัฐบาล', 'Government bond']], a: 3 },
  { q: ['ซื้อหุ้นที่ $100 ตอนนี้ราคา $110 กำไรกี่เปอร์เซ็นต์?', 'You bought at $100 and it is now $110. What is the gain?'], o: [['1%', '1%'], ['10%', '10%'], ['11%', '11%'], ['110%', '110%']], a: 1 },
];

export default function Learn({ L, sim, best, setBest }) {
  const [view, setView] = useState('home');
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [open, setOpen] = useState(null);
  const missions = [
    { t: L('ลงทุนจำลองครั้งแรก', 'Make your first simulated trade'), pts: 10, done: sim.positions.length + sim.realized.length > 0 },
    { t: L(`ทำแบบทดสอบให้ได้ ${QUIZ.length - 1}/${QUIZ.length} ขึ้นไป`, `Score ${QUIZ.length - 1}/${QUIZ.length} or more on the quiz`), pts: 20, done: best >= QUIZ.length - 1 },
    { t: L(`ทำกำไรจากการลงทุนต่อครั้งได้ $${PROFIT_MISSION_USD}`, `Earn $${PROFIT_MISSION_USD} profit from one closed trade`), pts: 30, done: sim.realized.some((x) => x.pl >= PROFIT_MISSION_USD) },
  ];
  const points = missions.filter((m) => m.done).reduce((s, m) => s + m.pts, 0) + best * 5;
  const start = () => { setI(0); setPick(null); setScore(0); setView('quiz'); };
  const next = () => {
    const s = score + (pick === QUIZ[i].a ? 1 : 0);
    if (i + 1 < QUIZ.length) { setScore(s); setI(i + 1); setPick(null); } else { setScore(s); setBest(Math.max(best, s)); setView('done'); }
  };

  if (view === 'quiz') {
    const q = QUIZ[i];
    return (
      <section>
        <h2>{L('ข้อ', 'Question')} {i + 1}/{QUIZ.length}</h2>
        <div className="bar"><i style={{ width: ((i + 1) / QUIZ.length) * 100 + '%' }} /></div>
        <div className="card" style={{ marginTop: 12 }}><b>{L(...q.q)}</b></div>
        {q.o.map((o, k) => (
          <button key={k} disabled={pick !== null} className={'opt' + (pick !== null && k === q.a ? ' right' : pick === k ? ' wrong' : '')} onClick={() => setPick(k)}>{L(...o)}</button>
        ))}
        <button disabled={pick === null} onClick={next} style={{ width: '100%', marginTop: 10 }}>{i + 1 < QUIZ.length ? L('ต่อไป', 'Next') : L('ดูผล', 'See result')}</button>
      </section>
    );
  }
  if (view === 'done') {
    return (
      <section>
        <h2>{L('ผลแบบทดสอบ', 'Quiz result')}</h2>
        <div className="card"><div className="big">{score}/{QUIZ.length}</div><div className="mute">{L('คะแนนที่ดีที่สุดของคุณ', 'Your best')}: {best}/{QUIZ.length}</div></div>
        <button onClick={start}>{L('ทำอีกครั้ง', 'Try again')}</button> <button className="ghost" onClick={() => setView('home')}>{L('กลับ', 'Back')}</button>
      </section>
    );
  }
  return (
    <section>
      <h2>{L('เรียนรู้การลงทุน', 'Learn investing')}</h2>
      <div className="card"><div className="mute">{L('คะแนนสะสม', 'Your points')}</div><div className="big">{points}</div></div>
      <h3>{L('บทเรียน', 'Lessons')}</h3>
      {LESSONS.map((x, k) => (
        <div className="card" key={k}>
          <button className="ghost" style={{ width: '100%', textAlign: 'left', color: 'var(--ink)', fontWeight: 600 }} onClick={() => setOpen(open === k ? null : k)}>{L(...x.t)}</button>
          {open === k && <p>{L(...x.b)}</p>}
        </div>
      ))}
      <h3>{L('แบบทดสอบ', 'Quiz')}</h3>
      <button onClick={start}>{L('เริ่มทำแบบทดสอบ', 'Start quiz')} ({L('ได้ 5 คะแนนต่อข้อที่ถูกในรอบที่ดีที่สุด', '5 points per correct answer in your best run')})</button>
      <h3>{L('ภารกิจฝึกลงทุน', 'Missions')}</h3>
      {missions.map((m, k) => (
        <div className="card row" key={k}><span>{m.done ? '✓ ' : ''}{m.t}</span><b className={m.done ? 'good' : 'mute'}>+{m.pts}</b></div>
      ))}
    </section>
  );
}
