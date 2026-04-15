import { useEffect, useState } from 'react';

const WEBHOOK_URL =
  'https://discord.com/api/webhooks/1493902513747787906/FtVs2Rowm-XZQ-dbrgsIcO9ikw7v6o5kPEzk-ve29Q0eK1NL1sGK8NL1ZQQaYZtJGdcm';

interface Props { open: boolean; onClose: () => void }

export default function FeedbackDialog({ open, onClose }: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) { setText(''); setStatus('idle'); setErrorMsg(null); }
  }, [open]);

  if (!open) return null;

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setStatus('sending');
    setErrorMsg(null);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `**${location.pathname}**\n${trimmed}` }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('sent');
      setTimeout(onClose, 900);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-title"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6"
        style={{
          background:
            'radial-gradient(circle at 12% 22%, rgba(255,255,255,0.6) 0%, transparent 38%), linear-gradient(135deg, var(--fw-bg1) 0%, var(--fw-bg2) 100%)',
          color: 'var(--fw-ink)',
          boxShadow: '0 20px 50px -20px rgba(0,0,0,0.25)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="fb-title" className="text-lg sm:text-xl font-semibold">How can I make this better?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink/50 hover:text-ink text-xl leading-none -mr-1 -mt-1 p-1 transition"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-ink/60 mt-1">I'm always looking for ways to improve this.</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Please share your suggestions as clearly"
          rows={5}
          className="mt-4 w-full resize-none rounded-xl outline-none px-3 py-2.5 text-sm placeholder:text-ink/40"
          style={{
            background: 'rgba(255,255,255,0.7)',
            color: 'var(--fw-ink)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fw-primary)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
        />

        {status === 'error' && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
        {status === 'sent' && <p className="mt-2 text-sm" style={{ color: 'var(--fw-primary-dark)' }}>Thanks for the feedback!</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink/70 hover:text-ink hover:bg-black/5 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!text.trim() || status === 'sending'}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
            style={{ background: 'var(--fw-primary)' }}
          >
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
