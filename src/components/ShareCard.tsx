import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface Props { url: string; }

export default function ShareCard({ url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 120, margin: 1,
      color: { dark: '#1f2937', light: '#ffffff' },
    }).catch((err: unknown) => console.error('QR render failed', err));
  }, [url]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="bg-surface rounded-chunk p-6 border border-[var(--fw-soft)] shadow-card flex flex-col sm:flex-row gap-5 items-center">
      <div className="p-2 bg-white rounded-xl border-2 border-[var(--fw-soft)]">
        <canvas ref={canvasRef} width={120} height={120} aria-label="QR code to this event" />
      </div>
      <div className="flex-1 w-full">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink/50 mb-1">📱 Scan or share link</div>
        <div className="flex items-center justify-between gap-2 bg-[var(--fw-bg2)] border-2 border-dashed border-[color:rgba(253,186,116,0.7)] rounded-lg px-3 py-3 font-mono text-xs sm:text-sm break-all">
          <span>{url.replace(/^https?:\/\//, '')}</span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 bg-[var(--fw-soft)] text-brand font-semibold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-md"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
