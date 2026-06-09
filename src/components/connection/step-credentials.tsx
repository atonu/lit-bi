"use client";

import { FormField } from "./form-field";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight, Loader2 } from "lucide-react";
import type { ConnectionCredentials } from "@/app/actions/connection";

interface StepCredentialsProps {
  creds: ConnectionCredentials;
  onChange: (patch: Partial<ConnectionCredentials>) => void;
  onNext: () => void;
  isPending: boolean;
  errors: Partial<Record<keyof ConnectionCredentials, string>>;
}

const ENGINE_LABELS: Record<ConnectionCredentials["engine"], string> = {
  POSTGRESQL: "PostgreSQL",
  MYSQL: "MySQL",
  MONGODB: "MongoDB",
};

export function StepCredentials({
  creds,
  onChange,
  onNext,
  isPending,
  errors,
}: StepCredentialsProps) {
  const isMongo = creds.engine === "MONGODB";

  return (
    <div className="flex flex-col h-full overflow-y-auto md:overflow-hidden">
      <div className="p-6 flex flex-col gap-6 md:flex-1 md:overflow-y-auto scrollbar-thin">
        {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          Database Credentials
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter your connection details. Your credentials are encrypted with
          AES-256-GCM before storage.
        </p>
      </div>

      {/* Engine selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Engine <span className="text-chart-4">*</span>
        </label>
        <div className="flex gap-3">
          {(["MONGODB", "POSTGRESQL", "MYSQL"] as const).map((eng) => (
            <button
              key={eng}
              type="button"
              onClick={() =>
                onChange({
                  engine: eng,
                  // Reset URI / host when switching engines
                  connectionUri: eng === "MONGODB" ? creds.connectionUri ?? "" : "",
                  host: eng !== "MONGODB" ? creds.host ?? "" : undefined,
                })
              }
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] sm:text-xs font-medium transition-all ${
                creds.engine === eng
                  ? "border-chart-1/50 bg-chart-1/10 text-chart-1"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Database className="size-3.5" />
              {ENGINE_LABELS[eng]}
            </button>
          ))}
        </div>
      </div>

      {/* Connection alias — always shown */}
      <FormField
        id="alias"
        label="Connection Name"
        placeholder="e.g. Production DB"
        value={creds.alias}
        onChange={(v) => onChange({ alias: v })}
        error={errors.alias}
        required
      />

      {/* ── MongoDB: single URI field ── */}
      {isMongo && (
        <FormField
          id="connectionUri"
          label="Connection URI"
          placeholder="mongodb://user:pass@localhost:27017/mydb  or  mongodb+srv://..."
          value={creds.connectionUri ?? ""}
          onChange={(v) => onChange({ connectionUri: v })}
          error={errors.connectionUri}
          required
        />
      )}

      {/* ── SQL engines: host / port / db / user / password ── */}
      {!isMongo && (
        <>
          {/* Host + Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormField
                id="host"
                label="Host"
                placeholder="localhost or db.example.com"
                value={creds.host ?? ""}
                onChange={(v) => onChange({ host: v })}
                error={errors.host}
                required
              />
            </div>
            <FormField
              id="port"
              label="Port"
              type="number"
              placeholder={creds.engine === "POSTGRESQL" ? "5432" : "3306"}
              value={String(creds.port ?? "")}
              onChange={(v) => onChange({ port: parseInt(v, 10) || 5432 })}
              error={errors.port}
              required
            />
          </div>

          {/* Database name */}
          <FormField
            id="dbName"
            label="Database"
            placeholder="my_database"
            value={creds.dbName ?? ""}
            onChange={(v) => onChange({ dbName: v })}
            error={errors.dbName}
            required
          />

          {/* User + Password */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="dbUser"
              label="Username"
              placeholder="postgres"
              value={creds.dbUser ?? ""}
              onChange={(v) => onChange({ dbUser: v })}
              error={errors.dbUser}
              required
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={creds.password ?? ""}
              onChange={(v) => onChange({ password: v })}
              error={errors.password}
              required
            />
          </div>

          {/* SSL toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <button
              type="button"
              role="switch"
              aria-checked={creds.sslEnabled}
              onClick={() => onChange({ sslEnabled: !creds.sslEnabled })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                creds.sslEnabled ? "bg-chart-1" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  creds.sslEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <div>
              <p className="text-xs font-medium text-foreground">
                SSL / TLS Enabled
              </p>
              <p className="text-[11px] text-muted-foreground">
                Requires sslmode=require on the server
              </p>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Next button */}
      <div className="border-t border-border/50 p-6 bg-background shrink-0 md:sticky md:bottom-0">
        <Button
          id="step-credentials-next"
          onClick={onNext}
          disabled={isPending}
          className="w-full gap-2 bg-gradient-to-r from-chart-1 to-chart-5 text-white shadow-lg hover:brightness-110"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Testing Connection…
            </>
          ) : (
            <>
              Test Connection
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
