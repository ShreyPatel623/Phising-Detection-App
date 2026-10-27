import ResultCard from './ResultCard.jsx';
import { useApp } from '../context.js';
import { CH_LESSON } from '../data/content.js';

/** ResultCard wired to the app: feedback loop (FR-21), reporting (FR-11), lessons (FR-14) */
export default function ResultView({ r }) {
  const { actions, toast, go } = useApp();
  const feedback = v => {
    toast(actions.feedback(r, v));
    if (v === 'fn') actions.submitReport(r.channel, r.input || r.preview, 'Missed by the detector (false negative)');
  };
  const report = () => { actions.submitReport(r.channel, r.input || r.preview, 'Reported from scan result'); toast('Report sent. Thank you.'); };
  return <ResultCard r={r} onFeedback={feedback} onReport={report} onLearn={() => go('learn', CH_LESSON[r.channel])} />;
}
