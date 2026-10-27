/**
 * Theme, like YouTube: "Use device theme" (default) / "Dark theme" / "Light theme".
 * Stored per device (not per account) so the login screen uses it too.
 * index.html applies the saved choice before first paint to avoid a white flash.
 */
import { useState, useEffect, useCallback } from 'react';

const KEY = 'scamwise:theme';
export const THEMES = ['auto', 'light', 'dark'];
const read = () => { try { const t = localStorage.getItem(KEY); return THEMES.includes(t) ? t : 'auto'; } catch { return 'auto'; } };
const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Apply to <html> and the browser/OS chrome colour. Returns true if the result is dark. */
export function applyTheme(t) {
  const el = document.documentElement, dark = t === 'dark' || (t === 'auto' && prefersDark());
  t === 'auto' ? el.removeAttribute('data-theme') : el.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0F0F0F' : '#FFFFFF');
  return dark;
}

export function useThemeState() {
  const [theme, setThemeState] = useState(read);
  const [dark, setDark] = useState(() => applyTheme(read()));
  useEffect(() => {
    setDark(applyTheme(theme));
    const mq = window.matchMedia('(prefers-color-scheme: dark)'), on = () => setDark(applyTheme(theme));
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on);
  }, [theme]);
  const setTheme = useCallback(t => { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } setThemeState(t); }, []);
  const toggle = useCallback(() => setTheme(dark ? 'light' : 'dark'), [dark, setTheme]);
  return { theme, dark, setTheme, toggle };
}
