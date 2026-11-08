import { useState, useEffect } from 'react';
import { useLS, money, monthKey, dateStr, uid } from '../storage.js';
import Sheet from './Sheet.jsx';

export default function Forecast({ L }) {
  const [cats, setCats] = useLS('cats', []);
  const [tx, setTx] = useLS('tx', []);
  const [rec, setRec] = useLS('rec', []);
  const [applied, setApplied] = useLS('recApplied', {});
  const [budget, setBudget] = useLS('budget', { total: 0, cat: {} });
  const [sheet, setSheet] = useState(null); // 'add' | 'manage'
  const [picker, setPicker] = useState(false);
  const [newCat, setNewCat] = useState('');
  const now = new Date();
  const month = monthKey(now);
  const today = now.getDate();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const todayStr = dateStr(now.getFullYear(), now.getMonth(), today);
  const blank = { type: 'expense', cat: '', amount: '', date: todayStr, note: '', repeat: false };
  const [f, setF] = useState(blank);

  // รายการซ้ำทุกเดือน: บันทึกอัตโนมัติเมื่อถึงวันที่กำหนด (เดือนละครั้ง)
  useEffect(() => {
    const ap = { ...applied }; const add = [];
    rec.forEach((x) => {
      if (ap[x.id] !== month && x.day <= today) {
        add.push({ id: uid(), type: x.type, cat: x.cat, amount: x.amount, date: dateStr(now.getFullYear(), now.getMonth(), x.day), note: L('ซ้ำทุกเดือน', 'Recurring') });
        ap[x.id] = month;
      }
    });
    if (add.length) { setTx((t) => [...add, ...t]); setApplied(ap); }
  }, [rec]); // eslint-disable-line

  const all = (t) => tx.filter((x) => x.type === t).reduce((s, x) => s + x.amount, 0);
  const balance = all('income') - all('expense'); // ยอดคงเหลือสะสมทั้งหมด
  const mt = tx.filter((x) => x.date.startsWith(month));
  const sum = (t) => mt.filter((x) => x.type === t).reduce((s, x) => s + x.amount, 0);
  const income = sum('income'), expense = sum('expense');
  const avg = expense / today;
  const projected = balance - avg * (dim - today);
  const byCat = {};
  mt.filter((x) => x.type === 'expense').forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
  const ranked = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const overCats = ranked.filter(([c, v]) => budget.cat[c] > 0 && v > budget.cat[c]).map(([c]) => c);
  const overTotal = budget.total > 0 && expense > budget.total;

  const save = () => {
    const amount = parseFloat(f.amount);
    if (!amount || amount <= 0 || !f.cat) return;
    setTx([{ id: uid(), type: f.type, cat: f.cat, amount, date: f.date, note: f.note }, ...tx]);
    if (f.repeat) {
      const id = uid(), day = Math.min(28, +f.date.slice(8, 10) || 1);
      setRec([...rec, { id, type: f.type, cat: f.cat, amount, day }]);
      setApplied({ ...applied, [id]: month }); // รายการแรกบันทึกแล้ว ไม่ซ้ำในเดือนนี้
    }
    setF(blank); setSheet(null);
  };
  const addCat = () => { const n = newCat.trim(); if (n && !cats.includes(n)) setCats([...cats, n]); if (n) setF((x) => ({ ...x, cat: n })); setNewCat(''); };
  const isInc = f.type === 'income';

  return (
    <section>
      <div className="row"><h2>{L('วางแผนการเงิน', 'Money plan')}</h2>
        <button className="iconBtn" aria-label={L('หมวดหมู่และงบ', 'Categories & budget')} onClick={() => setSheet('manage')}>⚙</button></div>
      {overTotal && <div className="warn">{L(`ใช้จ่ายเกินงบรวมแล้ว (${money(expense)} / ${money(budget.total)})`, `Over total budget (${money(expense)} / ${money(budget.total)})`)}</div>}
      {overCats.map((c) => <div className="warn" key={c}>{L(`หมวด "${c}" เกินงบ`, `"${c}" is over budget`)} ({money(byCat[c])} / {money(budget.cat[c])})</div>)}

      <div className="card">
        <div className="mute">{L('ยอดเงินคงเหลือ (รายรับ − รายจ่ายทั้งหมด)', 'Balance (all income − all expenses)')}</div>
        <div className={'big ' + (balance < 0 ? 'bad' : '')}>{money(balance)}</div>
        <div className="row mute"><span>{L('เดือนนี้', 'This month')}: <span className="good">+{money(income)}</span></span><span className="bad">−{money(expense)}</span></div>
      </div>
      <div className="card">
        <div className="mute">{L('คาดการณ์เงินเหลือสิ้นเดือน', 'Projected balance at month end')}</div>
        <div className={'big ' + (projected < 0 ? 'bad' : 'good')}>{money(projected)}</div>
        <div className="mute">{L('จากค่าเฉลี่ยรายจ่ายต่อวันของเดือนนี้', 'From this month\u2019s average daily spending')}: {money(avg)}</div>
      </div>

      <h3>{L('ใช้เงินกับอะไรมากที่สุด', 'Where the money goes')}</h3>
      <div className="card">
        {ranked.length === 0 && <span className="mute">{L('ยังไม่มีรายจ่ายเดือนนี้ กดปุ่ม + เพื่อเพิ่ม', 'No expenses this month. Tap + to add one')}</span>}
        {ranked.map(([c, v]) => (
          <div key={c} style={{ marginBottom: 8 }}>
            <div className="row"><span>{c}</span><span>{money(v)} · {Math.round((v / expense) * 100)}%</span></div>
            <div className="bar"><i style={{ width: (v / ranked[0][1]) * 100 + '%' }} /></div>
          </div>
        ))}
      </div>

      <h3>{L('รายการล่าสุด', 'Recent')}</h3>
      {mt.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15).map((x) => (
        <div className="card row" key={x.id}>
          <div><div>{x.cat}</div><div className="mute">{x.date} {x.note}</div></div>
          <div className="row"><b className={x.type === 'income' ? 'good' : 'bad'}>{x.type === 'income' ? '+' : '-'}{money(x.amount)}</b>
            <button className="ghost" aria-label={L('ลบ', 'Remove')} onClick={() => setTx(tx.filter((y) => y.id !== x.id))}>✕</button></div>
        </div>
      ))}

      <button className="fab" aria-label={L('เพิ่มรายการ', 'Add transaction')} onClick={() => { setF(blank); setSheet('add'); }}>+</button>

      {sheet === 'add' && (
        <Sheet tall onClose={() => setSheet(null)} title={L('เพิ่มรายการ', 'Add')}
          head={<div className="seg" style={{ flex: 1 }}>
            <button style={{ flex: 1 }} className={!isInc ? 'on' : ''} onClick={() => setF({ ...f, type: 'expense' })}>{L('รายจ่าย', 'Expense')}</button>
            <button style={{ flex: 1 }} className={isInc ? 'on' : ''} onClick={() => setF({ ...f, type: 'income' })}>{L('รายรับ', 'Income')}</button></div>}>
          <input type="date" aria-label={L('วันที่', 'Date')} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <div className="amt"><b className={isInc ? 'good' : 'bad'} style={{ fontSize: '2rem' }}>{isInc ? '↓' : '↑'}$</b>
            <input type="number" inputMode="decimal" min="0" placeholder="0" autoFocus value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
          <button className="pick" onClick={() => setPicker(true)}><span>{f.cat || L('เลือกหมวดหมู่', 'Choose category')}</span><span>›</span></button>
          <input placeholder={L('เพิ่มโน้ต', 'Add a note')} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <label className="tog"><input type="checkbox" checked={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.checked })} />
            <span>{L('ทำซ้ำทุกเดือน (ตามวันที่ที่เลือก สูงสุดวันที่ 28)', 'Repeat every month (on the chosen day, max 28th)')}</span></label>
          <button style={{ width: '100%' }} onClick={save} disabled={!f.cat || !(parseFloat(f.amount) > 0)}>{L('บันทึก', 'Save')}</button>
        </Sheet>
      )}

      {sheet === 'add' && picker && (
        <Sheet z={30} title={L('เลือกหมวดหมู่', 'Choose category')} onClose={() => setPicker(false)}>
          <div className="chips">{cats.map((c) => <button key={c} className={'chip' + (f.cat === c ? ' on' : '')} onClick={() => { setF({ ...f, cat: c }); setPicker(false); }}>{c}</button>)}</div>
          {!cats.length && <div className="mute">{L('ยังไม่มีหมวดหมู่ พิมพ์ชื่อด้านล่างเพื่อสร้าง', 'No categories yet. Type a name below to create one')}</div>}
          <div className="row"><input placeholder={L('ชื่อหมวดหมู่ใหม่', 'New category name')} value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button onClick={() => { addCat(); setPicker(false); }}>{L('เพิ่ม', 'Add')}</button></div>
        </Sheet>
      )}

      {sheet === 'manage' && (
        <Sheet tall title={L('หมวดหมู่และงบประมาณ', 'Categories & budget')} onClose={() => setSheet(null)}>
          <div className="row"><input placeholder={L('ชื่อหมวดหมู่ใหม่', 'New category name')} value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button onClick={addCat}>{L('เพิ่ม', 'Add')}</button></div>
          <div className="mute">{L('งบรวมต่อเดือน ($)', 'Total monthly budget ($)')}</div>
          <input type="number" min="0" value={budget.total || ''} onChange={(e) => setBudget({ ...budget, total: +e.target.value })} />
          {cats.map((c) => (
            <div className="row" key={c}>
              <span style={{ flex: 1 }}>{c}</span>
              <input style={{ width: 110 }} type="number" min="0" placeholder={L('งบ ($)', 'Budget ($)')} value={budget.cat[c] || ''} onChange={(e) => setBudget({ ...budget, cat: { ...budget.cat, [c]: +e.target.value } })} />
              <button className="ghost" aria-label={L('ลบ', 'Remove')} onClick={() => setCats(cats.filter((x) => x !== c))}>✕</button>
            </div>
          ))}
          <h3>{L('รายการที่ทำซ้ำทุกเดือน', 'Monthly recurring')}</h3>
          {!rec.length && <div className="mute">{L('ยังไม่มี เปิดสวิตช์ "ทำซ้ำทุกเดือน" ตอนเพิ่มรายการ', 'None yet. Turn on "Repeat every month" when adding')}</div>}
          {rec.map((x) => (
            <div className="row" key={x.id}><span>{x.cat} · {money(x.amount)} · {L('วันที่', 'day')} {x.day}</span>
              <button className="ghost" aria-label={L('ลบ', 'Remove')} onClick={() => setRec(rec.filter((y) => y.id !== x.id))}>✕</button></div>
          ))}
        </Sheet>
      )}
    </section>
  );
}
