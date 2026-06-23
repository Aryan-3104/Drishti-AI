'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Server, CheckCircle2, X } from 'lucide-react';

// Free-tier hosting (Render) cold-starts the backend on first request.
// This overlay polls the health endpoint and clears itself the moment the
// server responds — so warm loads barely flash, cold loads show clear status.

const EXPECTED_COLD_START_S = 60; // for the progress bar pacing only
const SHOW_AFTER_MS = 1000;       // don't flash the overlay on a warm backend
const POLL_INTERVAL_MS = 2500;

export default function BackendWarmup() {
  const [status, setStatus] = useState<'warming' | 'ready'>('warming');
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const startRef = useRef(Date.now());
  const readyRef = useRef(false);
  const shownRef = useRef(false);

  // Poll the backend until it responds.
  useEffect(() => {
    let active = true;
    let pollId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const ok = await api.health();
      if (!active) return;
      if (ok) {
        readyRef.current = true;
        setStatus('ready');
        if (shownRef.current && !sessionStorage.getItem('drishti_reloaded')) {
          // Cold start: show "Connected" briefly then reload so all
          // dashboard data fetches fire against the now-awake backend.
          // sessionStorage flag prevents a second reload if the backend
          // is still sluggish on the reloaded page.
          sessionStorage.setItem('drishti_reloaded', '1');
          setTimeout(() => { if (active) window.location.reload(); }, 1200);
        } else {
          setVisible(false);
        }
      } else {
        pollId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    poll();

    // Only reveal the overlay if the backend hasn't woken quickly.
    const showId = setTimeout(() => {
      if (active && !readyRef.current) { shownRef.current = true; setVisible(true); }
    }, SHOW_AFTER_MS);

    return () => { active = false; clearTimeout(pollId); clearTimeout(showId); };
  }, []);

  // Tick an elapsed-time counter while warming.
  useEffect(() => {
    if (status === 'ready') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [status]);

  if (!visible || dismissed) return null;

  const pct = status === 'ready'
    ? 100
    : Math.min(95, (elapsed / EXPECTED_COLD_START_S) * 100);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-navy-950/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-navy-900 border border-edge rounded-lg p-7 shadow-xl">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-ink-3 hover:text-ink transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {status === 'ready' ? (
            <div className="w-12 h-12 rounded-full bg-ok/10 border border-ok/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-ok" strokeWidth={2} />
            </div>
          ) : (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-amber border-t-transparent rounded-full animate-spin" />
              <Server className="w-5 h-5 text-amber" strokeWidth={2} />
            </div>
          )}

          <div className="space-y-1.5">
            <h3 className="font-display text-[18px] font-semibold text-ink">
              {status === 'ready' ? 'Connected — loading dashboard' : 'Waking up the server'}
            </h3>
            <p className="text-[13px] text-ink-2 leading-relaxed">
              {status === 'ready' ? (
                'The backend is awake. Live data is loading now.'
              ) : (
                <>
                  Drishti AI runs on a <span className="text-ink font-medium">free-tier backend</span>{' '}that sleeps when idle.
                  The first load can take up to a minute while it wakes up -- this notice clears automatically the moment it&apos;s ready.
                </>
              )}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1.5">
            <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[11px] text-ink-3">
              <span>{status === 'ready' ? 'Ready' : 'Establishing connection…'}</span>
              <span>{elapsed}s</span>
            </div>
          </div>

          {status !== 'ready' && (
            <p className="text-[11px] text-ink-3">
              No action needed -- please keep this tab open.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
