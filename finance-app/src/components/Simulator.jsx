import { useState, useEffect } from 'react';
import { ASSETS, START_CASH } from '../config.js';
import { fetchQuote } from '../api.js';
import { money, uid } from '../storage.js';

export default function Simulator({ L, sim, setSim }) {
  const [quotes, setQuotes] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sym, setSym] = useState(ASSETS[0]);
  const [amt, setAmt] = useState('');
  const name = (s) => (s === 'GLD' ? L('ทองคำ (GLD ETF)', 'Gold (GLD ETF)') : s);

  async function refresh() {
    setBusy(true); setErr('');
    const q = {}; let bad = 0, noKey = false;
    const syms = [...new Set([...ASSETS, ...sim.positions.map((p) => p.sym)])];
    await Promise.all(syms.map(async (s) => {
      try { q[s] = await fetchQuote(s); } catch (e) { bad++; if (e.message === 'NO_KEY') noKey = true; }
    }));
    if (noKey) setErr(L('ยังไม่ได้ใส่ API key ในไฟล์ src/config.js', 'No API key yet: set it in src/config.js'));
    else if (bad) setErr(L(`ดึงราคาไม่สำเร็จ ${bad} รายการ`, `Could not load ${bad} price(s)`));
    setQuotes(q); setBusy(false);
  }
  useEffect(() => { refresh(); }, []); // eslint-disable-line

  const cur = (p) => quotes[p.sym]?.price;
  const value = (p) => (cur(p) ? p.amount * (cur(p) / p.buy) : p.amount);
  const total = sim.cash + sim.positions.reduce((s, p) => s + value(p), 0);
  const a = parseFloat(amt);
  const canBuy = quotes[sym] && a > 0 && a <= sim.cash;

  const buy = () => {
    if (!canBuy) return;
    setSim({ ...sim, cash: sim.cash - a, positions: [...sim.positions, { id: uid(), sym, buy: quotes[sym].price, amount: a }] });
    setAmt('');
  };
  const sell = (p) => {
    if (!cur(p)) return;
    const pl = value(p) - p.amount;
    setSim({ cash: sim.cash + value(p), positions: sim.positions.filter((x) => x.id !== p.id), realized: [...sim.realized, { sym: p.sym, pl, pct: (cur(p) / p.buy - 1) * 100 }] });
  };
  const pct = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  const realizedTotal = sim.realized.reduce((s, x) => s + x.pl, 0);

  return (
    <section>
      <h2>{L('ลงทุนจำลอง', 'Investment simulator')}</h2>
      <div className="card">
        <div className="mute">{L('มูลค่าพอร์ตรวม', 'Total portfolio value')}</div>
        <div className="big">{money(total)}</div>
        <div className="row mute"><span>{L('เงินสด', 'Cash')}: {money(sim.cash)}</span><span className={total >= START_CASH ? 'good' : 'bad'}>{money(total - START_CASH)} ({pct(((total - START_CASH) / START_CASH) * 100)})</span></div>
      </div>

      <div className="card">
        <select value={sym} onChange={(e) => setSym(e.target.value)}>
          {ASSETS.map((s) => <option key={s} value={s}>{name(s)}{quotes[s] ? ` · ${money(quotes[s].price)}` : ''}</option>)}
        </select>
        <input type="number" min="0" placeholder={L('เงินลงทุน ($)', 'Amount to invest ($)')} value={amt} onChange={(e) => setAmt(e.target.value)} />
        <div className="row">
          <button onClick={buy} disabled={!canBuy}>{L('ซื้อที่ราคาปัจจุบัน', 'Buy at current price')}</button>
          <button className="ghost" onClick={refresh} disabled={busy}>{busy ? '…' : L('รีเฟรชราคา', 'Refresh prices')}</button>
        </div>
      </div>

      <h3>{L('สถานะการลงทุน', 'Positions')}</h3>
      {sim.positions.length === 0 && <div className="mute">{L('ยังไม่มีการลงทุน', 'No positions yet')}</div>}
      {sim.positions.map((p) => {
        const c = cur(p); const ch = c ? (c / p.buy - 1) * 100 : 0;
        return (
          <div className="card" key={p.id}>
            <div className="row"><b>{name(p.sym)}</b><b className={ch >= 0 ? 'good' : 'bad'}>{c ? pct(ch) : '—'}</b></div>
            <div className="mute">{L('ราคาซื้อ', 'Buy')} {money(p.buy)} → {L('ปัจจุบัน', 'Now')} {c ? money(c) : '—'}</div>
            <div className="row"><span>{money(p.amount)} → {money(value(p))} <span className={ch >= 0 ? 'good' : 'bad'}>({money(value(p) - p.amount)})</span></span>
              <button onClick={() => sell(p)} disabled={!c}>{L('ขาย', 'Sell')}</button></div>
          </div>
        );
      })}
      <h3>{L('ผลที่ขายแล้ว', 'Closed trades')}: <span className={realizedTotal >= 0 ? 'good' : 'bad'}>{money(realizedTotal)}</span></h3>
      {sim.realized.slice().reverse().slice(0, 10).map((x, i) => (
        <div className="row mute" key={i}><span>{x.sym}</span><span className={x.pl >= 0 ? 'good' : 'bad'}>{money(x.pl)} ({pct(x.pct)})</span></div>
      ))}
      <button className="danger" onClick={() => setSim({ cash: START_CASH, positions: [], realized: [] })}>{L('เริ่มพอร์ตใหม่', 'Reset portfolio')}</button>
    </section>
  );
}
