import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LogIn, Menu, Play, Sparkles, UserPlus, X } from 'lucide-react';
import BoomerangVideoBg from './components/BoomerangVideoBg';
import MobileDrawer, { NavLinkItem } from './components/MobileDrawer';
import InteractiveDialogs, { ActiveModal } from './components/InteractiveDialogs';
import BelowFoldSections from './components/BelowFoldSections';
import {
  INITIAL_HERO_SCALE,
  NavbarMorphMetrics,
  computeHeroZoomState,
  computeNavbarFrame,
  computeNavbarMetrics,
  computeScrollProgress,
} from './utils/scrollZoom';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4';
const POSTER_IMAGE = '/src/assets/images/linkflow_karst_poster_1795175095429.jpg';

const NAV_LINKS: NavLinkItem[] = [
  { id: 'mission', href: '#mission', label: 'Purpose' },
  { id: 'how', href: '#how', label: 'The Process' },
  { id: 'pricing', href: '#pricing', label: 'Tariffs' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('mission');
  const [modal, setModal] = useState<ActiveModal>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const heroMediaWrapRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);

  // Header scroll-morph refs (all updated via GPU-composited transform & opacity without React re-renders)
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const headerPillRef = useRef<HTMLDivElement>(null);
  const headerLogoRef = useRef<HTMLAnchorElement>(null);
  const headerNavRef = useRef<HTMLElement>(null);
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const mobileMenuSurfaceRef = useRef<HTMLSpanElement>(null);
  const navMetricsRef = useRef<NavbarMorphMetrics | null>(null);

  // Subscribe to prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Scroll-driven GPU-composited hero zoom-out (1.28x -> 1.0x) synced with pill navbar morphing
  useLayoutEffect(() => {
    const track = heroTrackRef.current;
    const mediaWrap = heroMediaWrapRef.current;
    const copyEl = heroCopyRef.current;
    const headerInner = headerInnerRef.current;
    const pillEl = headerPillRef.current;
    const logoEl = headerLogoRef.current;
    const navEl = headerNavRef.current;
    const actionsEl = headerActionsRef.current;
    const mobileSurfaceEl = mobileMenuSurfaceRef.current;
    if (!track || !mediaWrap || !copyEl || !headerInner || !pillEl || !logoEl || !actionsEl) {
      return;
    }

    let rafId = 0;

    const measureHeaderLayout = () => {
      const containerWidth = headerInner.clientWidth;
      if (containerWidth <= 0) return;

      const centerWidth = navEl ? navEl.offsetWidth : 0;
      const hasDesktopNav = centerWidth > 0;
      const isTabletOrDesktop = window.innerWidth >= 640;

      const metrics = computeNavbarMetrics({
        containerWidth,
        leftX: logoEl.offsetLeft,
        leftWidth: logoEl.offsetWidth,
        centerX: navEl ? navEl.offsetLeft : 0,
        centerWidth,
        rightX: actionsEl.offsetLeft,
        rightWidth: actionsEl.offsetWidth,
        compactGap: hasDesktopNav ? 24 : isTabletOrDesktop ? 22 : 18,
        padLeft: hasDesktopNav ? 24 : 20,
        padRight: hasDesktopNav ? 22 : 6,
      });

      navMetricsRef.current = metrics;
      pillEl.style.left = `${metrics.pillBaseLeft.toFixed(2)}px`;
      pillEl.style.width = `${metrics.pillBaseWidth.toFixed(2)}px`;
    };

    const applyZoomAndNavbar = () => {
      rafId = 0;
      const rect = track.getBoundingClientRect();
      const progress = computeScrollProgress(rect.top, rect.height, window.innerHeight);
      const state = computeHeroZoomState(progress, reducedMotion);

      mediaWrap.style.transform = `translate3d(0, ${state.mediaTranslateY.toFixed(2)}px, 0) scale(${state.mediaScale.toFixed(4)})`;
      mediaWrap.setAttribute('data-zoom-scale', state.mediaScale.toFixed(3));
      track.setAttribute('data-scroll-progress', state.progress.toFixed(3));
      track.setAttribute('data-nav-expand', state.navExpand.toFixed(3));
      track.setAttribute('data-nav-pill-opacity', state.navPillOpacity.toFixed(3));

      copyEl.style.transform = `translate3d(0, ${state.contentTranslateY.toFixed(2)}px, 0)`;
      copyEl.style.opacity = state.contentOpacity.toFixed(3);

      const metrics = navMetricsRef.current;
      if (metrics) {
        const frame = computeNavbarFrame(metrics, state.navExpand, state.navPillOpacity);

        logoEl.style.transform = `translate3d(${frame.leftTranslateX.toFixed(2)}px, 0, 0)`;
        if (navEl) {
          navEl.style.transform = `translate3d(${frame.centerTranslateX.toFixed(2)}px, 0, 0)`;
        }
        actionsEl.style.transform = `translate3d(${frame.rightTranslateX.toFixed(2)}px, 0, 0)`;

        pillEl.style.transform = `translate3d(${frame.pillTranslateX.toFixed(2)}px, 0, 0) scaleX(${frame.pillScaleX.toFixed(4)})`;
        pillEl.style.opacity = frame.pillOpacity.toFixed(3);
        pillEl.setAttribute('data-pill-opacity', frame.pillOpacity.toFixed(3));
        pillEl.setAttribute('data-pill-scale-x', frame.pillScaleX.toFixed(3));
      }

      if (mobileSurfaceEl) {
        mobileSurfaceEl.style.opacity = state.navExpand.toFixed(3);
      }
    };

    const scheduleApply = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(applyZoomAndNavbar);
    };

    const handleResize = () => {
      measureHeaderLayout();
      applyZoomAndNavbar();
    };

    measureHeaderLayout();
    applyZoomAndNavbar();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureHeaderLayout();
        applyZoomAndNavbar();
      });
      resizeObserver.observe(headerInner);
    }

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (cancelled) return;
        measureHeaderLayout();
        applyZoomAndNavbar();
      });
    }

    window.addEventListener('scroll', scheduleApply, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleApply);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  // Track active nav section dynamically as the user scrolls
  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0.05 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleCloseDrawer = useCallback(() => setMenuOpen(false), []);
  const handleCloseModal = useCallback(() => setModal(null), []);

  return (
    <div className="min-h-[100svh] bg-[#f4f5f0] text-[#1f2a1d]">
      <main id="top">
        {/* Scroll Zoom Track: pins the hero viewport while zooming the background out from 1.28x to 1.0x and expanding the pill navbar smoothly */}
        <div
          ref={heroTrackRef}
          data-testid="hero-zoom-track"
          data-scroll-progress="0.000"
          data-nav-expand={reducedMotion ? '1.000' : '0.000'}
          data-nav-pill-opacity={reducedMotion ? '0.000' : '1.000'}
          className={`relative w-full ${
            reducedMotion ? 'min-h-[100svh] sm:min-h-[100dvh]' : 'h-[190svh] sm:h-[195dvh]'
          }`}
        >
          {/* Full-bleed Boomerang Video Hero — sticky inside the zoom track */}
          <section
            aria-label="LinkFlow hero"
            className={`${
              reducedMotion ? 'relative' : 'sticky top-0'
            } w-full min-h-[100svh] sm:min-h-[100dvh] flex flex-col justify-between overflow-hidden`}
          >
            {/* Zoomable background media layer (starts zoomed in at 1.28x and eases out to 1.0x on scroll) */}
            <div
              ref={heroMediaWrapRef}
              data-testid="hero-media-zoom"
              data-zoom-scale={reducedMotion ? '1.000' : INITIAL_HERO_SCALE.toFixed(3)}
              className="absolute inset-0 w-full h-full will-change-transform origin-center"
              style={{
                transform: reducedMotion
                  ? 'translate3d(0, 0, 0) scale(1)'
                  : `translate3d(0, 0, 0) scale(${INITIAL_HERO_SCALE})`,
              }}
            >
              <BoomerangVideoBg
                src={BG_VIDEO}
                poster={POSTER_IMAGE}
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Subtle pale cream atmospheric veil across the upper sky to guarantee WCAG AA headline & subtitle contrast on all 193 frames */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#f4f5ef]/82 via-[#f4f5ef]/48 to-transparent"
            />

            {/* Grounded botanical forest scrim across the bottom third so bottom-left and bottom-right white copy clears >8:1 on every frame */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] min-h-60 bg-gradient-to-t from-[#121c11]/90 via-[#162214]/58 to-transparent"
            />

            {/* Top Navigation Bar — starts compact in a centered frosted pill, expands & dissolves synced with hero zoom-out */}
            <header className="relative z-30 w-full px-4 sm:px-6 md:px-10 py-5 sm:py-6">
              <div
                ref={headerInnerRef}
                data-testid="hero-header-inner"
                className="relative w-full flex items-center justify-between gap-4"
              >
                {/* Scroll-synced frosted pill backdrop enclosing all header controls at scroll=0, expanding and fading out on scroll */}
                <div
                  ref={headerPillRef}
                  aria-hidden="true"
                  data-testid="hero-nav-pill"
                  data-pill-opacity={reducedMotion ? '0.000' : '1.000'}
                  data-pill-scale-x="1.000"
                  className="pointer-events-none absolute -top-1.5 -bottom-1.5 z-0 rounded-full bg-white/88 backdrop-blur-md border border-[#1f2a1d]/10 shadow-[0_8px_28px_rgba(31,42,29,0.08)] origin-center will-change-[transform,opacity]"
                  style={{ opacity: reducedMotion ? 0 : 1 }}
                />

                <a
                  ref={headerLogoRef}
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0 });
                    setActiveSection('mission');
                  }}
                  className="relative z-10 text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-[#1f2a1d] whitespace-nowrap shrink-0 rounded-md will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                >
                  LinkFlow<span className="text-[10px] sm:text-xs align-super font-medium">™</span>
                </a>

                {/* Desktop Primary Navigation Links + Try it Live */}
                <nav
                  ref={headerNavRef}
                  aria-label="Primary navigation"
                  className="relative z-10 hidden lg:flex items-center gap-1 py-0.5 will-change-transform"
                >
                  {NAV_LINKS.map((link) => {
                    const isCurrent = activeSection === link.id;
                    return (
                      <a
                        key={link.id}
                        href={link.href}
                        aria-current={isCurrent ? 'location' : undefined}
                        onClick={() => setActiveSection(link.id)}
                        className={`text-sm px-3 py-2 rounded-full transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] ${
                          isCurrent
                            ? 'font-semibold text-[#1f2a1d]'
                            : 'font-medium text-[#3b4b38] hover:text-[#1f2a1d]'
                        }`}
                      >
                        {link.label}
                      </a>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'try-live' })}
                    className="ml-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                  >
                    Try it Live
                  </button>
                </nav>

                {/* Right Action Cluster + Mobile Hamburger */}
                <div
                  ref={headerActionsRef}
                  className="relative z-10 flex items-center gap-3 sm:gap-5 text-[#1f2a1d] shrink-0 will-change-transform"
                >
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'auth', mode: 'signup' })}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#1f2a1d] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Me Up!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'auth', mode: 'signin' })}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#1f2a1d] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>Enter</span>
                  </button>

                  <button
                    ref={menuTriggerRef}
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-nav-drawer"
                    className="lg:hidden relative flex items-center justify-center w-11 h-11 rounded-full text-[#1f2a1d] hover:bg-[#1f2a1d]/[0.06] transition-colors duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
                  >
                    {/* Subtle standalone circular button surface fades in only as the outer navbar pill dissolves */}
                    <span
                      ref={mobileMenuSurfaceRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full bg-white/80 backdrop-blur-md border border-white/75 shadow-sm will-change-[opacity]"
                      style={{ opacity: reducedMotion ? 1 : 0 }}
                    />
                    <Menu
                      aria-hidden="true"
                      className={`absolute z-10 w-5 h-5 transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                      }`}
                    />
                    <X
                      aria-hidden="true"
                      className={`absolute z-10 w-5 h-5 transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </header>

            {/* Upper-Center Hero Copy — positioned in the expansive pale cream sky above the karst peaks, staying in normal flow so it never overlaps the bottom row */}
            <div
              ref={heroCopyRef}
              data-testid="hero-copy"
              className="relative z-10 flex flex-col items-center text-center pt-10 sm:pt-14 md:pt-16 pb-10 px-4 sm:px-6 mb-auto will-change-transform"
            >
              <h1
                className="font-normal leading-[0.95] text-[#1e452b] text-[2.25rem] sm:text-5xl md:text-6xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-5xl text-balance"
                style={{ letterSpacing: '-0.035em' }}
              >
                Close the rift{' '}
                <span className="text-[#4b7958]">
                  linking
                  <br className="hidden sm:block" /> signals and action
                </span>
              </h1>

              <p className="mt-6 sm:mt-8 text-[#243322] text-sm sm:text-base md:text-lg leading-relaxed max-w-md px-2 font-medium">
                Shape scattered signals into meaningful outcomes via AI-driven workflows.
              </p>
            </div>

            {/* Bottom Hero Row (Bottom-left FluxEngine block + Bottom-right Walkthrough video link) */}
            <div
              data-testid="hero-bottom-row"
              className="relative z-10 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 md:pb-10 pt-4"
            >
              {/* Bottom-left Product Block */}
              <div className="max-w-sm">
                <div className="flex items-center gap-2 text-white mb-3">
                  <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold sm:font-medium">
                    FluxEngine<span className="text-[10px] align-super font-medium">™</span>
                  </span>
                </div>

                <p className="text-white/95 text-xs sm:text-[13px] leading-relaxed mb-6 max-w-xs font-normal">
                  LinkFlow smoothly unites your company systems, streamlining data paths between
                  services without having to write custom scripts.
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setModal({ type: 'try-live' })}
                    className="bg-white hover:bg-white/90 text-[#1f2a1d] text-sm font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#162214]"
                  >
                    Try it Live
                  </button>
                  <a
                    href="#mission"
                    onClick={() => setActiveSection('mission')}
                    className="text-white text-sm font-semibold sm:font-medium hover:opacity-85 transition-opacity whitespace-nowrap rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#162214]"
                  >
                    Know More.
                  </a>
                </div>
              </div>

              {/* Bottom-right Video Link */}
              <button
                type="button"
                onClick={() => setModal({ type: 'walkthrough' })}
                className="hidden sm:flex items-center gap-2.5 text-white text-sm hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 rounded-full py-1.5 px-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#162214]"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/25 backdrop-blur-sm border border-white/25 transition-colors hover:bg-white/35">
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" aria-hidden="true" />
                </span>
                <span className="font-medium">How we build?</span>
                <span className="text-white/85 tabular-nums">1:35</span>
              </button>
            </div>
          </section>
        </div>

        {/* Below-the-Fold Destination Sections (#mission, #how, #pricing) */}
        <BelowFoldSections
          onOpenTryLive={() => setModal({ type: 'try-live' })}
          onOpenWalkthrough={() => setModal({ type: 'walkthrough' })}
          onSelectTariff={(planName) =>
            setModal({ type: 'auth', mode: 'signup', selectedPlan: planName })
          }
        />
      </main>

      {/* Quiet Footer outside <main> */}
      <footer className="border-t border-[#1f2a1d]/10 bg-[#f4f5f0]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-[#3d4d3a]">
          <div className="font-semibold tracking-tight text-[#2d3a2a]">
            LinkFlow<span className="text-[11px] align-super font-medium">™</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#mission"
              onClick={() => setActiveSection('mission')}
              className="hover:text-[#1f2a1d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] rounded"
            >
              Purpose
            </a>
            <a
              href="#how"
              onClick={() => setActiveSection('how')}
              className="hover:text-[#1f2a1d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] rounded"
            >
              The Process
            </a>
            <a
              href="#pricing"
              onClick={() => setActiveSection('pricing')}
              className="hover:text-[#1f2a1d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] rounded"
            >
              Tariffs
            </a>
          </div>
          <p className="text-xs text-[#3d4d3a]">© {new Date().getFullYear()} LinkFlow Systems</p>
        </div>
      </footer>

      {/* Mobile Slide-in Navigation Dialog */}
      <MobileDrawer
        open={menuOpen}
        onClose={handleCloseDrawer}
        navLinks={NAV_LINKS}
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onOpenAuth={(mode) => setModal({ type: 'auth', mode })}
        onOpenTryLive={() => setModal({ type: 'try-live' })}
        triggerRef={menuTriggerRef}
      />

      {/* Interactive Modals (Try it Live, Sign Me Up / Enter, How we build?) */}
      <InteractiveDialogs
        modal={modal}
        onClose={handleCloseModal}
        onSwitchAuthMode={(mode) =>
          setModal((prev) =>
            prev?.type === 'auth' ? { ...prev, mode } : { type: 'auth', mode },
          )
        }
        videoSrc={BG_VIDEO}
        posterSrc={POSTER_IMAGE}
      />
    </div>
  );
}
