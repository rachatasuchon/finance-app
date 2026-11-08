import { useState, useEffect } from 'react';
import { useLS } from './storage.js';
import { START_CASH } from './config.js';
import Forecast from './components/Forecast.jsx';
import Simulator from './components/Simulator.jsx';
import Learn from './components/Learn.jsx';

export default function App() {
  const [lang, setLang] = useLS('lang', 'th');
  const [theme, setTheme] = useLS('theme', 'dark');
  const [tab, setTab] = useState('forecast');
  const [sim, setSim] = useLS('sim', { cash: START_CASH, positions: [], realized: [] });
  const [best, setBest] = useLS('quizBest', 0);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const L = (th, en) => (lang === 'th' ? th : en);
  const tabs = [['forecast', L('การเงิน', 'Budget')], ['sim', L('ลงทุนจำลอง', 'Simulator')], ['learn', L('เรียนรู้', 'Learn')], ['settings', L('ตั้งค่า', 'Settings')]];
  return (
    <div className="app">
      <main>
        {tab === 'forecast' && <Forecast L={L} />}
        {tab === 'sim' && <Simulator L={L} sim={sim} setSim={setSim} />}
        {tab === 'learn' && <Learn L={L} sim={sim} best={best} setBest={setBest} />}
        {tab === 'settings' && (
          <section>
            <h2>{L('ตั้งค่า', 'Settings')}</h2>
            <div className="card row">
              <span>{L('ภาษา', 'Language')}</span>
              <div className="seg">
                <button className={lang === 'th' ? 'on' : ''} onClick={() => setLang('th')}>ไทย</button>
                <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
              </div>
            </div>
            <div className="card row">
              <span>{L('โหมดสี', 'Theme')}</span>
              <div className="seg">
                <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>{L('มืด', 'Dark')}</button>
                <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>{L('สว่าง', 'Light')}</button>
              </div>
            </div>
            <button className="danger" onClick={() => { if (confirm(L('ลบข้อมูลทั้งหมดในเบราว์เซอร์นี้?', 'Delete all data in this browser?'))) { Object.keys(localStorage).filter((k) => k.startsWith('ml_')).forEach((k) => localStorage.removeItem(k)); location.reload(); } }}>
              {L('ลบข้อมูลทั้งหมด', 'Delete all data')}
            </button>
          </section>
        )}
      </main>
      <nav>{tabs.map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}</nav>
    </div>
  );
}
