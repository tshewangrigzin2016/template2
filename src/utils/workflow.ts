export interface WorkflowStep {
  id: string;
  system: string;
  action: string;
  latencyMs: number;
  outputSummary: string;
}

export interface WorkflowScenario {
  id: string;
  title: string;
  signalLabel: string;
  incomingPayload: string;
  steps: WorkflowStep[];
}

export const WORKFLOW_SCENARIOS: WorkflowScenario[] = [
  {
    id: 'crm-billing',
    title: 'CRM Deal Closed → NetSuite & Slack',
    signalLabel: 'HubSpot webhook · deal.stage_updated',
    incomingPayload: '{ "account": "Alder Ridge Labs", "arr": 48000, "seats": 65, "tier": "Growth" }',
    steps: [
      {
        id: 'ingest',
        system: 'FluxEngine Ingest',
        action: 'Validate schema & deduplicate event ID',
        latencyMs: 18,
        outputSummary: 'Verified unique signature evt_94a21c',
      },
      {
        id: 'enrich',
        system: 'AI Field Mapper',
        action: 'Align CRM currency & tax entity codes',
        latencyMs: 64,
        outputSummary: 'Mapped US-WEST tax schedule + annual billing cadence',
      },
      {
        id: 'erp',
        system: 'NetSuite ERP',
        action: 'Create invoice & provision seat entitlements',
        latencyMs: 112,
        outputSummary: 'Invoice #NS-40819 drafted · 65 seats active',
      },
      {
        id: 'notify',
        system: 'Slack #rev-ops',
        action: 'Post structured onboarding handoff card',
        latencyMs: 29,
        outputSummary: 'Dispatched summary to account owner',
      },
    ],
  },
  {
    id: 'incident-triage',
    title: 'Telemetry Spike → PagerDuty & Linear',
    signalLabel: 'Datadog monitor · p99_latency_breach',
    incomingPayload: '{ "service": "checkout-edge", "p99_ms": 1420, "region": "eu-central-1" }',
    steps: [
      {
        id: 'correlate',
        system: 'FluxEngine Correlator',
        action: 'Group 14 duplicate alerts within 30s window',
        latencyMs: 22,
        outputSummary: 'Collapsed noise into 1 root-cause signal',
      },
      {
        id: 'classify',
        system: 'AI Severity Router',
        action: 'Match recent deploy commit & owning squad',
        latencyMs: 58,
        outputSummary: 'Attributed to release v2.18.4 · Payments Core',
      },
      {
        id: 'ticket',
        system: 'Linear',
        action: 'Open high-priority issue with trace snapshot',
        latencyMs: 84,
        outputSummary: 'Created PAY-712 assigned to on-call engineer',
      },
      {
        id: 'page',
        system: 'PagerDuty',
        action: 'Trigger responder escalation policy',
        latencyMs: 31,
        outputSummary: 'Acknowledged by eu-primary responder',
      },
    ],
  },
  {
    id: 'supply-sync',
    title: 'Inventory Dip → Supplier PO & ERP',
    signalLabel: 'WMS stream · sku.below_safety_stock',
    incomingPayload: '{ "sku": "LF-SENSOR-09", "on_hand": 140, "threshold": 250, "hub": "Rotterdam" }',
    steps: [
      {
        id: 'verify',
        system: 'FluxEngine Guard',
        action: 'Check open in-transit shipments before reorder',
        latencyMs: 27,
        outputSummary: 'Confirmed 0 pending replenishment orders',
      },
      {
        id: 'forecast',
        system: 'AI Demand Modeler',
        action: 'Compute 21-day lead-time reorder quantity',
        latencyMs: 71,
        outputSummary: 'Recommended replenishment batch: 600 units',
      },
      {
        id: 'po',
        system: 'SAP S/4HANA',
        action: 'Generate draft purchase order for approval',
        latencyMs: 126,
        outputSummary: 'PO #45009182 queued for regional buyer',
      },
      {
        id: 'portal',
        system: 'Supplier Portal',
        action: 'Reserve production slot & request ETA',
        latencyMs: 42,
        outputSummary: 'Slot held · target delivery in 6 business days',
      },
    ],
  },
];

export function computeTotalLatency(steps: WorkflowStep[]): number {
  return steps.reduce((sum, step) => sum + step.latencyMs, 0);
}

export type AuthMode = 'signup' | 'signin';

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

export interface AuthValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof AuthFormValues, string>>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(mode: AuthMode, values: AuthFormValues): AuthValidationResult {
  const errors: Partial<Record<keyof AuthFormValues, string>> = {};

  if (mode === 'signup' && values.name.trim().length < 2) {
    errors.name = 'Enter your full name or team name.';
  }

  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Enter a valid work email address.';
  }

  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
