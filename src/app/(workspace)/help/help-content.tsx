"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  Globe,
} from "lucide-react";

const SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "connections", label: "1. Connecting a Database" },
  { id: "ai-chat", label: "2. Talking to Your Data" },
  { id: "dashboards", label: "3. Interactive Dashboards" },
  { id: "chat-history", label: "4. Managing History" },
  { id: "security", label: "5. Security & Privacy" },
  { id: "external-api", label: "6. External API" },
  { id: "contact", label: "Contact & Support" },
];

export function HelpContent() {
  const [activeId, setActiveId] = useState("introduction");
  // This ref is the definitive scroll container — no document.querySelector needed
  const scrollRef = useRef<HTMLDivElement>(null);

  // Wire IntersectionObserver to the scroll container ref
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio that is visible
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: container,
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleIndexClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const container = scrollRef.current;
    if (!container) return;

    // Introduction always scrolls to top
    if (id === "introduction") {
      container.scrollTo({ top: 0, behavior: "smooth" });
      setActiveId("introduction");
      return;
    }

    const el = document.getElementById(id);
    if (!el) return;

    // Compute target scroll position relative to the container
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - containerRect.top + container.scrollTop - 32;

    container.scrollTo({ top: offset, behavior: "smooth" });
    setActiveId(id);
  };

  return (
    // scrollRef is the ONE true scroll container for this page
    <div
      ref={scrollRef}
      className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-[#131314] text-foreground"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* ── MAIN LAYOUT: content + sticky index ────────────────────────── */}
      <div className="mx-auto flex w-full max-w-7xl px-4 pt-20 pb-24 md:pt-14 md:pb-20 lg:px-8 gap-0 lg:gap-12">

        {/* ── LEFT / MAIN CONTENT ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 max-w-3xl space-y-0">

          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl mb-12 sm:min-h-[340px] flex flex-col justify-end p-8 md:p-12">
            {/* bg-4 behind hero */}
            <Image
              src="/about-bg-4.png"
              alt="Hero Background"
              fill
              className="object-cover object-center"
              priority
            />
            {/* dark overlay so text stays readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-[#131314]/70 to-[#131314]/0" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-400 uppercase backdrop-blur-sm">
                <BookOpen className="size-3.5" />
                Documentation
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
                Welcome to <br className="md:hidden" />
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap">
                  BI-Lite
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl">
                Connect your databases, explore your data with AI in plain English, and generate beautiful visualizations instantly.
              </p>
            </div>
          </div>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: Introduction ─────────────────────────────────── */}
          <section id="introduction" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            {/* bg-1 behind introduction section too */}
            <Image
              src="/about-bg-1.png"
              alt="Introduction Background"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-[#131314]/50 to-[#131314]/0" />
            <div className="relative z-10 space-y-5">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 text-sm font-bold border border-blue-500/20">
                  0
                </span>
                Introduction
              </h2>
              <div className="space-y-4 text-white/75 leading-relaxed text-sm md:text-base">
                <p>
                  <strong className="text-white">BI-Lite</strong> is a next-generation, AI-driven Business Intelligence application engineered to bridge the gap between complex database systems and everyday business questions. By leveraging advanced AI natural language processing, BI-Lite allows business analysts, managers, and developers to query their relational or document-based databases in plain English — no SQL skills required.
                </p>
                <p>
                  The core philosophy of BI-Lite is to democratize data insights. When you submit a question, our AI agent evaluates your database schema, synthesizes a high-performance query, executes it securely, and selects the most appropriate chart type to present results. This cycle turns raw datasets into visual, decision-ready analytics within seconds.
                </p>
              </div>
            </div>
          </section>

          {/* ── GUIDE HEADER ─────────────────────────────────────────────── */}
          <div className="space-y-2 mb-8 px-1">
            <h2 className="text-2xl font-bold text-white">How-To & User Guide</h2>
            <p className="text-sm text-white/40">
              Step-by-step instructions to get started and master the platform.
            </p>
          </div>

          {/* ── SECTION: Database Connections ────────────────────────────── */}
          <section id="connections" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-2.png"
              alt="Connections Background"
              fill
              className="object-cover object-center "
            />
            <div className="absolute inset-0 bg-[#131314]/50" />
            <div className="relative z-10 space-y-5">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  1
                </span>
                Connecting a Database
              </h3>
              <p className="text-white/70 text-sm md:text-base">
                To get started, BI-Lite requires access to a database. We support PostgreSQL, MySQL, SQLite, and MongoDB.
              </p>
              <div className="grid gap-3">
                {[
                  {
                    title: "Navigate to Connections",
                    desc: "Click the 'Connections' tab in the bottom-left sidebar. You'll see all registered databases listed with their status.",
                  },
                  {
                    title: "Click 'Add Connection'",
                    desc: "Press the '+ Add Connection' button to launch our step-by-step connection wizard.",
                  },
                  {
                    title: "Configure Credentials",
                    desc: "Select your database engine, then supply host, port, database name, username, and password. Credentials are stored securely.",
                  },
                  {
                    title: "Test and Save",
                    desc: "BI-Lite runs connection verification automatically. When successful, the status changes to 'CONNECTED' — ready for AI questioning.",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/70">{step.title}</h4>
                      <p className="mt-1 text-xs md:text-sm text-white/55">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: AI Chat ─────────────────────────────────────────── */}
          <section id="ai-chat" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-3.png"
              alt="AI Chat Background"
              fill
              className="object-cover object-center "
            />
            <div className="absolute inset-0 bg-[#131314]/70" />
            <div className="relative z-10 space-y-5">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                  2
                </span>
                Talking to Your Data
              </h3>
              <p className="text-white/70 text-sm md:text-base">
                Once a database is connected, interact with it via the Chat panel. The chat interface behaves like a smart assistant tailored to your specific schema.
              </p>
              <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Asking Tips</span>
                </div>
                <ul className="space-y-3 text-xs md:text-sm text-white/65">
                  {[
                    {
                      label: "Select your database",
                      desc: "Use the database selector pill at the bottom of the chat to choose which database to query.",
                    },
                    {
                      label: "Be specific",
                      desc: 'Instead of "Show sales", ask "What were total sales for the last 6 months, grouped by month?"',
                    },
                    {
                      label: "Refine output",
                      desc: 'Follow up on queries: "Sort descending and filter out values below 1000."',
                    },
                    {
                      label: "Inspect SQL",
                      desc: "Expand the SQL panel inside any AI response to review the exact database query generated.",
                    },
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>
                        <strong className="text-white/70">{tip.label}:</strong> {tip.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: Dashboards ──────────────────────────────────────── */}
          <section id="dashboards" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-7.png"
              alt="Dashboards Background"
              fill
              className="object-cover object-center "
            />
            <div className="absolute inset-0 bg-[#131314]/67" />
            <div className="relative z-10 space-y-5">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400 text-xs font-bold border border-pink-500/20">
                  3
                </span>
                Interactive Dashboards
              </h3>
              <div className="space-y-4 text-white/70 text-sm md:text-base">
                <p>
                  The Dashboard acts as a high-level operational overview of all your connected data sources. It offers instant visual analytics on database health, transaction latency, and active connection pipelines.
                </p>
                <p>
                  From the Dashboard you can jump directly into an AI chat for any database by clicking the search/ask bar, or connect a fresh database immediately.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: Chat History ────────────────────────────────────── */}
          <section id="chat-history" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-6.png"
              alt="History Background"
              fill
              className="object-cover object-center "
            />
            <div className="absolute inset-0 bg-[#131314]/80" />
            <div className="relative z-10 space-y-5">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 text-xs font-bold border border-violet-500/20">
                  4
                </span>
                Managing History & Sessions
              </h3>
              <div className="space-y-4 text-white/70 text-sm md:text-base">
                <p>
                  BI-Lite automatically logs all conversation threads so you can return to important analyses or refine past results anytime.
                </p>
                <p>
                  In the sidebar, previous chats are organized chronologically. Hover over any session to reveal options to <strong className="text-white/70">rename</strong> it for better organization or <strong className="text-white/70">permanently delete</strong> it when no longer needed.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: Security & Privacy ────────────────────────────────────── */}
          <section id="security" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-8.png"
              alt="Security Background"
              fill
              className="object-cover object-center "
            />
            <div className="absolute inset-0 bg-[#131314]/80" />
            <div className="relative z-10 space-y-5">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 text-xs font-bold border border-teal-500/20">
                  5
                </span>
                Security & Privacy
              </h3>
              <div className="space-y-4 text-white/70 text-sm md:text-base">
                <p>
                  We treat your data with the highest level of security. Here is what you need to know about our data handling measures:
                </p>
                <ul className="space-y-3 mt-4 ml-2 border-l-2 border-teal-500/30 pl-4">
                  <li>
                    <strong className="text-white">What we see:</strong> Database structure/metadata (table names, column headers, and types).
                  </li>
                  <li>
                    <strong className="text-white">What we never see, save, or track:</strong> User data, login info, database connection strings, user behavior analytics, raw row data, personal identifiers, or sensitive credentials.
                  </li>
                  <li>
                    <strong className="text-white">Our AI promise:</strong> The LLM provider does not store or train on your inputs. Your queries remain private.
                  </li>
                  <li>
                    <strong className="text-white">Protection measures:</strong> All AI-generated SQL is parsed into an AST and strictly blocked if it contains destructive operations (e.g. DROP, DELETE). We also enforce hard statement timeouts and execute pre-flight checks (EXPLAIN PLAN) to stop full table scans.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: External API ────────────────────────────────────── */}
          <section id="external-api" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-8.png"
              alt="API Background"
              fill
              className="object-cover object-center scale-x-[-1]"
            />
            <div className="absolute inset-0 bg-[#131314]/85" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">
                  6
                </span>
                External Onboarding API
              </h3>
              <p className="text-white/70 text-sm md:text-base">
                BI-Lite exposes a secure, public HTTP API allowing external systems (e.g., custom admin dashboards or CRM platforms) to programmatically register prospect users and provision database connections upon account setup.
              </p>

              {/* Endpoint Details */}
              <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    POST
                  </span>
                  <code className="text-sm text-white/80 font-mono">/api/onboard</code>
                </div>
                <div className="hidden sm:block text-white/20">|</div>
                <div className="text-xs text-white/55 flex items-center">
                  Public Endpoint · Content-Type: application/json
                </div>
              </div>

              {/* Responsive Parameters Table */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/80">Request Body Parameters</h4>
                <div className="overflow-x-auto rounded-xl border border-white/15 bg-black/[0.7]">
                  <table className="w-full min-w-[500px] text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#252528] text-white/40 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="px-4 py-3">Parameter</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Required</th>
                        <th className="px-4 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-white/70">
                      <tr>
                        <td className="px-4 py-3 font-semibold font-mono text-white">name</td>
                        <td className="px-4 py-3 text-white/40">string</td>
                        <td className="px-4 py-3 text-red-400 font-medium">Yes</td>
                        <td className="px-4 py-3 text-white/60">The user's display name.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold font-mono text-white">email</td>
                        <td className="px-4 py-3 text-white/40">string</td>
                        <td className="px-4 py-3 text-red-400 font-medium">Yes</td>
                        <td className="px-4 py-3 text-white/60">Unique email address of the onboarded user.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold font-mono text-white">siteUrl</td>
                        <td className="px-4 py-3 text-white/40">string</td>
                        <td className="px-4 py-3 text-white/40">No</td>
                        <td className="px-4 py-3 text-white/60">Custom site URL origin where the redirectionUrl will point to (must match allowed CORS origins).</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold font-mono text-white">database</td>
                        <td className="px-4 py-3 text-white/40">array</td>
                        <td className="px-4 py-3 text-white/40">No</td>
                        <td className="px-4 py-3 text-white/60">Array of database connection objects to auto-provision during registration.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/80">Success Response (200 OK)</h4>
                <div className="rounded-xl border border-white/15 bg-black/[0.7] p-4 text-xs md:text-sm text-white/65 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-semibold text-white/70">Field</span>
                    <span className="font-semibold text-white/70">Description</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-mono text-white/90">existingUser</span>
                    <span className="text-white/50">boolean · true if email exists in database.</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-mono text-white/90">redirectionUrl</span>
                    <span className="text-white/50">string · sign-in or set-password URL path.</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-mono text-white/90">message</span>
                    <span className="text-white/50">string · human-readable result message.</span>
                  </div>
                </div>
              </div>

              {/* Example Expansion Panel */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/80">Examples</h4>
                <details className="group rounded-xl border border-white/10 bg-[#1b1b1d] overflow-hidden transition-all duration-200">
                  <summary className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-white cursor-pointer select-none hover:bg-white/[0.04]">
                    <span>Payload & curl Examples</span>
                    <ChevronRight className="size-4 text-white/55 transition-transform duration-200 group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 pt-4 border-t border-white/10 bg-[#09050d]/80 space-y-4">
                    <div>
                      <h5 className="text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wide text-left">1. MongoDB Payload Example</h5>
                      <pre className="p-3 rounded-lg bg-black/[0.3] border border-white/[0.04] overflow-x-auto font-mono text-xs text-white/70 text-left">
                        {`{
  "name": "Alice Smith",
  "email": "alice@email.com",
  "siteUrl": "https://myapp.com",
  "database": [
    {
      "name": "Mongo Database",
      "engine": 0,
      "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/dbname",
      "tables": ["users", "orders"]
    }
  ]
}`}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wide text-left">2. PostgreSQL Payload Example</h5>
                      <pre className="p-3 rounded-lg bg-black/[0.3] border border-white/[0.04] overflow-x-auto font-mono text-xs text-white/70 text-left">
                        {`{
  "name": "Bob Jones",
  "email": "bob@email.com",
  "siteUrl": "https://myapp.com",
  "database": [
    {
      "name": "Postgres Database",
      "engine": 1,
      "host": "postgres.example.com",
      "port": 5432,
      "dbName": "prod_db",
      "dbUser": "db_user",
      "password": "securepassword",
      "sslEnabled": true,
      "tables": ["products", "customers"]
    }
  ]
}`}
                      </pre>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wide text-left">3. Example Curl (MongoDB)</h5>
                      <pre className="p-3 rounded-lg bg-black/[0.3] border border-white/[0.04] overflow-x-auto font-mono text-xs text-emerald-400 text-left">
                        {`curl -X POST "https://api.bi-lite.com/api/onboard" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alice Smith",
    "email": "alice@email.com",
    "siteUrl": "https://myapp.com",
    "database": [
      {
        "name": "Mongo Database",
        "engine": 0,
        "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/dbname",
        "tables": ["users", "orders"]
      }
    ]
  }'`}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </section>

          <hr className="border-white/[0.06] mb-12" />

          {/* ── SECTION: Contact ─────────────────────────────────────────── */}
          <section id="contact" className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10">
            <Image
              src="/about-bg-5.png"
              alt="Contact Background"
              fill
              className="object-cover object-center "
            />
            <div className="absolute inset-0 bg-[#131314]/70" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <User className="size-5 text-blue-400" />
                Contact & Support
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                If you run into issues, have feedback, or want to report bugs regarding database integrations or query synthesis, please reach out.
              </p>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="absolute top-[-40px] right-[-40px] size-28 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white text-sm font-bold">
                      AA
                    </div>
                    <div>
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Developed by</p>
                      <p className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        Atonu Ahmed
                      </p>
                    </div>
                  </div>
                  <div className="h-px w-full bg-white/5 md:hidden" />
                  <div className="flex items-center gap-3">
                    <a
                      href="mailto:atonu.zahin@gmail.com"
                      className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-transparent text-white/70 transition-all hover:border-white/50 hover:bg-white/10 hover:text-white"
                      title="Email: atonu.zahin@gmail.com"
                    >
                      <Mail className="size-4" />
                    </a>
                    <a
                      href="https://atonu.cloud/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 items-center gap-2 rounded-full border border-white/20 bg-transparent px-4 text-sm font-medium text-white/70 transition-all hover:border-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Globe className="size-4" />
                      Website
                      <ArrowUpRight className="size-3 opacity-60" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 pb-8 text-center text-xs text-white/20 select-none">
            BI-Lite Help Center © {new Date().getFullYear()} · All rights reserved.
          </div>
        </div>

        {/* ── RIGHT COLUMN: Sticky Index Panel ─────────────────────────── */}
        <div className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-14 space-y-5">
            <div className="border-l border-white/8 pl-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">
                On this page
              </p>
              <p className="text-xs text-white/35">Quick navigation</p>
            </div>

            <nav className="flex flex-col gap-1">
              {SECTIONS.map((sec) => {
                const isActive = activeId === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleIndexClick(sec.id, e)}
                    className={cn(
                      "flex items-center justify-between gap-2 border-l-2 pl-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer",
                      isActive
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-white/35 hover:text-white/70 hover:border-white/15"
                    )}
                  >
                    <span>{sec.label}</span>
                    {isActive && <ChevronRight className="size-3 text-blue-400/70 shrink-0" />}
                  </a>
                );
              })}
            </nav>

            <div className="pl-4 pt-4 border-t border-white/5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold group"
              >
                <span>Back to Chat</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
