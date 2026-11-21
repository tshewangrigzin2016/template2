import { useEffect, useRef, useState } from 'react';
import { Check, Play, Sparkles, X } from 'lucide-react';
import {
  AuthMode,
  WORKFLOW_SCENARIOS,
  computeTotalLatency,
  validateAuthForm,
} from '../utils/workflow';

export type ActiveModal =
  | null
  | { type: 'try-live' }
  | { type: 'auth'; mode: AuthMode; selectedPlan?: string }
  | { type: 'walkthrough' };

interface InteractiveDialogsProps {
  modal: ActiveModal;
  onClose: () => void;
  onSwitchAuthMode: (mode: AuthMode) => void;
  videoSrc: string;
  posterSrc: string;
}

const WALKTHROUGH_CHAPTERS = [
  { time: '0:00', seconds: 0, title: 'Listening to live enterprise signals' },
  { time: '0:28', seconds: 1.5, title: 'FluxEngine schema mapping without scripts' },
  { time: '0:56', seconds: 3.2, title: 'Deterministic cross-system execution' },
  { time: '1:18', seconds: 4.8, title: 'Audit logs, retries & zero-downtime deploys' },
];

export default function InteractiveDialogs({
  modal,
  onClose,
  onSwitchAuthMode,
  videoSrc,
  posterSrc,
}: InteractiveDialogsProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Try-Live sandbox state
  const [scenarioId, setScenarioId] = useState(WORKFLOW_SCENARIOS[0].id);
  const [completedStepCount, setCompletedStepCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Auth form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [submittedAccount, setSubmittedAccount] = useState<string | null>(null);

  // Walkthrough chapter state
  const [activeChapter, setActiveChapter] = useState(0);
  const walkthroughVideoRef = useRef<HTMLVideoElement>(null);

  // Reset modal transient states on open/type switch
  useEffect(() => {
    if (!modal) return;
    setErrors({});
    setSubmittedAccount(null);
    if (modal.type === 'try-live') {
      setCompletedStepCount(0);
      setIsRunning(false);
    }
    if (modal.type === 'walkthrough') {
      setActiveChapter(0);
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeRef.current?.focus();
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modal, onClose]);

  // Step-by-step deterministic execution timer for Try-Live
  useEffect(() => {
    if (!isRunning) return;
    const scenario =
      WORKFLOW_SCENARIOS.find((item) => item.id === scenarioId) ?? WORKFLOW_SCENARIOS[0];
    if (completedStepCount >= scenario.steps.length) {
      setIsRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCompletedStepCount((count) => count + 1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [isRunning, completedStepCount, scenarioId]);

  if (!modal) return null;

  const activeScenario =
    WORKFLOW_SCENARIOS.find((item) => item.id === scenarioId) ?? WORKFLOW_SCENARIOS[0];
  const totalLatency = computeTotalLatency(activeScenario.steps);

  const handleRunWorkflow = () => {
    setCompletedStepCount(0);
    setIsRunning(true);
  };

  const handleAuthSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (modal.type !== 'auth') return;
    const result = validateAuthForm(modal.mode, { name, email, password });
    setErrors(result.errors);
    if (!result.valid) return;
    setSubmittedAccount(email.trim());
  };

  const handleChapterJump = (index: number) => {
    setActiveChapter(index);
    const video = walkthroughVideoRef.current;
    if (video) {
      video.currentTime = WALKTHROUGH_CHAPTERS[index].seconds;
      video.play().catch(() => {});
    }
  };

  const dialogTitle =
    modal.type === 'try-live'
      ? 'FluxEngine™ Live Sandbox'
      : modal.type === 'walkthrough'
        ? 'How we build — Architecture Walkthrough (1:35)'
        : modal.mode === 'signup'
          ? 'Create your LinkFlow workspace'
          : 'Enter your LinkFlow workspace';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[#141e13]/65 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="linkflow-dialog-title"
        className="relative z-10 w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#f7f8f4] text-[#1f2a1d] shadow-2xl border border-[#1f2a1d]/12"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#1f2a1d]/10">
          <div>
            <h2 id="linkflow-dialog-title" className="text-xl font-semibold tracking-tight">
              {dialogTitle}
            </h2>
            {modal.type === 'auth' && modal.selectedPlan && (
              <p className="mt-1 text-sm text-[#3d5638]">
                Selected tariff: {modal.selectedPlan}
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex items-center justify-center w-10 h-10 rounded-full text-[#1f2a1d] hover:bg-[#1f2a1d]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 1. FluxEngine Live Sandbox */}
        {modal.type === 'try-live' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-[#3d4d3a] leading-relaxed">
                Select a live enterprise signal and watch FluxEngine™ route, transform, and sync
                downstream systems without a single custom glue script.
              </p>

              <div
                role="tablist"
                aria-label="Workflow scenarios"
                className="mt-4 flex flex-wrap gap-2"
              >
                {WORKFLOW_SCENARIOS.map((scenario) => {
                  const selected = scenario.id === activeScenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => {
                        setScenarioId(scenario.id);
                        setCompletedStepCount(0);
                        setIsRunning(false);
                      }}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2 ${
                        selected
                          ? 'bg-[#1f2a1d] text-white'
                          : 'bg-[#e9ede5] text-[#2d3a2a] hover:bg-[#dce3d6]'
                      }`}
                    >
                      {scenario.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#1f2a1d]/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#3d5638] font-medium">
                <span>Incoming Signal</span>
                <span>{activeScenario.signalLabel}</span>
              </div>
              <pre className="mt-2 text-xs text-[#1f2a1d] bg-[#f2f5ee] rounded-lg p-3 overflow-x-auto font-mono">
                {activeScenario.incomingPayload}
              </pre>
            </div>

            <ol className="space-y-2.5" aria-label="Pipeline execution steps">
              {activeScenario.steps.map((step, index) => {
                const done = index < completedStepCount;
                const active = isRunning && index === completedStepCount;
                return (
                  <li
                    key={step.id}
                    className={`flex items-start justify-between gap-4 rounded-xl px-4 py-3 border transition-colors ${
                      done
                        ? 'bg-[#eef4ec] border-[#336443]/30'
                        : active
                          ? 'bg-white border-[#336443]'
                          : 'bg-white/70 border-[#1f2a1d]/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 tabular-nums ${
                          done
                            ? 'bg-[#336443] text-white'
                            : 'bg-[#e6ece3] text-[#2d3a2a]'
                        }`}
                      >
                        {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#1f2a1d]">
                          {step.system}{' '}
                          <span className="font-normal text-[#3d4d3a]">— {step.action}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-[#3d5638]">
                          {done
                            ? step.outputSummary
                            : active
                              ? 'Processing signal payload…'
                              : 'Waiting for upstream step'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#3d5638] shrink-0">
                      {step.latencyMs}ms
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1f2a1d]/10">
              <div className="text-xs text-[#3d4d3a] tabular-nums">
                {completedStepCount === activeScenario.steps.length ? (
                  <span className="font-semibold text-[#295437]">
                    Completed all {activeScenario.steps.length} steps in {totalLatency}ms
                  </span>
                ) : (
                  <span>Estimated end-to-end runtime: {totalLatency}ms</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleRunWorkflow}
                disabled={isRunning}
                className="inline-flex items-center gap-2 bg-[#1f2a1d] hover:bg-[#2a3827] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{isRunning ? 'Running signal…' : 'Dispatch Test Signal'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Sign Me Up! / Enter Dialog */}
        {modal.type === 'auth' && (
          <div className="p-6">
            {submittedAccount ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-[#336443] text-white">
                  <Check className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#1f2a1d]">
                  {modal.mode === 'signup' ? 'Workspace request confirmed' : 'Signed in to LinkFlow'}
                </h3>
                <p className="text-sm text-[#3d4d3a] max-w-md mx-auto">
                  {modal.mode === 'signup'
                    ? `Your FluxEngine™ sandbox invitation for ${submittedAccount} is ready.`
                    : `Welcome back, ${submittedAccount}. Your active workflows are synced.`}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                >
                  Return to LinkFlow
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} noValidate className="space-y-4">
                <div className="flex gap-2 p-1 rounded-lg bg-[#e9ede5] w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      onSwitchAuthMode('signup');
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] ${
                      modal.mode === 'signup'
                        ? 'bg-white text-[#1f2a1d] shadow-sm'
                        : 'text-[#3d4d3a] hover:text-[#1f2a1d]'
                    }`}
                  >
                    Sign Me Up!
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      onSwitchAuthMode('signin');
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] ${
                      modal.mode === 'signin'
                        ? 'bg-white text-[#1f2a1d] shadow-sm'
                        : 'text-[#3d4d3a] hover:text-[#1f2a1d]'
                    }`}
                  >
                    Enter
                  </button>
                </div>

                {modal.mode === 'signup' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-sm font-medium text-[#1f2a1d]">
                      Full name or team
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Maya Lin — Platform Ops"
                      aria-invalid={Boolean(errors.name)}
                      className="mt-1.5 w-full rounded-xl bg-white border border-[#1f2a1d]/20 px-4 py-2.5 text-sm text-[#1f2a1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#336443]"
                    />
                    {errors.name && (
                      <p role="alert" className="mt-1 text-xs font-medium text-[#9b2c2c]">
                        {errors.name}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-sm font-medium text-[#1f2a1d]">
                    Work email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    aria-invalid={Boolean(errors.email)}
                    className="mt-1.5 w-full rounded-xl bg-white border border-[#1f2a1d]/20 px-4 py-2.5 text-sm text-[#1f2a1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#336443]"
                  />
                  {errors.email && (
                    <p role="alert" className="mt-1 text-xs font-medium text-[#9b2c2c]">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-sm font-medium text-[#1f2a1d]"
                  >
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    aria-invalid={Boolean(errors.password)}
                    className="mt-1.5 w-full rounded-xl bg-white border border-[#1f2a1d]/20 px-4 py-2.5 text-sm text-[#1f2a1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#336443]"
                  />
                  {errors.password && (
                    <p role="alert" className="mt-1 text-xs font-medium text-[#9b2c2c]">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-[#3d4d3a] hover:text-[#1f2a1d] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                  >
                    {modal.mode === 'signup' ? 'Create Workspace' : 'Enter Workspace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. How we build? 1:35 Walkthrough Dialog */}
        {modal.type === 'walkthrough' && (
          <div className="p-6 space-y-5">
            <div className="relative overflow-hidden rounded-xl bg-[#141e13] aspect-video">
              <video
                ref={walkthroughVideoRef}
                src={videoSrc}
                poster={posterSrc}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#3d5638]">Walkthrough Chapters · 1:35</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WALKTHROUGH_CHAPTERS.map((chapter, idx) => (
                  <button
                    key={chapter.time}
                    type="button"
                    onClick={() => handleChapterJump(idx)}
                    className={`flex items-center gap-3 text-left px-3.5 py-2.5 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] ${
                      activeChapter === idx
                        ? 'bg-[#eef4ec] border-[#336443]/40 text-[#1f2a1d]'
                        : 'bg-white border-[#1f2a1d]/10 text-[#3d4d3a] hover:bg-[#f2f5ee]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 text-[#336443] shrink-0" aria-hidden="true" />
                    <span className="text-xs font-mono tabular-nums text-[#3d5638] shrink-0">
                      {chapter.time}
                    </span>
                    <span className="text-xs font-medium truncate">{chapter.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
