import { useState } from 'react';

interface Props { url: string; }

export default function ShareCard({ url }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 font-mono font-semibold text-sm sm:text-base text-ink break-all border-[3px] border-dashed border-[color:rgba(253,186,116,1)] rounded-chunk px-4 py-2.5">
        {url.replace(/^https?:\/\//, '')}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-white font-semibold text-base px-5 py-2.5 rounded-chunk shadow-md hover:shadow-lg active:shadow-sm hover:brightness-110 active:brightness-95 transition-all"
        style={{ background: 'var(--fw-primary)' }}
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}
