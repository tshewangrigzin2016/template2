import { ArrowUpRight, Play, Sparkles } from 'lucide-react';

interface BelowFoldSectionsProps {
  onOpenTryLive: () => void;
  onOpenWalkthrough: () => void;
  onSelectTariff: (planName: string) => void;
}

const PURPOSE_PRINCIPLES = [
  {
    number: '01.',
    title: 'Zero Custom Glue Code',
    description:
      'Replace fragile webhook scripts and midnight cron jobs with typed, declarative routes that adapt automatically when upstream APIs evolve.',
  },
  {
    number: '02.',
    title: 'Semantic Signal Routing',
    description:
      'FluxEngine™ inspects incoming payloads across CRM, ERP, telemetry, and billing systems to route only high-confidence operational actions.',
  },
  {
    number: '03.',
    title: 'Deterministic Replay & Audit',
    description:
      'Every transformation is versioned and replayable in milliseconds, giving engineering and operations full traceability across every connected system.',
  },
];

const PROCESS_STEPS = [
  {
    step: '01.',
    name: 'Connect existing systems',
    detail:
      'Attach webhooks, queues, and enterprise SaaS connectors in minutes using scoped OAuth or signed keys—without modifying production services.',
    metric: '180+ native connectors',
  },
  {
    step: '02.',
    name: 'Shape signals with FluxEngine™',
    detail:
      'Define natural-language transformation rules backed by strict JSON schemas so noisy events become clean, validated actions.',
    metric: 'Sub-250ms median route time',
  },
  {
    step: '03.',
    name: 'Verify before production',
    detail:
      'Replay real historical payloads in an isolated dry-run sandbox and ship changes with instant rollback guarantees.',
    metric: '99.98% delivery SLA',
  },
];

const TARIFF_TIERS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'per month',
    summary: 'For small operations teams unifying their first core workflows.',
    features: [
      'Up to 25,000 routed signals / month',
      '5 active FluxEngine™ pipelines',
      '14-day replay & trace retention',
    ],
    cta: 'Start on Starter',
    featured: false,
  },
  {
    name: 'Growth',
    price: '$290',
    cadence: 'per month',
    summary: 'For scaling teams coordinating ERP, billing, and incident pipelines.',
    features: [
      'Up to 500,000 routed signals / month',
      'Unlimited FluxEngine™ pipelines',
      '90-day replay, branching & SSO',
    ],
    cta: 'Choose Growth',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual contract',
    summary: 'Dedicated VPC deployment, custom SLAs, and regional data residency.',
    features: [
      'Unlimited signal volume & burst capacity',
      'Private cloud / EU & US residency',
      'Dedicated integration architect',
    ],
    cta: 'Request Enterprise Tariff',
    featured: false,
  },
];

export default function BelowFoldSections({
  onOpenTryLive,
  onOpenWalkthrough,
  onSelectTariff,
}: BelowFoldSectionsProps) {
  return (
    <div className="bg-[#f4f5f0] text-[#1f2a1d]">
      {/* Purpose (#mission) */}
      <section
        id="mission"
        aria-labelledby="mission-heading"
        className="max-w-6xl mx-auto px-6 md:px-10 py-20 sm:py-28 border-t border-[#1f2a1d]/10 scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[#336443]">Purpose</p>
            <h2
              id="mission-heading"
              className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1f2a1d] leading-tight text-balance"
            >
              Operational clarity across every system you already run.
            </h2>
            <p className="mt-5 text-base text-[#3d4d3a] leading-relaxed">
              Modern organizations scatter critical context across dozens of specialized tools.
              LinkFlow bridges those boundaries into one calm, verifiable flow so teams act on what
              matters rather than maintaining brittle scripts.
            </p>
          </div>

          <div className="lg:col-span-7 divide-y divide-[#1f2a1d]/12 border-t border-b border-[#1f2a1d]/12">
            {PURPOSE_PRINCIPLES.map((item) => (
              <div key={item.number} className="py-7 grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <span className="text-sm font-mono tabular-nums text-[#336443] mr-2">
                    {item.number}
                  </span>
                  <h3 className="inline text-base font-semibold text-[#1f2a1d]">{item.title}</h3>
                </div>
                <p className="sm:col-span-8 text-sm text-[#3d4d3a] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process (#how) */}
      <section
        id="how"
        aria-labelledby="process-heading"
        className="bg-[#eaece4] border-t border-[#1f2a1d]/10 scroll-mt-24"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 sm:py-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[#336443]">The Process</p>
              <h2
                id="process-heading"
                className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1f2a1d] leading-tight text-balance"
              >
                From raw webhook signal to verified action in three deliberate steps.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenTryLive}
                className="inline-flex items-center gap-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Try FluxEngine™ Live</span>
              </button>
              <button
                type="button"
                onClick={onOpenWalkthrough}
                className="inline-flex items-center gap-2 bg-white hover:bg-[#f7f8f4] text-[#1f2a1d] border border-[#1f2a1d]/15 text-sm font-medium px-5 py-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-2"
              >
                <Play className="w-3.5 h-3.5 fill-[#1f2a1d]" aria-hidden="true" />
                <span>How we build? (1:35)</span>
              </button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROCESS_STEPS.map((item) => (
              <div
                key={item.step}
                className="flex flex-col justify-between pt-6 border-t border-[#1f2a1d]/20"
              >
                <div>
                  <span className="text-sm font-mono tabular-nums text-[#336443]">{item.step}</span>
                  <h3 className="mt-3 text-xl font-semibold text-[#1f2a1d]">{item.name}</h3>
                  <p className="mt-3 text-sm text-[#3d4d3a] leading-relaxed">{item.detail}</p>
                </div>
                <p className="mt-6 text-xs font-medium text-[#2d3a2a] tabular-nums">
                  {item.metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tariffs (#pricing) */}
      <section
        id="pricing"
        aria-labelledby="tariffs-heading"
        className="max-w-6xl mx-auto px-6 md:px-10 py-20 sm:py-28 scroll-mt-24"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#336443]">Tariffs</p>
          <h2
            id="tariffs-heading"
            className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1f2a1d] leading-tight text-balance"
          >
            Predictable signal pricing with zero per-connector surcharges.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TARIFF_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col justify-between rounded-2xl p-7 border ${
                tier.featured
                  ? 'bg-[#1f2a1d] text-white border-[#1f2a1d]'
                  : 'bg-white text-[#1f2a1d] border-[#1f2a1d]/12'
              }`}
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  {tier.featured && (
                    <span className="text-xs font-medium text-[#c8decb]">Most chosen</span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">
                    {tier.price}
                  </span>
                  <span
                    className={`text-xs ${tier.featured ? 'text-white/75' : 'text-[#3d4d3a]'}`}
                  >
                    {tier.cadence}
                  </span>
                </div>
                <p
                  className={`mt-4 text-sm leading-relaxed ${
                    tier.featured ? 'text-white/85' : 'text-[#3d4d3a]'
                  }`}
                >
                  {tier.summary}
                </p>

                <ul
                  className={`mt-6 space-y-2.5 text-sm border-t pt-6 ${
                    tier.featured
                      ? 'border-white/15 text-white/90'
                      : 'border-[#1f2a1d]/10 text-[#2d3a2a]'
                  }`}
                >
                  {tier.features.map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectTariff(tier.name)}
                className={`mt-8 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  tier.featured
                    ? 'bg-white text-[#1f2a1d] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-[#1f2a1d]'
                    : 'bg-[#1f2a1d] text-white hover:bg-[#2a3827] focus-visible:ring-[#1f2a1d] focus-visible:ring-offset-white'
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
