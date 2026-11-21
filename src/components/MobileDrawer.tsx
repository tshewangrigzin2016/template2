import { useEffect, useRef } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';

export interface NavLinkItem {
  id: string;
  href: string;
  label: string;
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navLinks: NavLinkItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  onOpenAuth: (mode: 'signup' | 'signin') => void;
  onOpenTryLive: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MobileDrawer({
  open,
  onClose,
  navLinks,
  activeSection,
  onNavigate,
  onOpenAuth,
  onOpenTryLive,
  triggerRef,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Lock body scroll while open and clean up on unmount
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Move focus into dialog on open, restore to trigger on close, trap Tab, and handle Escape
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const timer = window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== 'Tab' || !drawerRef.current) return;

        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        window.clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open, onClose, triggerRef]);

  return (
    <>
      {/* Backdrop scrim above the header (z-40): animates blur(0px -> 8px) and dim directly on the exact same 380ms curve as the drawer */}
      <div
        aria-hidden="true"
        data-testid="mobile-drawer-backdrop"
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 transition-[background-color,backdrop-filter,visibility] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open
            ? 'bg-[#1f2a1d]/45 backdrop-blur-[8px] visible pointer-events-auto'
            : 'bg-[#1f2a1d]/0 backdrop-blur-[0px] invisible pointer-events-none'
        }`}
      />

      {/* Modal slide-in drawer (z-50), inert when closed so off-screen controls cannot receive focus */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        inert={!open}
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl will-change-transform transition-[transform,visibility] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? 'translate-x-0 visible' : 'translate-x-full invisible'
        }`}
      >
        <div className="flex flex-col h-full pt-5 px-8 pb-8 overflow-y-auto">
          <div className="flex items-center justify-between pb-6 border-b border-[#1f2a1d]/10">
            <span className="text-lg font-semibold tracking-tight text-[#2d3a2a]">
              LinkFlow<span className="text-[11px] align-super font-medium">™</span>
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1f2a1d]/5 text-[#1f2a1d] hover:bg-[#1f2a1d]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile navigation" className="flex flex-col mt-4">
            {navLinks.map((link, i) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={() => {
                    onNavigate(link.id);
                    onClose();
                  }}
                  style={{
                    transitionDelay: open ? `${30 + i * 25}ms` : '0ms',
                  }}
                  className={`text-2xl font-semibold py-4 border-b border-[#1f2a1d]/10 transition-[transform,opacity,color] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:rounded-md ${
                    isActive ? 'text-[#1f2a1d]' : 'text-[#3d4d3a] hover:text-[#1f2a1d]'
                  } ${open ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div
            style={{ transitionDelay: open ? '110ms' : '0ms' }}
            className={`mt-8 flex flex-col gap-4 transition-[transform,opacity] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('signup');
              }}
              className="sm:hidden flex items-center gap-2.5 text-base font-medium text-[#1f2a1d] py-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:rounded-md"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Sign Me Up!</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('signin');
              }}
              className="sm:hidden flex items-center gap-2.5 text-base font-medium text-[#1f2a1d] py-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:rounded-md"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Enter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTryLive();
              }}
              className="mt-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
            >
              Try it Live
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
