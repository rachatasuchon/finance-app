import { useState, useEffect } from 'react';
// เก็บข้อมูลใน localStorage ของเบราว์เซอร์ผู้ใช้เท่านั้น
export function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem('ml_' + key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem('ml_' + key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}
export const money = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const p2 = (n) => String(n).padStart(2, '0');
export const monthKey = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
export const dateStr = (y, m, d) => `${y}-${p2(m + 1)}-${p2(d)}`;
export const uid = () => Math.random().toString(36).slice(2, 10);
