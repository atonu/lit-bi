"use client";

import { useState, useTransition } from "react";
import { X, Sparkles } from "lucide-react";
import { StepIndicator } from "./step-indicator";
import { StepCredentials } from "./step-credentials";
import { StepTest } from "./step-test";
import { StepSchema } from "./step-schema";
import {
  testConnection,
  introspectSchema,
  saveConnection,
  type ConnectionCredentials,
  type TestConnectionResult,
  type IntrospectResult,
} from "@/app/actions/connection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConnectionStepperProps {
  onClose: () => void;
  onSuccess: (connectionId: string) => void;
}

type Step = 0 | 1 | 2; // Credentials | Test | Schema

const STEP_LABELS = ["Credentials", "Test Connection", "Schema Preview"];

const DEFAULT_CREDS: ConnectionCredentials = {
  alias: "",
  engine: "POSTGRESQL",
  host: "localhost",
  port: 5432,
  dbName: "",
  dbUser: "postgres",
  password: "",
  sslEnabled: false,
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateCreds(
  creds: ConnectionCredentials
): Partial<Record<keyof ConnectionCredentials, string>> {
  const errors: Partial<Record<keyof ConnectionCredentials, string>> = {};
  if (!creds.alias.trim()) errors.alias = "Connection name is required";
  if (!creds.host.trim()) errors.host = "Host is required";
  if (!creds.port || creds.port < 1 || creds.port > 65535)
    errors.port = "Valid port required (1–65535)";
  if (!creds.dbName.trim()) errors.dbName = "Database name is required";
  if (!creds.dbUser.trim()) errors.dbUser = "Username is required";
  if (!creds.password) errors.password = "Password is required";
  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectionStepper({
  onClose,
  onSuccess,
}: ConnectionStepperProps) {
  const [step, setStep] = useState<Step>(0);
  const [creds, setCreds] = useState<ConnectionCredentials>(DEFAULT_CREDS);
  const [credErrors, setCredErrors] = useState<
    Partial<Record<keyof ConnectionCredentials, string>>
  >({});
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(
    null
  );
  const [introspectResult, setIntrospectResult] =
    useState<IntrospectResult | null>(null);

  const [isTesting, startTest] = useTransition();
  const [isIntrospecting, startIntrospect] = useTransition();
  const [isSaving, startSave] = useTransition();

  // ── Step 0 → 1: Validate then test connection ──────────────────────────
  function handleTestConnection() {
    const errors = validateCreds(creds);
    if (Object.keys(errors).length > 0) {
      setCredErrors(errors);
      return;
    }
    setCredErrors({});
    setTestResult(null);
    setStep(1);

    startTest(async () => {
      const result = await testConnection(creds);
      setTestResult(result);
    });
  }

  // ── Step 1 → 2: Introspect schema ─────────────────────────────────────
  function handleIntrospect() {
    setIntrospectResult(null);
    setStep(2);

    startIntrospect(async () => {
      const result = await introspectSchema(creds);
      setIntrospectResult(result);
    });
  }

  // ── Step 2: Save ──────────────────────────────────────────────────────
  function handleSave() {
    if (!introspectResult?.success) return;

    startSave(async () => {
      const result = await saveConnection(creds, introspectResult.columns);
      if (result.success && result.connectionId) {
        onSuccess(result.connectionId);
      }
    });
  }

  return (
    // Modal backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal panel */}
      <div className="animate-slide-up relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-5">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Connect Data Source
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Step {step + 1} of {STEP_LABELS.length}
              </p>
            </div>
          </div>
          <button
            id="stepper-close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center border-b border-border/50 px-6 py-4">
          <StepIndicator steps={STEP_LABELS} currentStep={step} />
        </div>

        {/* Step content */}
        <div className="overflow-y-auto p-6">
          {step === 0 && (
            <StepCredentials
              creds={creds}
              onChange={(patch) =>
                setCreds((prev) => ({ ...prev, ...patch }))
              }
              onNext={handleTestConnection}
              isPending={isTesting}
              errors={credErrors}
            />
          )}

          {step === 1 && (
            <StepTest
              result={testResult}
              isIntrospecting={isIntrospecting}
              onNext={handleIntrospect}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && (
            <StepSchema
              result={introspectResult}
              isSaving={isSaving}
              onSave={handleSave}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
