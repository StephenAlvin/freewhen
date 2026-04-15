import { useState } from 'react';
import FeedbackDialog from './FeedbackDialog';

export default function TopActions() {
  const [open, setOpen] = useState(false);

  const btn =
    'inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-ink shadow-md ring-1 ring-black/5 hover:bg-white hover:shadow-lg transition';

  return (
    <>
      <div className="flex items-center gap-2">
        <a
          href="https://buymeacoffee.com/stephenalvin"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate"
          className={btn}
        >
          <span aria-hidden>☕</span>
          <span>Donate</span>
        </a>
        <button type="button" onClick={() => setOpen(true)} aria-label="Feedback" className={btn}>
          <span aria-hidden>💬</span>
          <span>Feedback</span>
        </button>
      </div>
      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
