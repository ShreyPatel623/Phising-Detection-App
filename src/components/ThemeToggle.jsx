import Icon from './Icon.jsx';
import { useTheme } from '../context.js';

/** Quick light/dark switch for the header (full choice incl. "device theme" is in Settings) */
export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
  return <button className="iconbtn" onClick={toggle} aria-label={label} title={label}><Icon name={dark ? 'sun' : 'moon'} /></button>;
}
