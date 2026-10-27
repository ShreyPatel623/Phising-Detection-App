import { P } from '../data/icons.js';

/** Static, trusted SVG path data (see data/icons.js) */
export default function Icon({ name }) {
  return <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[name] }} />;
}
