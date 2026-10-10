# KAROBAAR AI — FROM-SCRATCH HACKATHON BUILD CONTEXT

## Project Status

This repository is starting from zero.

Any previous implementation, scaffold, UI, backend, provider layer, database, or prototype should be treated as nonexistent unless it is created again inside this repository during the current build.

The goal is not to revive or patch an earlier attempt. The goal is to build a clean, coherent, working hackathon product from first principles.

---

## Project Identity

**Project:** Karobaar AI  
**Track:** Financial Inclusion  
**Hackathon:** Alibaba Cloud AI Hackathon Pakistan 2026  
**Team Size:** 3  
**Time Remaining:** approximately 5 development days  
**Primary Objective:** build a reliable, technically credible, visually polished, end-to-end vertical slice that solves a real financial-inclusion problem for informal Pakistani merchants.

---

## Product Thesis

Many small merchants in Pakistan run real, ongoing businesses but do not maintain structured financial records. Their economic activity often exists in voice, memory, receipts, handwritten notes, and informal udhaar records.

Karobaar AI should not require these merchants to become accountants or learn complex software.

The product should allow them to behave naturally and convert that activity into usable financial evidence.

The core product idea is:

> Speak or show what happened in the business.  
> Let AI understand it.  
> Let the merchant verify it.  
> Store it deterministically.  
> Turn it into useful business intelligence.  
> Help the merchant understand financing readiness.  
> Let the system assist with simple next actions.

---

## Target User

Primary user:

A Pakistani micro or small merchant such as:

- kiryana store owner
- wholesaler
- small retailer
- local distributor
- workshop owner
- small service provider
- informal trader

The product should assume:

- Urdu / Roman Urdu is a natural interaction language
- cash and udhaar are common
- accounting knowledge may be limited
- complicated forms are undesirable
- the user values fast, understandable outcomes

---

## Problem

The merchant may know:

> "Ahmed ne aaj 5 hazaar ka maal udhaar liya."

But a financial system needs structured information such as:

- customer
- transaction type
- amount
- date
- status
- supporting evidence

Karobaar AI bridges that gap.

The larger financial-inclusion problem is that a business may be economically real but digitally invisible. Without structured history, the merchant has weak evidence of revenue, payment patterns, outstanding receivables, and business continuity.

---

## Final Product Positioning

Karobaar AI is not merely:

- a chatbot
- a digital khata
- an accounting system
- a loan approval system
- a credit scoring system

The strongest positioning is:

> **A voice-first financial evidence and decision-support layer for informal businesses.**

---

## Core Architecture

```text
                    KAROBAAR AI

                         │
                         ▼
                 CAPTURE LAYER
              ┌──────────┴──────────┐
              │                     │
          Urdu Voice           Receipt Photo
              │                     │
              └──────────┬──────────┘
                         ▼
               AI UNDERSTANDING
                Speech / Vision
                         │
                         ▼
              Structured Business Event
                         │
                         ▼
                  VERIFICATION
               - required fields
               - amount/date checks
               - duplicate checks
               - human confirmation
                         │
                         ▼
               BUSINESS EVENT LEDGER
                  deterministic DB
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      Sales            Udhaar          Expenses
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                   INTELLIGENCE
        ┌────────────────┼────────────────┐
        │                │                │
   Ask Business       Evidence        Financing
                      Passport        Readiness
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                      ACTION
               Draft payment reminder
```

Cross-cutting trust:

```text
Consent • Explainability • Human confirmation • Sources
Not a credit score • Not a lending decision
```

---

## Product Flow

The intended judge/demo flow is:

1. Merchant speaks a transaction in Urdu / Roman Urdu.
2. System transcribes and extracts a structured business event.
3. Merchant sees what Karobaar understood.
4. Merchant confirms or edits it.
5. Confirmed event enters the deterministic ledger.
6. Dashboard updates.
7. Merchant asks a business question.
8. System answers using real ledger data.
9. Merchant opens the Financial Evidence Passport.
10. System compares real business evidence against published financing-program requirements.
11. System shows matched evidence, missing evidence, and source.
12. Merchant asks for a payment reminder.
13. System retrieves the real outstanding balance and drafts the reminder.

---

## Supported Business Events

Keep the hackathon scope narrow.

Initial event types:

- `cash_sale`
- `credit_sale`
- `payment_received`
- `expense`

Recommended normalized event fields:

```json
{
  "event_type": "credit_sale",
  "counterparty": "Ahmed",
  "amount_paisa": 500000,
  "currency": "PKR",
  "occurred_at": "2026-08-29",
  "payment_status": "outstanding",
  "source_type": "voice",
  "raw_input": "Ahmed ne aaj 5 hazaar ka maal udhaar liya",
  "ai_confidence": 0.94,
  "verification_status": "pending"
}
```

Authoritative monetary values should not use ordinary binary floating point.

Use integer paisa or fixed precision decimal arithmetic.

---

## AI Responsibilities

AI may:

- transcribe Urdu / Roman Urdu voice
- understand transaction intent
- extract structured fields
- understand receipt images
- interpret business questions
- explain financing matches
- draft reminder messages

AI must not:

- calculate authoritative ledger balances
- invent totals
- silently save uncertain transactions
- create a fake credit score
- approve loans
- claim guaranteed eligibility
- guess missing business facts
- overwrite verified records without user action

---

## Deterministic Responsibilities

Normal application code / database logic should own:

- ledger storage
- customer balances
- sales totals
- expenses
- outstanding udhaar
- payment recovery
- date comparisons
- dashboard calculations
- evidence metrics
- financing requirement matching where direct rules are possible

---

## Financial Evidence Passport

This is a qualitative and explainable business evidence profile.

Possible fields:

- recorded business history
- recorded sales
- average monthly sales
- outstanding receivables
- payment recovery pattern
- percentage of transactions with supporting evidence
- revenue consistency
- customer concentration
- documentation gaps

Do not create an unsupported numeric credit score.

---

## Financial Readiness

Financial Readiness means:

```text
Verified merchant evidence
            +
Published financing requirements
            ↓
Matched requirements
Missing requirements
Relevant next step
Official source
```

Example:

If a financing program requires a certain business-history or revenue threshold and the verified Karobaar ledger appears to satisfy it, the product may say:

> "Your recorded business data appears to meet this published requirement."

It must not say:

> "You are approved."

or:

> "You are definitely eligible."

The purpose is to help the merchant understand readiness, not replace the financial institution.

---

## Financing Knowledge Base

For the hackathon, use a small curated dataset rather than a complex vector database.

Target: 3–5 real Pakistani financing programs.

Each record may include:

- program name
- provider
- target user
- purpose
- published eligibility requirements
- financing range where officially published
- required documents
- official source URL
- last verified date
- deterministic matching hints

Prefer official / first-party sources.

---

## User-Facing Product Surfaces

Build approximately five core screens.

### 1. Dashboard

Show:

- monthly sales
- expenses
- outstanding udhaar
- payments recovered
- top debtor / overdue customer
- recent activity
- clear CTA to record a transaction

### 2. Record Transaction

Two primary actions:

- Speak
- Scan / upload receipt

Also show:

- recording state
- transcription / extraction state
- "Karobaar understood this" review card
- Confirm / Edit / Reject

### 3. Ledger & Udhaar

Show:

- recent transactions
- customer balances
- transaction type
- source
- outstanding amounts
- overdue amounts

### 4. Ask Karobaar

Support only a few reliable questions initially:

- total outstanding
- top debtor
- monthly sales
- month-over-month sales comparison

The model interprets intent; backend functions query the database.

### 5. Financial Evidence & Readiness

Combine:

- Financial Evidence Passport
- financing-program comparison
- matched evidence
- missing evidence
- next step
- official source

The payment reminder may appear as a modal or drawer rather than a separate page.

---

## Visual Direction

The application should feel like a serious modern fintech product, not a student dashboard.

Desired qualities:

- premium
- trustworthy
- minimal
- spacious
- responsive
- clear
- polished
- low cognitive load
- good typography
- strong visual hierarchy

### 3D / Spline

Use at most one major Spline / 3D visual.

Best locations:

- hero / entry area
- top of dashboard

The visual should support the concept of fragmented business activity becoming structured financial intelligence.

Do not put heavy 3D on every page.

### Motion

Use restrained motion:

- hover elevation
- subtle transitions
- animated metric changes
- microphone pulse
- progress states
- skeleton loaders
- confirmation transitions

Do not sacrifice performance or reliability for decoration.

---

## Optional Landing / Entry Experience

If time allows, the product may open with a short entry experience:

1. Hero
2. One-line problem
3. Speak → Verify → Understand → Act
4. Enter Demo

Do not spend major development time on marketing sections.

The product itself is the demonstration.

---

## Technical Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- Browser MediaRecorder API
- Browser file/image upload
- optional Spline
- optional small animation library only if justified

### Backend
- FastAPI
- Python
- Pydantic
- REST API

### Database
- SQLite for hackathon

Optional:
- Supabase only if remote persistence becomes necessary

### AI Provider Strategy

The product should support a provider adapter.

Desired behavior:

```text
Alibaba configured?
    → Alibaba Cloud Model Studio / Qwen
else
Groq configured?
    → Groq fallback
else
    → clear setup/demo mode
```

Internal capabilities should look approximately like:

```text
transcribe_audio()
extract_event_from_text()
extract_event_from_image()
interpret_business_question()
draft_reminder()
summarize_financing_match()
```

Application business logic should not depend directly on one provider.

### Deployment
- Vercel for frontend
- Render or Railway for FastAPI
- GitHub for source control

---

## Team Structure

### Person 1 — AI / Backend Lead

Owns:

- provider adapter
- transcription
- extraction
- AI output validation
- business-question interpretation
- reminder drafting
- AI test/evaluation work

### Person 2 — Frontend / Integration Lead

Owns:

- design system
- responsive UI
- optional Spline
- capture interface
- review / confirm interface
- dashboard
- ledger
- API integration
- deployment

### Person 3 — Product / Data / QA Lead

Owns:

- financing-program research
- financing dataset
- matching rules
- test data
- seed data
- Financial Evidence Passport wording
- UX copy
- QA
- documentation
- pitch / demo narrative

Everyone should work toward the same milestone each day rather than three isolated workstreams.

---

## Five Development Milestones

### Milestone 0 — Product & Architecture Bootstrap

Purpose:

Create a clean repository and prove the basic application shape.

Expected outcomes:

- fresh repository structure
- Next.js frontend
- FastAPI backend
- SQLite connection
- environment configuration
- AI provider adapter interface
- final screen skeleton
- frontend ↔ backend connectivity
- seed/demo data strategy
- basic README
- Git initialized

Exit condition:

The system runs cleanly and there is no architectural ambiguity before feature development begins.

---

### Milestone 1 — Capture, AI Understanding, Verification

Purpose:

Turn messy voice or receipt input into a structured event that the merchant can verify.

Expected outcomes:

- microphone recording
- audio upload
- speech transcription
- text → structured business event
- receipt upload
- receipt → structured business event
- Pydantic validation
- edit / confirm / reject flow
- low-confidence / malformed-output handling
- representative test inputs

Exit condition:

Several Urdu / Roman Urdu inputs and receipt examples work, and uncertain input cannot silently enter the ledger.

---

### Milestone 2 — Ledger, Dashboard, Udhaar

Purpose:

Make the system financially real.

Expected outcomes:

- deterministic business-event persistence
- safe money handling
- customer balances
- exact totals
- recent transactions
- dashboard metrics
- basic overdue / udhaar visibility

Exit condition:

A confirmed transaction changes the actual stored ledger and the dashboard reflects the exact result.

---

### Milestone 3 — Ask Karobaar

Purpose:

Make the verified ledger conversational without letting AI invent financial numbers.

Expected outcomes:

- small set of supported business questions
- intent/tool selection
- backend functions / database queries
- exact answers sourced from ledger
- natural Urdu / Roman Urdu explanations
- graceful unsupported-question state

Exit condition:

The user can ask several predefined business questions and receive accurate database-grounded answers.

---

### Milestone 4 — Financial Evidence, Readiness, Action

Purpose:

Prove the Financial Inclusion value proposition.

Expected outcomes:

- Financial Evidence Passport
- 3–5 real financing programs
- structured eligibility requirements
- matched evidence
- missing evidence
- official sources
- next-step guidance
- reminder intent
- exact debtor lookup
- editable payment-reminder draft

Exit condition:

The user can understand their financial evidence, see why a financing program may be relevant, understand what is missing, and draft a reminder from actual ledger data.

At this point:

**Feature freeze.**

---

### Milestone 5 — Reliability, Polish, Deployment, Demo

Purpose:

Turn the product into a robust submission.

Expected outcomes:

- full code review
- financial-calculation checks
- error handling
- AI malformed-output handling
- duplicate handling
- missing-customer handling
- provider-failure handling
- responsive polish
- visual polish
- Spline optimization
- accessibility basics
- production builds
- deployment
- resettable demo data
- representative AI evaluation cases
- documentation
- architecture diagram
- backup demo path
- final pitch/demo flow

No new product features.

---

## Explicitly Out of Scope

Do not build during this hackathon:

- authentication
- multi-shop accounts
- advanced role management
- full accounting system
- inventory
- POS
- payroll
- CRM
- real bank integrations
- KYC engine
- loan underwriting
- credit scoring
- production WhatsApp sending
- production SMS sending
- native mobile apps
- microservices
- Kafka
- Kubernetes
- large vector databases
- multi-agent orchestration
- model training
- many regional languages
- dozens of financing programs

---

## Coding Standards

### General

- simple architecture
- clear separation of concerns
- small readable functions
- typed interfaces
- explicit error handling
- no unnecessary abstractions
- no trendy technology without a concrete need
- no hidden feature expansion

### Python / FastAPI

- type hints
- Pydantic models
- explicit API contracts
- separate model-provider logic from business logic
- deterministic financial calculations
- validated external inputs
- safe failure handling

### TypeScript / Next.js

- strict TypeScript
- reusable components
- centralized API calls
- deliberate loading / empty / error states
- no huge monolithic page components
- responsive layouts

### Money

- integer paisa or Decimal
- no authoritative financial values stored/calculated with ordinary floating point

### AI

- structured output where possible
- validate every model output
- never trust model-generated balances
- preserve source/raw input for traceability
- isolate provider-specific code behind adapter
- keep prompts versionable / centralized where practical

### Git

- milestone-oriented commits
- frequent stable commits
- no massive unreviewed final commit
- tag stable checkpoints if useful

---

## UX Language

Tone:

- simple
- respectful
- trustworthy
- concise
- locally understandable

Prefer:

- "Karobaar understood..."
- "Your recorded business data shows..."
- "This financing option may be relevant..."
- "You currently appear to match..."
- "The following evidence is still missing..."

Avoid:

- "Approved"
- "Guaranteed"
- unsupported "credit score"
- unsupported "risk score"
- unnecessary banking/accounting terminology

---

## Evaluation / Testing

Create a small representative evaluation set.

### Voice

Target:
- 20–30 Urdu / Roman Urdu business statements

Examples:

- Ahmed ne 2500 ka maal udhaar liya.
- Aaj 5000 ki cash sale hui.
- Bilal ne apne 3000 rupay de diye.
- Aaj bijli ka 12000 ka bill diya.

Track extraction quality for:

- event type
- counterparty
- amount
- status

### Receipts

Target:
- around 10 representative receipt images

Track:

- merchant
- total
- date
- type

Only report measured accuracy.

Do not invent metrics.

---

## Demo Definition of Done

The project is strong enough when this exact flow works:

1. Open Karobaar AI.
2. Speak an Urdu transaction.
3. See transcription.
4. See structured extraction.
5. Confirm it.
6. See ledger update.
7. See dashboard update.
8. Ask a business question.
9. Receive an exact database-grounded answer.
10. Open Financial Evidence Passport.
11. View a real financing-program comparison.
12. See matched and missing evidence.
13. Ask Karobaar to draft a debtor reminder.
14. Receive an accurate ready-to-copy message.

If this works smoothly, stop adding features.

---

## AI Coding Assistant Working Style

When an AI coding assistant works on this repository:

1. Read this context file first.
2. Inspect the actual repository before deciding anything.
3. Reason about the current milestone.
4. Prefer the smallest reliable implementation.
5. Do not assume earlier code exists.
6. Do not add features outside the active milestone.
7. Run builds/tests after implementation.
8. Fix actual failures before reporting completion.
9. Explain tradeoffs and risks.
10. Stop at the milestone boundary.

The assistant should act as a senior product engineer and technical partner, not as a blind code generator.

