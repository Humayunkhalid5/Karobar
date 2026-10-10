You: 

![WhatsApp Image 2026-08-29 at 4.23.32 PM (1).jpeg](https://chatgpt.com/backend-api/estuary/content?id=file_00000000750c820887f5555fa705aabe&ts=496747&p=fs&cid=1&sig=68e5f122a74d3735006abd4c2d7cf10dbd3de805dacc04283c82ef2d083132b8&v=0)

![WhatsApp Image 2026-08-29 at 4.23.32 PM.jpeg](https://chatgpt.com/backend-api/estuary/content?id=file_00000000e96482118c2447e745c0c295&ts=496747&p=fs&cid=1&sig=4d2fd4b836c0c4c5f3cade253c694a3e7bc2d8e829df8418d84aa74d26bd9a32&v=0)

![WhatsApp Image 2026-08-29 at 4.23.33 PM (1).jpeg](https://chatgpt.com/backend-api/estuary/content?id=file_00000000569482118d8b665698d1af39&ts=496747&p=fs&cid=1&sig=bb1f18c77ff19f4b4ea283eefd2dbdeafe251f04bf7b49edcff6c5a19a75be43&v=0)

![WhatsApp Image 2026-08-29 at 4.23.33 PM.jpeg](https://chatgpt.com/backend-api/estuary/content?id=file_00000000e9808211b17e730dc5173a10&ts=496747&p=fs&cid=1&sig=772fcd216f0243e8aa7d4c202358348546c929f139851078ade4070689fa4b8d&v=0)

mails.txt

Document

initialVersion.txt

Document

claudecontext.txt

Document

discord.txt

Document

step2 Spec Qoder-AI-Coding-Hands-on-Lab-Guide.md

File

Hello ChatGPT, I am back after a few days, and consider that now the real work of the hackathon starts. Today is 29th of August, and we have to submit everything by the end of the 4th September. So we have seven days. Consider I have no understanding of whatever we have researched so far and what we will be doing. I have attached a claude context TXT as well as the info from the mails that we received from them. Through this, I came to know that our project has been placed at grade 2A, due to which we just threw a prompt to claude and asked it to improved my architecture and submitted another version of our project. But the thing is that I haven't read this, and I do not know what is included in this architecture and what changes have been done. Consider me a layman, so explain things to me in very simple words. After that, we can move towards the qoder IDE access, which we have received, and the ChatGPT desktop version, which we have. So make a proper plan for us three persons: what we have to build, how we have to build, in what timeline we should build, and also give me ready-to-copy chunks that include the relevant context that I can give to the next LLMs. But we will move to these things later on. First of all, analyze this TXT as well as the screenshots and the context of the mails, and then tell me what's the plan. I don't know which final features, which modules, what tech stack, which API, we will be using so define all of these things for us and then tell me in which direction should we proceed. Which things should we skip for this 6 day development phase, I'm attaching the discord messages as well so analyze the requirements that they're expecting from us and advise me accordingly. Aside from this, I have also attached a Discord TXT in which all the instructions which were given to us in Discord are attached, as well as there are four images that were screenshotted from an online lecture that they provided to us. So I have given these things just in order so that you can better analyze all the aspects and then narrow down what we should exactly build rather than just building a front-end, back-end, API, logic, AI. It should solve a real problem, and it should have the necessary features that the recruiting team is looking for.

ChatGPT: 

Yes — that is exactly what the **Financial Readiness** module means.

Karobaar AI is not giving Ahmed a loan and it is not acting like a bank. It is simply comparing **Ahmed’s real business evidence** with the **published requirements of financing schemes**.

So in your example, if Ahmed’s business records inside Karobaar show that he has reached PKR 1 million in qualifying revenue, and an XYZ financing scheme officially says that applicants need at least PKR 1 million revenue, Karobaar can detect:

> “Ahmed now appears to meet this requirement.”

Then Karobaar can tell him something like:

> “Based on your recorded business data, you currently match the revenue requirement for XYZ Scheme. You may want to review the remaining eligibility requirements.”

That is the key difference: we should **not** say, “You are eligible” or “You will get the loan,” because there may be other conditions such as age, documents, collateral, business duration, registration status, location, or lender-specific checks.

So yes, the Financial Readiness module is basically:

**Your business data + official scheme requirements → matched requirements + missing requirements + next step.**

And yes, optionally, Karobaar can notify Ahmed when his recorded business activity crosses an important threshold and makes a scheme newly relevant to him. That would make the feature much more useful than simply showing a static list of loans.

You: 

Okay, now assume that the R&D phase is complete and we are now moving towards the development phase. Assume we only have five days left, and what do you think should we start building at the very first, and in what phases should we proceed? And assume we are three persons, How will you break technical things down for the implementation? We have qoder Teams (Free + 300 credits) and ChatGPT Plus account. Give me the exact prompts that I can enter into ChatGPT desktop version and break the whole project down into four or five milestones, so that I can enter one milestone at a time and until and unless that milestone is achieved, I will not proceed into the next step. but obviously i will not instruct it rather i want it to do the reasoning and thinking itself and make a plan accordingly. For the front end, I am assuming that I will be adding 3D or spline animations, so that I can impress the reviewers. Do some thinking that exactly how many and what dashboards should be build on the front web page. Write these things in the instructions of the prompts accordingly. We can also go for a static one-page, adding the animations, hovering, dropdowns, and everything that's necessary. I can use Dribble MCP to connect with that. And for the backend, break the whole project into the milestones, as I said. Aside from this, give me a Markdown.md file that has all the context, that I can add in the project folder in my local. Include everything that we have discussed so far in this chat, like what we are building, how we are going to build that, it's in hackathon, the scope, the features, timeline, requirements, and the writing style, the coding style, and other things that you have analyzed that I prefer, so that I can give all the things that are necessary in order to build in a more professional way.

ChatGPT: 

Analyzed

```
Python

```
frompathlibimportPathcontent=r"""# KAROBAAR AI — Hackathon Build Context & Execution Brief

## 1. Project Identity

**Project Name:** Karobaar AI  
**Hackathon Track:** Financial Inclusion  
**Hackathon:** Alibaba Cloud AI Hackathon Pakistan 2026  
**Build Window:** 5-day execution plan  
**Team Size:** 3 people  
**Primary Goal:** Build a working, technically credible, judge-friendly vertical slice that solves a real financial-inclusion problem for informal Pakistani merchants.

---

## 2. One-Line Product Definition

Karobaar AI turns Urdu/Roman-Urdu voice input and receipt photos into verified financial records, then helps informal merchants understand their business, build financial evidence, identify relevant financing opportunities, and take simple actions such as drafting payment reminders.

---

## 3. Core Problem

Many micro and small businesses in Pakistan conduct real economic activity but do not maintain structured financial records.

Their business information often exists in:
- memory
- paper registers
- loose receipts
- informal udhaar notes
- WhatsApp messages
- spoken transactions

This creates two problems:

1. The merchant does not have a reliable digital view of the business.
2. The business may be economically active but still be digitally invisible to formal financial systems.

Karobaar AI should not force a shopkeeper to become an accountant. It should make the shopkeeper's existing behavior digitally useful.

---

## 4. Core Product Thesis

**Traditional software asks the merchant to structure the information.**

Karobaar AI does this instead:

```text
Natural merchant behavior
        ↓
AI understanding
        ↓
Human verification
        ↓
Deterministic financial record
        ↓
Business intelligence
        ↓
Financial readiness guidance
        ↓
Action
```
```

The product is not "AI bookkeeping."

The stronger positioning is:

> **Financial evidence and decision-support infrastructure for informal businesses.**

---

## 5\. Target User

Primary user:

A Pakistani micro or small merchant such as:

-   kiryana store owner
    
-   wholesaler
    
-   small retailer
    
-   workshop owner
    
-   local distributor
    
-   service provider
    
-   informal trader
    

Typical behavior:

-   speaks Urdu or Roman Urdu
    
-   uses cash and udhaar
    
-   may not use formal accounting software
    
-   may have low tolerance for complicated digital forms
    
-   wants simple answers, not accounting terminology
    

---

## 6\. Product Principles

1.  **Problem first, technology second.**
    
2.  **Voice is the front door, not an add-on.**
    
3.  **AI understands messy input; deterministic software owns the money.**
    
4.  **Human verification sits between AI extraction and trusted records.**
    
5.  **Never fabricate financial eligibility or credit scores.**
    
6.  **Financial readiness means matching known business evidence against published financing requirements.**
    
7.  **The merchant remains the decision-maker.**
    
8.  **The hackathon build must be narrow, reliable, and demoable.**
    
9.  **One complete workflow is more valuable than many half-built features.**
    
10.  **Anything not required for the core demo goes on the roadmap, not into the code.**
    

---

## 7\. Final Architecture

```
```
KAROBAAR AI

                         │
                         ▼
                1. CAPTURE LAYER
              ┌──────────┴──────────┐
              │                     │
          Urdu Voice           Receipt Photo
              │                     │
              └──────────┬──────────┘
                         ▼
              2. AI UNDERSTANDING
                 Speech / Vision
                    Qwen / AI
                         │
                         ▼
              Structured Business Event
                         │
                         ▼
                 3. VERIFICATION
               - required fields
               - amount/date checks
               - confidence handling
               - duplicate checks
               - human confirmation
                         │
                         ▼
             4. BUSINESS EVENT LEDGER
                Deterministic database
                         │
           ┌─────────────┼─────────────┐
           │             │             │
         Sales         Udhaar        Expenses
           │             │             │
           └─────────────┼─────────────┘
                         ▼
                 5. INTELLIGENCE
           ┌─────────────┼─────────────┐
           │             │             │
      Ask Business   Evidence       Financing
                     Passport       Readiness
           │             │             │
           └─────────────┼─────────────┘
                         ▼
                    6. ACTION
              Draft payment reminder
```
```

Cross-cutting trust layer:

```
```
Consent • Explainability • Human confirmation • Source attribution
Not a credit score • Not a lending decision
```
```

---

## 8\. AI vs Deterministic Responsibilities

### AI may do:

-   Urdu/Roman-Urdu transcription
    
-   intent interpretation
    
-   receipt understanding
    
-   structured-field extraction
    
-   natural-language explanation
    
-   reminder drafting
    
-   financing-match explanation
    

### AI must NOT do:

-   calculate ledger totals
    
-   invent balances
    
-   decide whether a person receives a loan
    
-   generate a black-box credit score
    
-   silently overwrite records
    
-   guess missing transaction amounts
    
-   determine eligibility without published criteria
    

### Deterministic backend owns:

-   storage
    
-   balances
    
-   sales totals
    
-   outstanding udhaar
    
-   dates
    
-   comparisons
    
-   evidence metrics
    
-   financing requirement matching where rules can be represented directly
    

---

## 9\. Canonical Business Event

Use a single normalized event model.

Example:

```
JSON

```
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
```

Initial supported event types:

-   `cash_sale`
    
-   `credit_sale`
    
-   `payment_received`
    
-   `expense`
    

Avoid floating-point money. Store money in paisa or use fixed-precision decimal arithmetic.

---

## 10\. Financial Readiness — Exact Meaning

Financial Readiness is not loan approval.

It means:

```
```
Merchant's verified business evidence
                +
Published financing-program requirements
                ↓
Matched requirements
Missing requirements
Relevant next step
Official source
```
```

Example:

If Karobaar records that Ahmed's business has the required revenue threshold for a financing program, the system may say:

> "Your recorded business data appears to meet the published revenue requirement for XYZ Program. Review the remaining requirements before applying."

It must NOT say:

> "You are approved."

or

> "You are definitely eligible."

The module may later support notifications when a business newly meets an important published threshold, but this is optional for the hackathon.

---

## 11\. Financial Evidence Passport

Use a qualitative, explainable evidence profile.

Possible fields:

-   recorded business history
    
-   recorded sales
    
-   average monthly sales
    
-   outstanding receivables
    
-   payment recovery pattern
    
-   percentage of transactions with supporting evidence
    
-   revenue consistency
    
-   customer concentration
    
-   documentation gaps
    

Do not create a numeric credit score.

Recommended UI name:

**Financial Evidence Passport**

---

## 12\. Financing Knowledge Base

For the hackathon, do NOT build a heavy vector database.

Use a small curated JSON dataset containing 3–5 verified Pakistani financing programs.

Each record should include:

```
```
program_name
provider
target_user
purpose
published_eligibility
loan_range
required_documents
official_source_url
last_verified
matching_rules
```
```

Preferred source categories:

-   State Bank of Pakistan SME regulations / programs
    
-   PM Youth Business & Agriculture Loan Scheme
    
-   National Bank of Pakistan SME products
    
-   Bank of Punjab SME products
    
-   Akhuwat or another verified microfinance source
    

Rule:

-   Use official or first-party sources wherever possible.
    
-   Every financing recommendation shown in the app must include its source.
    
-   Language should say "may be relevant", "appears to match", or "missing requirement", not "approved".
    

---

## 13\. Final User-Facing Screens

Do not build a huge multi-page SaaS application.

Build approximately **5 core product screens**.

### Screen 1 — Dashboard / Home

Purpose: instantly show the merchant's financial state.

Show:

-   monthly sales
    
-   expenses
    
-   outstanding udhaar
    
-   recovered payments
    
-   top debtor / overdue customer
    
-   primary CTA: "Record a Transaction"
    

### Screen 2 — Capture + Review

Purpose: voice or receipt input.

Show:

-   large microphone control
    
-   receipt upload/camera control
    
-   transcription/extraction state
    
-   "Karobaar understood this" review card
    
-   Confirm / Edit / Reject
    

### Screen 3 — Ledger & Udhaar

Purpose: deterministic financial memory.

Show:

-   recent transactions
    
-   filters by type
    
-   customer balances
    
-   overdue receivables
    
-   exact ledger values
    

### Screen 4 — Ask Karobaar

Purpose: natural-language access to business data.

Initially support only a small set of high-quality questions:

-   total outstanding
    
-   top debtor
    
-   monthly sales
    
-   month-over-month sales comparison
    

The LLM interprets the question; backend functions query the database; the answer uses the real returned values.

### Screen 5 — Financial Evidence & Readiness

Combine two concepts into one strong screen:

-   Financial Evidence Passport
    
-   financing-program matches
    
-   matched requirements
    
-   missing requirements
    
-   official source
    
-   next recommended step
    

The reminder draft can appear as a modal/drawer rather than a separate page.

---

## 14\. Front-End Design Direction

The visual goal is **premium fintech infrastructure**, not a student dashboard.

### Design personality

-   minimal
    
-   trustworthy
    
-   modern
    
-   polished
    
-   spacious
    
-   mobile-first
    
-   clear hierarchy
    
-   strong numbers and status cards
    
-   subtle motion
    
-   low cognitive load
    

### 3D / Spline Guidance

Do not turn the application into a 3D showcase.

Use **one major 3D/Spline moment only**:

-   hero/landing background
    
-   abstract financial network
    
-   flowing data / ledger blocks
    
-   subtle object responding to cursor or microphone state
    

Optional second use:

-   a very lightweight animated visual inside the Financial Evidence screen
    

Do NOT use heavy 3D on every page.

Reason:

-   performance risk
    
-   live-demo risk
    
-   distracts from product value
    
-   adds little judging value after the first visual impression
    

### Motion

Use:

-   hover elevation
    
-   card transitions
    
-   smooth number updates
    
-   subtle microphone pulse
    
-   extraction progress
    
-   confirmation transitions
    
-   animated status dots
    
-   skeleton states
    
-   very restrained parallax
    

### Landing / App Entry

A short one-page entry experience may include:

1.  Hero
    
2.  One-line problem
    
3.  "Speak → Verify → Understand → Act" visual
    
4.  CTA to enter demo dashboard
    

Do not spend a full day building marketing sections.

The application itself is the demo.

---

## 15\. Technical Stack

### Frontend

-   Next.js
    
-   TypeScript
    
-   Tailwind CSS
    
-   browser MediaRecorder API
    
-   native file/image upload
    
-   optional Spline embed
    
-   optional lightweight animation library only if already familiar
    

### Backend

-   FastAPI
    
-   Python
    
-   Pydantic
    
-   REST API
    

### Database

-   SQLite for hackathon
    
-   optional Supabase only if remote persistence becomes necessary
    

### AI Provider Layer

Provider selection:

```
```
AI_PROVIDER=auto
```
```

Behavior:

```
```
Alibaba configured?
    → use Alibaba
else Groq configured?
    → use Groq
else
    → demo/setup mode
```
```

Use one internal interface so the rest of the code never depends directly on the provider.

Recommended functions:

```
```
transcribe_audio()
extract_event_from_text()
extract_event_from_image()
interpret_business_question()
draft_reminder()
summarize_financing_match()
```
```

### AI Primary

Alibaba Cloud Model Studio / Qwen when credentials are available.

### AI Fallback

Groq with current Qwen models.

### Speech fallback

Groq Whisper multilingual transcription.

### Deployment

-   Vercel: frontend
    
-   Render or Railway: FastAPI backend
    
-   GitHub: repository
    

---

## 16\. Team Roles

### Person 1 — AI / Backend Lead

Owns:

-   provider adapter
    
-   speech transcription
    
-   structured extraction
    
-   validation support
    
-   business-question interpretation
    
-   reminder drafting
    
-   AI evaluation
    

### Person 2 — Frontend / Integration Lead

Owns:

-   design system
    
-   Spline/3D
    
-   responsive UI
    
-   capture flow
    
-   review/confirmation flow
    
-   dashboard
    
-   ledger views
    
-   API integration
    
-   deployment
    

### Person 3 — Product / Data / QA Lead

Owns:

-   financing-program research
    
-   financing JSON dataset
    
-   matching rules
    
-   test cases
    
-   seed/demo data
    
-   Financial Evidence Passport wording
    
-   UX copy
    
-   QA
    
-   pitch/demo story
    
-   README / technical documentation
    

Everyone reviews the full end-to-end flow daily.

---

## 17\. Five-Day Milestone Plan

# Milestone 1 — Foundation + End-to-End Skeleton

**Day 1**

Goal:  
Get the entire system shape running before building intelligence.

Deliver:

-   repository audit
    
-   clean frontend/backend structure
    
-   environment handling
    
-   database connection
    
-   provider adapter skeleton
    
-   API health
    
-   page/screen shell
    
-   demo seed data
    
-   one request successfully travelling frontend → backend → frontend
    

Exit criteria:

-   app runs locally
    
-   backend runs
    
-   provider config works
    
-   database works
    
-   pages render
    
-   no major architectural ambiguity remains
    

Do not proceed until this is stable.

---

# Milestone 2 — Capture → AI Understanding → Verification

**Day 2**

Goal:  
Turn voice and receipt inputs into structured, reviewable business events.

Deliver:

-   voice recording
    
-   audio upload
    
-   transcription
    
-   structured extraction
    
-   receipt upload
    
-   receipt extraction
    
-   Pydantic schema validation
    
-   human confirmation/edit
    
-   error/low-confidence states
    

Exit criteria:  
The team can successfully run at least:

-   5 representative Urdu/Roman-Urdu voice inputs
    
-   3 receipt examples
    
-   bad input does not silently enter the ledger
    

---

# Milestone 3 — Ledger + Dashboard + Ask Karobaar

**Day 3**

Goal:  
Make the product financially real.

Deliver:

-   business\_events persistence
    
-   exact deterministic totals
    
-   udhaar balances
    
-   recent transactions
    
-   dashboard
    
-   customer balances
    
-   3–4 supported Ask Karobaar functions
    

Exit criteria:  
Full loop works:

```
```
voice
→ AI extraction
→ confirmation
→ database
→ dashboard update
→ business question
→ exact database-grounded answer
```
```

Do not build financing features until this works reliably.

---

# Milestone 4 — Financial Evidence + Financing Readiness + Reminder

**Day 4**

Goal:  
Prove the Financial Inclusion value proposition.

Deliver:

-   Financial Evidence Passport
    
-   3–5 verified financing programs
    
-   requirement matching
    
-   matched/missing evidence
    
-   official source links
    
-   one next-step recommendation
    
-   voice/text reminder intent
    
-   debtor lookup
    
-   exact draft reminder
    

Exit criteria:  
The user can see what financial evidence exists, what is missing for a relevant program, and generate a payment reminder using real ledger data.

At the end of this milestone:

**FEATURE FREEZE.**

---

# Milestone 5 — Reliability + UI Polish + Demo + Submission

**Day 5**

Goal:  
Make the system difficult to break and easy to understand.

Deliver:

-   error handling
    
-   API failure handling
    
-   low-confidence handling
    
-   duplicate handling
    
-   exact financial-calculation tests
    
-   AI evaluation dataset
    
-   responsive UI polish
    
-   Spline/3D polish
    
-   accessibility basics
    
-   demo reset
    
-   seeded backup demo
    
-   production deploy
    
-   README
    
-   architecture diagram
    
-   final demo script
    
-   backup recorded demo
    

No new product features.

---

## 18\. Definition of Done

The demo is complete when this exact story works:

1.  Open Karobaar AI.
    
2.  Speak an Urdu transaction.
    
3.  See transcription.
    
4.  See extracted transaction.
    
5.  Confirm it.
    
6.  See ledger update.
    
7.  See dashboard update.
    
8.  Ask a business question.
    
9.  Receive an exact database-grounded answer.
    
10.  Open Financial Evidence Passport.
    
11.  See a financing-readiness comparison against a real program.
    
12.  See what evidence is missing.
    
13.  Ask Karobaar to draft a reminder.
    
14.  Receive a correct ready-to-copy message.
    

If this loop works smoothly, stop building features.

---

## 19\. Explicitly Out of Scope

Do not build during the hackathon:

-   authentication
    
-   multi-shop accounts
    
-   multi-user roles
    
-   inventory
    
-   POS
    
-   payroll
    
-   CRM
    
-   real lending decisions
    
-   credit scoring
    
-   bank API integrations
    
-   KYC engine
    
-   WhatsApp production API
    
-   SMS production API
    
-   native mobile apps
    
-   microservices
    
-   Kafka
    
-   Kubernetes
    
-   complex vector databases
    
-   multi-agent orchestration
    
-   custom model training
    
-   complete accounting
    
-   many regional languages
    
-   dozens of financing programs
    

These belong on the roadmap.

---

## 20\. Coding Standards

### General

-   prefer simple architecture over clever architecture
    
-   no premature abstraction
    
-   no unnecessary packages
    
-   small functions
    
-   typed interfaces
    
-   explicit error handling
    
-   readable names
    
-   minimal comments unless explaining non-obvious behavior
    
-   keep business logic separate from model-provider logic
    

### Python / FastAPI

-   type hints everywhere
    
-   Pydantic models for API contracts
    
-   service layer for business logic
    
-   repository/data-access layer if useful
    
-   never mix SQL calculations with LLM prompts
    
-   validate every external input
    
-   log provider/API failures safely
    

### TypeScript / Next.js

-   strict TypeScript
    
-   reusable UI components
    
-   server/client boundaries kept clear
    
-   no giant page components
    
-   centralized API client
    
-   loading/error/empty states designed deliberately
    

### Money

-   never use ordinary binary floating-point for authoritative financial values
    
-   use integer paisa or Decimal
    
-   all totals calculated deterministically
    

### AI

-   force structured output where possible
    
-   validate all model output
    
-   do not trust confidence values blindly
    
-   never let the model directly write authoritative balances
    
-   store raw source input/reference for auditability
    
-   keep provider-specific code behind an adapter
    

### Git

-   milestone-based branches/commits
    
-   commit after stable slices
    
-   no giant unreviewed final commit
    
-   tag stable demo checkpoints if useful
    

---

## 21\. UX / Writing Style

The product voice should be:

-   simple
    
-   calm
    
-   trustworthy
    
-   locally understandable
    
-   concise
    
-   non-technical
    

Avoid:

-   banking jargon
    
-   accounting jargon
    
-   exaggerated AI language
    
-   "approved"
    
-   "guaranteed"
    
-   "credit score"
    
-   "risk score" unless formally justified
    

Prefer:

-   "Karobaar understood..."
    
-   "Your recorded business data shows..."
    
-   "This program may be relevant..."
    
-   "You currently match..."
    
-   "The following evidence is still missing..."
    
-   "Review the official requirements before applying."
    

---

## 22\. Demo Strategy

The judges should understand the product in the first 30 seconds.

Recommended narrative:

> "Pakistan's smallest businesses already generate financial data every day. It just does not live in spreadsheets. It lives in voice, receipts, udhaar, and memory. Karobaar AI turns that everyday activity into verified financial evidence."

Then demonstrate:

```
```
Speak
→ Understand
→ Verify
→ Record
→ Ask
→ Become financially visible
→ See next financing step
→ Act
```
```

Do not start the demo with the architecture slide.

Start with a merchant story.

---

## 23\. Testing / Evaluation Dataset

Create a small real evaluation set.

### Voice

20–30 representative Urdu/Roman-Urdu statements.

Examples:

-   Ahmed ne 2500 ka maal udhaar liya.
    
-   Aaj 5000 ki cash sale hui.
    
-   Bilal ne apne 3000 rupay de diye.
    
-   Aaj bijli ka 12000 ka bill diya.
    

Expected fields:

-   event type
    
-   counterparty
    
-   amount
    
-   status
    

### Receipts

Use approximately 10 representative receipt images.

Track:

-   merchant extraction
    
-   total extraction
    
-   date extraction
    
-   transaction-type inference
    

### Report only measured results.

Never invent accuracy numbers.

---

## 24\. Failure Handling

The product must handle:

-   unclear audio
    
-   unsupported phrase
    
-   malformed model output
    
-   API timeout
    
-   missing API key
    
-   blurry receipt
    
-   duplicate transaction
    
-   invalid amount
    
-   unknown customer
    
-   customer with no balance
    
-   no financing match
    
-   incomplete financing requirement data
    

Failures should produce clear user-facing states instead of crashes.

---

## 25\. Judge / Technical Review Talking Points

If asked "Why AI?":

-   because the difficult input is unstructured human language and images
    
-   deterministic software would be better for the ledger itself
    

If asked "How do you trust the numbers?":

-   AI proposes structured events
    
-   merchant verifies them
    
-   deterministic backend stores them
    
-   totals come from the database, not from the LLM
    

If asked "Are you deciding who gets a loan?":

-   no
    
-   Karobaar organizes evidence and compares it with published requirements
    
-   final decisions remain with financial institutions
    

If asked "Why no heavy RAG/vector DB?":

-   the hackathon dataset is small and structured
    
-   deterministic requirement matching is more transparent and reliable
    
-   LLM is used for explanation, not to invent eligibility
    

If asked "Why voice?":

-   it removes form-filling and accounting knowledge from the merchant's workflow
    
-   it matches how many target users already communicate
    

---

## 26\. Development Tooling Context

Available:

-   Qoder Teams / hackathon credits
    
-   ChatGPT Plus / ChatGPT Desktop
    
-   GitHub
    
-   local IDE
    
-   optional design inspiration tooling / Dribbble MCP
    
-   optional Spline
    

Use AI coding tools as collaborators, not as architecture authorities.

For every milestone:

1.  inspect the existing repository first
    
2.  reason about the milestone
    
3.  propose the minimum implementation plan
    
4.  implement
    
5.  run/build/test
    
6.  review affected code
    
7.  fix defects
    
8.  report what changed
    
9.  stop before beginning the next milestone
    

The next milestone must not begin until the current exit criteria are met.

---

## 27\. Master Instruction for AI Coding Assistants

When working on this repository:

-   Read this file first.
    
-   Inspect the actual codebase before making assumptions.
    
-   Treat the project as a five-day hackathon build.
    
-   Optimize for a complete, reliable demo, not feature count.
    
-   Preserve the architecture:  
    `Capture → Understanding → Verification → Ledger → Intelligence → Action`.
    
-   Keep AI outside authoritative financial calculations.
    
-   Prefer deterministic logic when possible.
    
-   Do not add technologies merely because they are fashionable.
    
-   Do not silently expand the scope.
    
-   Do not rewrite working modules without a concrete reason.
    
-   Do not begin a later milestone before the current milestone passes its exit criteria.
    
-   Be explicit about assumptions and technical risks.
    
-   Use the simplest solution that preserves correctness, maintainability, and demo reliability.
    
-   After every implementation step, run relevant tests/build commands and report actual results.  
    """
    

path = Path("/mnt/data/KAROBAAR\_AI\_HACKATHON\_CONTEXT.md")  
path.write\_text(content, encoding="utf-8")  
print(f"Created {path}")

STDOUT/STDERR

```
Created /mnt/data/KAROBAAR\_AI\_HACKATHON\_CONTEXT.md
```

You should now stop thinking of this as “frontend, backend, AI, RAG” as separate things. With five days left, the correct approach is to build **one end-to-end product loop**, milestone by milestone, and only move forward when the previous loop is stable.

The organizers explicitly said the regional round evaluates the **working product and technical implementation**, not which tool you used.

mails

Their own training also emphasizes validation, code quality, precision, architectural clarity, and presenting a useful product rather than just generating code quickly.

step2 Spec Qoder-AI-Coding-Hand…

## The five milestones

### Milestone 1 — Foundation + product skeleton

**Day 1**

Do not begin with the fancy dashboard or RAG.

First make the entire project skeleton real:

```
```
Next.js frontend
        ↓
FastAPI backend
        ↓
SQLite
        ↓
AI provider adapter
```
```

The frontend should already contain the final navigation/screen structure, even if parts contain placeholder data:

1.  **Dashboard**
    
2.  **Record Transaction**
    
3.  **Ledger & Udhaar**
    
4.  **Ask Karobaar**
    
5.  **Financial Evidence & Readiness**
    

The reminder should be a modal/drawer, not another page.

For 3D, I would use **only one significant Spline scene**, preferably on the landing/dashboard hero. Something abstract like financial records/data blocks flowing into an organized network would fit the story very well. Do not put 3D objects everywhere. The reviewers will remember a polished first impression, but they will judge the product when you start clicking through it.

Your day-one exit criterion is simple:

> Frontend runs, backend runs, database works, provider selection works, pages exist, and at least one request travels frontend → backend → frontend.

---

### Milestone 2 — Voice/receipt → AI → verification

**Day 2**

This is where Karobaar actually becomes Karobaar.

You need this loop:

```
```
Speak Urdu
    ↓
Transcription
    ↓
Structured business event
    ↓
Review what AI understood
    ↓
Confirm/Edit
```
```

And the same basic idea for a receipt.

Nothing should enter the real ledger immediately after the LLM sees it.

The merchant must see:

> **Karobaar understood this**

Then:

```
```
Ahmed
Credit Sale
PKR 5,000
Outstanding
```
```

with **Confirm** and **Edit**.

This milestone is complete only when several real Urdu/Roman-Urdu phrases and several receipt images work reliably.

---

### Milestone 3 — Ledger + dashboard + Ask Karobaar

**Day 3**

This is the most important engineering milestone.

Once the merchant confirms an event, normal software takes over.

```
```
Confirmed transaction
        ↓
SQLite ledger
        ↓
Dashboard totals
        ↓
Customer balance
```
```

The AI must never calculate authoritative money values.

Then build **Ask Karobaar**, but keep it narrow.

Initially support only things such as:

> “Mera total udhaar kitna hai?”

> “Sab se zyada udhaar kis ke paas hai?”

> “Is mahine kitni sale hui?”

> “Pichlay mahine se sale barhi hai ya kam?”

The LLM identifies the intention, but backend functions query SQLite.

That distinction will make your technical architecture much stronger.

---

### Milestone 4 — Financial Evidence + Readiness + Action

**Day 4**

Now build the actual **Financial Inclusion** layer.

This is where you create the:

### Financial Evidence Passport

It might show:

```
```
Recorded history
6 months

Average monthly sales
PKR 410,000

Outstanding receivables
PKR 91,000

Transactions with supporting evidence
79%

Revenue pattern
Consistent
```
```

Then compare that evidence against only **3–5 verified financing programs**.

The system should say:

> “Your recorded evidence appears to meet these requirements.”

and:

> “These requirements are still missing.”

Not:

> “You qualify.”

Finally add your single action:

> “Ahmed ko reminder bana do.”

Karobaar fetches Ahmed's actual balance and creates a ready-to-copy message.

At the end of Day 4:

# Freeze features.

---

### Milestone 5 — Reliability + presentation

**Day 5**

No new modules.

Use the whole day for:

-   testing
    
-   fixing edge cases
    
-   better empty/error/loading states
    
-   mobile responsiveness
    
-   animations
    
-   Spline polish
    
-   deployment
    
-   demo data
    
-   README
    
-   architecture diagram
    
-   evaluation numbers
    
-   pitch rehearsal
    
-   backup video
    

This is where Qoder can be especially valuable for reviewing code, finding validation problems, and testing edge cases. That aligns closely with what their own lab emphasizes.

step2 Spec Qoder-AI-Coding-Hand…

---

# How I would divide the three-person team

You should work in parallel, but around **the same milestone**, not three disconnected mini-projects.

| Person | Primary ownership |
| --- | --- |
| **Person 1 — AI/Backend** | Groq/Alibaba adapter, transcription, Qwen extraction, validation services, Ask Karobaar tools |
| **Person 2 — Frontend/Integration** | design, Spline, capture UI, dashboard, ledger, integration, responsive behavior |
| **Person 3 — Product/Data/QA** | financing-program research, RAG/JSON data, matching rules, seed data, testing, UX copy, pitch |

The third person should not become “the guy doing slides.” Their financing data and test cases are a real part of the product.

---

# Frontend: what should actually exist?

I would **not** build ten dashboards.

You need roughly five product surfaces.

## 1\. Main Dashboard

This should be your premium visual page.

Top area:

> **Good evening, Ahmed. Here's your business today.**

Four strong metric cards:

-   Monthly Sales
    
-   Expenses
    
-   Outstanding Udhaar
    
-   Payments Recovered
    

Below that:

-   recent transactions
    
-   top outstanding customer
    
-   a small revenue/udhaar visual
    
-   big **Record Transaction** CTA
    

The 3D/Spline element belongs near the top of this screen or in a short landing hero before it.

---

## 2\. Record Transaction

Very little UI.

Two large actions:

> 🎤 Speak

> 📷 Scan Receipt

The microphone interaction itself should feel polished: pulse animation, waveform or activity state, transcription loading.

---

## 3\. Ledger & Udhaar

This is where reviewers can verify that it is not just a chatbot.

Show:

-   exact transactions
    
-   customer balances
    
-   filter by type
    
-   overdue amounts
    
-   source of transaction: voice / receipt
    

---

## 4\. Ask Karobaar

Chat-like interface, but grounded in backend tools.

Keep it focused on business data.

---

## 5\. Financial Evidence & Readiness

This is where you visually prove why the project belongs in **Financial Inclusion**.

Top:

**Financial Evidence Passport**

Bottom:

**Potential Financing Opportunities**

For each scheme:

```
```
3 requirements matched
2 requirements missing

View details
Official source
```
```

That is enough.

---

# About the landing page

You *can* build a visually impressive one-page landing entry, but keep it extremely short.

I would use:

```
```
Hero
↓
Problem statement
↓
Speak → Verify → Understand → Act
↓
Enter Demo
```
```

Do not spend half a day building:

-   testimonials
    
-   pricing
    
-   FAQ
    
-   company history
    
-   newsletter forms
    
-   generic startup sections
    

They will not help you win.

---

# Exact ChatGPT Desktop prompts

The best workflow is to put the context file I created into the repository and tell ChatGPT Desktop to **read it plus inspect the actual codebase**.

Then use one milestone prompt at a time.

Do not give it implementation details line by line. Let it reason from the architecture and exit criteria.

---

## Prompt 0 — Initial project audit

Use this **before Milestone 1**, particularly because you have some earlier partially generated code.

```
```
We are now entering the development phase of Karobaar AI for the Alibaba Cloud AI Hackathon Pakistan 2026.

First read the file KAROBAAR_AI_HACKATHON_CONTEXT.md in the root of this repository. Treat that file as the authoritative product, architecture, scope, UX, and engineering context for this project.

Before changing any code, inspect the complete existing repository and determine:

1. What has already been implemented.
2. What actually runs versus what is placeholder/mock code.
3. What is broken or incomplete.
4. Whether the current architecture conflicts with the architecture defined in the context file.
5. Which existing code should be preserved rather than rewritten.
6. The minimum technical work needed to complete Milestone 1.

Reason about the project yourself instead of blindly following old implementation assumptions.

Then produce a concise Milestone 1 execution plan, implement only Milestone 1, run all relevant build/test/startup checks, fix any defects you encounter, and report:

- files changed
- architecture decisions made
- tests/build checks performed
- actual results
- remaining risks

Do not begin Milestone 2. Stop when the Milestone 1 exit criteria defined in KAROBAAR_AI_HACKATHON_CONTEXT.md are satisfied.
```
```

---

# Prompt 1 — Milestone 2

```
```
Read KAROBAAR_AI_HACKATHON_CONTEXT.md again and inspect the current repository state.

Milestone 1 is considered complete. Your task is now to reason about, plan, implement, test, and stabilize only Milestone 2:

Capture → AI Understanding → Human Verification.

The milestone goal is that a merchant can speak an Urdu/Roman-Urdu transaction or upload a receipt, the backend can turn that input into a normalized business event, and the merchant can review/edit/confirm what the system understood before anything enters the authoritative ledger.

Use the existing provider-adapter architecture. Prefer the configured Alibaba provider when available and fall back to Groq when necessary. Do not tightly couple application code to either provider.

Focus on reliability, schema validation, understandable errors, loading states, and human-in-the-loop confirmation.

The UI should feel premium and extremely simple for a shopkeeper. Do not add unrelated dashboard or financing features during this milestone.

Before coding:
- inspect the existing implementation
- identify the simplest reliable approach
- define the data contracts and failure states

Then implement it fully.

Create representative tests for Urdu/Roman-Urdu voice inputs and receipt extraction. Run the application and relevant tests/build commands yourself.

Do not move to Milestone 3 until the Milestone 2 exit criteria in the context file are actually satisfied.

At the end, report what works, what was tested, measured limitations, and any technical debt created.
```
```

---

# Prompt 2 — Milestone 3

```
```
Read KAROBAAR_AI_HACKATHON_CONTEXT.md and inspect the completed Milestone 2 implementation.

Now complete only Milestone 3:

Verified Business Event → Deterministic Ledger → Dashboard → Ask Karobaar.

Think through the implementation before changing code.

The authoritative financial state must be deterministic. AI may interpret user intent, but it must never invent or calculate authoritative balances.

Design the simplest maintainable SQLite data model that supports the hackathon scope. Use safe financial arithmetic according to the project context.

Implement:
- persistence for confirmed business events
- exact ledger calculations
- customer udhaar balances
- recent transaction history
- dashboard metrics
- a small supported set of Ask Karobaar business questions

For Ask Karobaar, use tool/function-style backend operations so the LLM identifies the requested operation and the backend queries the database. The LLM may format/explain the answer, but the numeric value must come from deterministic code.

Polish the five-screen application structure defined in the context file, but do not begin the Financial Evidence or Financing Readiness implementation yet.

Test normal cases and financial edge cases, including duplicate transactions, payments, zero balances, unknown customers, invalid amounts, and model failures.

Do not proceed to Milestone 4 until the complete flow works reliably:

voice/receipt → extraction → confirmation → database → dashboard update → database-grounded business question.

Stop after verification and report the implementation and test results.
```
```

---

# Prompt 3 — Milestone 4

```
```
Read KAROBAAR_AI_HACKATHON_CONTEXT.md and inspect the stable Milestone 3 system.

Now reason about and implement only Milestone 4:

Financial Evidence Passport → Financing Readiness → Reminder Action.

This milestone is what makes Karobaar AI a Financial Inclusion product instead of merely an AI ledger.

Use only real, structured evidence derived from the deterministic ledger.

Build a Financial Evidence Passport that communicates explainable business evidence without generating a numeric credit score.

Create a small financing-program knowledge base using 3–5 verified programs. Keep it transparent and structured. Use deterministic matching for requirements wherever possible, and use the LLM only to explain the result naturally.

Every financing result must clearly distinguish:
- evidence already present
- missing evidence
- next action
- official source

The system must never claim loan approval or guaranteed eligibility.

Then implement exactly one agentic/action flow:

“Ahmed ko reminder bana do.”

The application must:
1. identify the customer
2. query the real outstanding amount from the ledger
3. generate a polite Urdu/Roman-Urdu reminder using that exact amount
4. display it as an editable/copyable draft

Do not integrate production WhatsApp/SMS APIs.

Review the final UX across the Financial Evidence/Readiness screen and reminder interaction. Make it understandable to a non-technical merchant and defensible to a financial-services judge.

Test the complete feature against realistic demo data.

At the end of this milestone, enforce FEATURE FREEZE. Do not implement anything from the roadmap.

Report what is complete, what was tested, and any remaining limitations.
```
```

---

# Prompt 4 — Milestone 5

```
```
Read KAROBAAR_AI_HACKATHON_CONTEXT.md and treat the product feature set as frozen.

Do not add new product capabilities.

Your task is to turn the existing Karobaar AI implementation into a reliable, professional hackathon submission.

First audit the complete system end-to-end and identify:
- functional bugs
- inconsistent UI
- weak loading/error/empty states
- AI failure modes
- financial-calculation risks
- security/privacy issues relevant to the demo
- unnecessary complexity
- mobile/responsive problems
- latency problems
- demo-breaking dependencies

Then systematically improve reliability and polish.

Prioritize:
1. correctness
2. graceful failure
3. financial precision
4. AI output validation
5. responsive UX
6. visual polish
7. accessibility basics
8. deployment stability

Review the Spline/3D usage and animations. Keep only visual effects that improve the premium fintech impression without slowing or distracting from the product.

Create or improve:
- representative AI evaluation cases
- backend/unit tests where valuable
- end-to-end smoke checks
- demo/reset seed data
- clear README/run instructions
- architecture documentation
- environment configuration documentation

Run production frontend and backend builds/tests and fix actual failures.

Finally produce a launch checklist describing exactly how the team should demo, reset, deploy, and recover if an API/network dependency fails.

Do not implement anything outside the frozen scope.
```
```

---

# Optional dedicated frontend prompt

If one team member is working almost entirely on design, give ChatGPT Desktop/Qoder this separately while the backend person works.

```
```
Read KAROBAAR_AI_HACKATHON_CONTEXT.md and inspect the current frontend.

Act as a senior fintech product designer and frontend engineer.

Do not redesign the product architecture or add features.

Create a professional, premium visual system for Karobaar AI suitable for an Alibaba Cloud AI Hackathon judging environment.

The target user is a Pakistani micro/small merchant, so visual sophistication must not create interaction complexity.

The final app should have these core surfaces:
- Dashboard
- Record Transaction
- Ledger & Udhaar
- Ask Karobaar
- Financial Evidence & Readiness

Design principles:
- premium modern fintech feel
- excellent typography and spacing
- strong metric hierarchy
- very clear primary actions
- minimal cognitive load
- responsive desktop/mobile layouts
- polished loading/error/empty states
- subtle motion and hover states
- accessible contrast
- restrained use of gradients

Use one primary Spline/3D scene at most, preferably in the hero/dashboard entry experience. It should support the concept of fragmented financial activity becoming structured intelligence. Do not use 3D decoration across every screen.

If Dribbble/design-reference tooling is available, use it only for visual inspiration and derive an original design system rather than copying a design.

Before modifying files, inspect the current components and preserve working application logic.

Then implement the design system and polish incrementally while continuously running the frontend build.

Do not alter backend business logic or add product scope.
```
```

---

# How to use Qoder vs ChatGPT Desktop

I would use them slightly differently.

**ChatGPT Desktop** should be your senior engineer/architect sitting over the entire repository: understanding the project, reasoning about modules, reviewing designs, debugging larger issues, and doing milestone-level work.

**Qoder** should be aggressive at codebase-local work:

-   targeted implementation
    
-   changing multiple related files
    
-   finding usages
    
-   fixing tests
    
-   explaining unfamiliar code
    
-   reviewing diffs
    
-   cleaning implementation problems
    

And because the organizers' own Qoder guide encourages code review and architecture comprehension—not merely code generation—you should actually run a serious review after Milestone 4 rather than burning all the credits on initial code generation.

step2 Spec Qoder-AI-Coding-Hand…

---

# One important adjustment to your five-day schedule

Do **not** give one person “frontend for five days,” one “backend for five days,” and one “RAG for five days.”

Instead, every day has one common milestone.

For example, on Day 2:

```
```
AI person:
transcription + extraction

Frontend person:
recording + review/confirmation UI

Product/data person:
test phrases + expected JSON + receipt dataset
```
```

All three outputs meet at the same milestone.

That prevents the classic hackathon disaster where everyone finishes their own component on Day 5 and integration starts six hours before submission.

---

# The context file

I created the master Markdown file specifically for this workflow. It contains the product definition, architecture, five milestones, team responsibilities, technical stack, AI rules, frontend structure, Financial Readiness definition, coding standards, design direction, testing expectations, out-of-scope list, and instructions for AI coding assistants.

Download **KAROBAAR\_AI\_HACKATHON\_CONTEXT.md**

Put it in the **root of your project repository**. Then every new ChatGPT/Qoder session can begin by reading that file rather than depending on a huge prompt or the model remembering earlier conversations.

KAROBAAR\_AI\_HACKATHON\_CONTEXT.mdDocumentOpen file

Sources

You: 

You have to give me all of the milestone prompts again, because we are starting everything from scratch. Forget the previous implementation, as that was a complete fail, and that had no meaning. Now we have to start everything from zero. And now tell me that can I use the Markdown MD file as it is, or do I need a new Markdown file? If that's a yes, craft a new Markdown file. If that's a no, that's fine. I will use the previous Markdown file. Other than this, give me the updated milestone prompts all the way from prompt zero till how many milestones you think we should be creating. also, add one prompt that includes all of the things that we will be building, and do not write it in an instructing way, rather write it in a storytelling way that ChatGPT can reason and think itself. Just tell it the perceptions that we are having, like the deadlines, the suggestions, the limitations, the tech stack, and the requirements that we are hoping to build, so that it can build a context of its own and reason on its own.

ChatGPT: 

Analyzed

```
Python

```
frompathlibimportPathcontent=r"""# KAROBAAR AI — FROM-SCRATCH HACKATHON BUILD CONTEXT

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
```

Cross-cutting trust:

```
```
Consent • Explainability • Human confirmation • Sources
Not a credit score • Not a lending decision
```
```

---

## Product Flow

The intended judge/demo flow is:

1.  Merchant speaks a transaction in Urdu / Roman Urdu.
    
2.  System transcribes and extracts a structured business event.
    
3.  Merchant sees what Karobaar understood.
    
4.  Merchant confirms or edits it.
    
5.  Confirmed event enters the deterministic ledger.
    
6.  Dashboard updates.
    
7.  Merchant asks a business question.
    
8.  System answers using real ledger data.
    
9.  Merchant opens the Financial Evidence Passport.
    
10.  System compares real business evidence against published financing-program requirements.
    
11.  System shows matched evidence, missing evidence, and source.
    
12.  Merchant asks for a payment reminder.
    
13.  System retrieves the real outstanding balance and drafts the reminder.
    

---

## Supported Business Events

Keep the hackathon scope narrow.

Initial event types:

-   `cash_sale`
    
-   `credit_sale`
    
-   `payment_received`
    
-   `expense`
    

Recommended normalized event fields:

```
JSON

```
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
```

Authoritative monetary values should not use ordinary binary floating point.

Use integer paisa or fixed precision decimal arithmetic.

---

## AI Responsibilities

AI may:

-   transcribe Urdu / Roman Urdu voice
    
-   understand transaction intent
    
-   extract structured fields
    
-   understand receipt images
    
-   interpret business questions
    
-   explain financing matches
    
-   draft reminder messages
    

AI must not:

-   calculate authoritative ledger balances
    
-   invent totals
    
-   silently save uncertain transactions
    
-   create a fake credit score
    
-   approve loans
    
-   claim guaranteed eligibility
    
-   guess missing business facts
    
-   overwrite verified records without user action
    

---

## Deterministic Responsibilities

Normal application code / database logic should own:

-   ledger storage
    
-   customer balances
    
-   sales totals
    
-   expenses
    
-   outstanding udhaar
    
-   payment recovery
    
-   date comparisons
    
-   dashboard calculations
    
-   evidence metrics
    
-   financing requirement matching where direct rules are possible
    

---

## Financial Evidence Passport

This is a qualitative and explainable business evidence profile.

Possible fields:

-   recorded business history
    
-   recorded sales
    
-   average monthly sales
    
-   outstanding receivables
    
-   payment recovery pattern
    
-   percentage of transactions with supporting evidence
    
-   revenue consistency
    
-   customer concentration
    
-   documentation gaps
    

Do not create an unsupported numeric credit score.

---

## Financial Readiness

Financial Readiness means:

```
```
Verified merchant evidence
            +
Published financing requirements
            ↓
Matched requirements
Missing requirements
Relevant next step
Official source
```
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

-   program name
    
-   provider
    
-   target user
    
-   purpose
    
-   published eligibility requirements
    
-   financing range where officially published
    
-   required documents
    
-   official source URL
    
-   last verified date
    
-   deterministic matching hints
    

Prefer official / first-party sources.

---

## User-Facing Product Surfaces

Build approximately five core screens.

### 1\. Dashboard

Show:

-   monthly sales
    
-   expenses
    
-   outstanding udhaar
    
-   payments recovered
    
-   top debtor / overdue customer
    
-   recent activity
    
-   clear CTA to record a transaction
    

### 2\. Record Transaction

Two primary actions:

-   Speak
    
-   Scan / upload receipt
    

Also show:

-   recording state
    
-   transcription / extraction state
    
-   "Karobaar understood this" review card
    
-   Confirm / Edit / Reject
    

### 3\. Ledger & Udhaar

Show:

-   recent transactions
    
-   customer balances
    
-   transaction type
    
-   source
    
-   outstanding amounts
    
-   overdue amounts
    

### 4\. Ask Karobaar

Support only a few reliable questions initially:

-   total outstanding
    
-   top debtor
    
-   monthly sales
    
-   month-over-month sales comparison
    

The model interprets intent; backend functions query the database.

### 5\. Financial Evidence & Readiness

Combine:

-   Financial Evidence Passport
    
-   financing-program comparison
    
-   matched evidence
    
-   missing evidence
    
-   next step
    
-   official source
    

The payment reminder may appear as a modal or drawer rather than a separate page.

---

## Visual Direction

The application should feel like a serious modern fintech product, not a student dashboard.

Desired qualities:

-   premium
    
-   trustworthy
    
-   minimal
    
-   spacious
    
-   responsive
    
-   clear
    
-   polished
    
-   low cognitive load
    
-   good typography
    
-   strong visual hierarchy
    

### 3D / Spline

Use at most one major Spline / 3D visual.

Best locations:

-   hero / entry area
    
-   top of dashboard
    

The visual should support the concept of fragmented business activity becoming structured financial intelligence.

Do not put heavy 3D on every page.

### Motion

Use restrained motion:

-   hover elevation
    
-   subtle transitions
    
-   animated metric changes
    
-   microphone pulse
    
-   progress states
    
-   skeleton loaders
    
-   confirmation transitions
    

Do not sacrifice performance or reliability for decoration.

---

## Optional Landing / Entry Experience

If time allows, the product may open with a short entry experience:

1.  Hero
    
2.  One-line problem
    
3.  Speak → Verify → Understand → Act
    
4.  Enter Demo
    

Do not spend major development time on marketing sections.

The product itself is the demonstration.

---

## Technical Stack

### Frontend

-   Next.js
    
-   TypeScript
    
-   Tailwind CSS
    
-   Browser MediaRecorder API
    
-   Browser file/image upload
    
-   optional Spline
    
-   optional small animation library only if justified
    

### Backend

-   FastAPI
    
-   Python
    
-   Pydantic
    
-   REST API
    

### Database

-   SQLite for hackathon
    

Optional:

-   Supabase only if remote persistence becomes necessary
    

### AI Provider Strategy

The product should support a provider adapter.

Desired behavior:

```
```
Alibaba configured?
    → Alibaba Cloud Model Studio / Qwen
else
Groq configured?
    → Groq fallback
else
    → clear setup/demo mode
```
```

Internal capabilities should look approximately like:

```
```
transcribe_audio()
extract_event_from_text()
extract_event_from_image()
interpret_business_question()
draft_reminder()
summarize_financing_match()
```
```

Application business logic should not depend directly on one provider.

### Deployment

-   Vercel for frontend
    
-   Render or Railway for FastAPI
    
-   GitHub for source control
    

---

## Team Structure

### Person 1 — AI / Backend Lead

Owns:

-   provider adapter
    
-   transcription
    
-   extraction
    
-   AI output validation
    
-   business-question interpretation
    
-   reminder drafting
    
-   AI test/evaluation work
    

### Person 2 — Frontend / Integration Lead

Owns:

-   design system
    
-   responsive UI
    
-   optional Spline
    
-   capture interface
    
-   review / confirm interface
    
-   dashboard
    
-   ledger
    
-   API integration
    
-   deployment
    

### Person 3 — Product / Data / QA Lead

Owns:

-   financing-program research
    
-   financing dataset
    
-   matching rules
    
-   test data
    
-   seed data
    
-   Financial Evidence Passport wording
    
-   UX copy
    
-   QA
    
-   documentation
    
-   pitch / demo narrative
    

Everyone should work toward the same milestone each day rather than three isolated workstreams.

---

## Five Development Milestones

### Milestone 0 — Product & Architecture Bootstrap

Purpose:

Create a clean repository and prove the basic application shape.

Expected outcomes:

-   fresh repository structure
    
-   Next.js frontend
    
-   FastAPI backend
    
-   SQLite connection
    
-   environment configuration
    
-   AI provider adapter interface
    
-   final screen skeleton
    
-   frontend ↔ backend connectivity
    
-   seed/demo data strategy
    
-   basic README
    
-   Git initialized
    

Exit condition:

The system runs cleanly and there is no architectural ambiguity before feature development begins.

---

### Milestone 1 — Capture, AI Understanding, Verification

Purpose:

Turn messy voice or receipt input into a structured event that the merchant can verify.

Expected outcomes:

-   microphone recording
    
-   audio upload
    
-   speech transcription
    
-   text → structured business event
    
-   receipt upload
    
-   receipt → structured business event
    
-   Pydantic validation
    
-   edit / confirm / reject flow
    
-   low-confidence / malformed-output handling
    
-   representative test inputs
    

Exit condition:

Several Urdu / Roman Urdu inputs and receipt examples work, and uncertain input cannot silently enter the ledger.

---

### Milestone 2 — Ledger, Dashboard, Udhaar

Purpose:

Make the system financially real.

Expected outcomes:

-   deterministic business-event persistence
    
-   safe money handling
    
-   customer balances
    
-   exact totals
    
-   recent transactions
    
-   dashboard metrics
    
-   basic overdue / udhaar visibility
    

Exit condition:

A confirmed transaction changes the actual stored ledger and the dashboard reflects the exact result.

---

### Milestone 3 — Ask Karobaar

Purpose:

Make the verified ledger conversational without letting AI invent financial numbers.

Expected outcomes:

-   small set of supported business questions
    
-   intent/tool selection
    
-   backend functions / database queries
    
-   exact answers sourced from ledger
    
-   natural Urdu / Roman Urdu explanations
    
-   graceful unsupported-question state
    

Exit condition:

The user can ask several predefined business questions and receive accurate database-grounded answers.

---

### Milestone 4 — Financial Evidence, Readiness, Action

Purpose:

Prove the Financial Inclusion value proposition.

Expected outcomes:

-   Financial Evidence Passport
    
-   3–5 real financing programs
    
-   structured eligibility requirements
    
-   matched evidence
    
-   missing evidence
    
-   official sources
    
-   next-step guidance
    
-   reminder intent
    
-   exact debtor lookup
    
-   editable payment-reminder draft
    

Exit condition:

The user can understand their financial evidence, see why a financing program may be relevant, understand what is missing, and draft a reminder from actual ledger data.

At this point:

**Feature freeze.**

---

### Milestone 5 — Reliability, Polish, Deployment, Demo

Purpose:

Turn the product into a robust submission.

Expected outcomes:

-   full code review
    
-   financial-calculation checks
    
-   error handling
    
-   AI malformed-output handling
    
-   duplicate handling
    
-   missing-customer handling
    
-   provider-failure handling
    
-   responsive polish
    
-   visual polish
    
-   Spline optimization
    
-   accessibility basics
    
-   production builds
    
-   deployment
    
-   resettable demo data
    
-   representative AI evaluation cases
    
-   documentation
    
-   architecture diagram
    
-   backup demo path
    
-   final pitch/demo flow
    

No new product features.

---

## Explicitly Out of Scope

Do not build during this hackathon:

-   authentication
    
-   multi-shop accounts
    
-   advanced role management
    
-   full accounting system
    
-   inventory
    
-   POS
    
-   payroll
    
-   CRM
    
-   real bank integrations
    
-   KYC engine
    
-   loan underwriting
    
-   credit scoring
    
-   production WhatsApp sending
    
-   production SMS sending
    
-   native mobile apps
    
-   microservices
    
-   Kafka
    
-   Kubernetes
    
-   large vector databases
    
-   multi-agent orchestration
    
-   model training
    
-   many regional languages
    
-   dozens of financing programs
    

---

## Coding Standards

### General

-   simple architecture
    
-   clear separation of concerns
    
-   small readable functions
    
-   typed interfaces
    
-   explicit error handling
    
-   no unnecessary abstractions
    
-   no trendy technology without a concrete need
    
-   no hidden feature expansion
    

### Python / FastAPI

-   type hints
    
-   Pydantic models
    
-   explicit API contracts
    
-   separate model-provider logic from business logic
    
-   deterministic financial calculations
    
-   validated external inputs
    
-   safe failure handling
    

### TypeScript / Next.js

-   strict TypeScript
    
-   reusable components
    
-   centralized API calls
    
-   deliberate loading / empty / error states
    
-   no huge monolithic page components
    
-   responsive layouts
    

### Money

-   integer paisa or Decimal
    
-   no authoritative financial values stored/calculated with ordinary floating point
    

### AI

-   structured output where possible
    
-   validate every model output
    
-   never trust model-generated balances
    
-   preserve source/raw input for traceability
    
-   isolate provider-specific code behind adapter
    
-   keep prompts versionable / centralized where practical
    

### Git

-   milestone-oriented commits
    
-   frequent stable commits
    
-   no massive unreviewed final commit
    
-   tag stable checkpoints if useful
    

---

## UX Language

Tone:

-   simple
    
-   respectful
    
-   trustworthy
    
-   concise
    
-   locally understandable
    

Prefer:

-   "Karobaar understood..."
    
-   "Your recorded business data shows..."
    
-   "This financing option may be relevant..."
    
-   "You currently appear to match..."
    
-   "The following evidence is still missing..."
    

Avoid:

-   "Approved"
    
-   "Guaranteed"
    
-   unsupported "credit score"
    
-   unsupported "risk score"
    
-   unnecessary banking/accounting terminology
    

---

## Evaluation / Testing

Create a small representative evaluation set.

### Voice

Target:

-   20–30 Urdu / Roman Urdu business statements
    

Examples:

-   Ahmed ne 2500 ka maal udhaar liya.
    
-   Aaj 5000 ki cash sale hui.
    
-   Bilal ne apne 3000 rupay de diye.
    
-   Aaj bijli ka 12000 ka bill diya.
    

Track extraction quality for:

-   event type
    
-   counterparty
    
-   amount
    
-   status
    

### Receipts

Target:

-   around 10 representative receipt images
    

Track:

-   merchant
    
-   total
    
-   date
    
-   type
    

Only report measured accuracy.

Do not invent metrics.

---

## Demo Definition of Done

The project is strong enough when this exact flow works:

1.  Open Karobaar AI.
    
2.  Speak an Urdu transaction.
    
3.  See transcription.
    
4.  See structured extraction.
    
5.  Confirm it.
    
6.  See ledger update.
    
7.  See dashboard update.
    
8.  Ask a business question.
    
9.  Receive an exact database-grounded answer.
    
10.  Open Financial Evidence Passport.
    
11.  View a real financing-program comparison.
    
12.  See matched and missing evidence.
    
13.  Ask Karobaar to draft a debtor reminder.
    
14.  Receive an accurate ready-to-copy message.
    

If this works smoothly, stop adding features.

---

## AI Coding Assistant Working Style

When an AI coding assistant works on this repository:

1.  Read this context file first.
    
2.  Inspect the actual repository before deciding anything.
    
3.  Reason about the current milestone.
    
4.  Prefer the smallest reliable implementation.
    
5.  Do not assume earlier code exists.
    
6.  Do not add features outside the active milestone.
    
7.  Run builds/tests after implementation.
    
8.  Fix actual failures before reporting completion.
    
9.  Explain tradeoffs and risks.
    
10.  Stop at the milestone boundary.
    

The assistant should act as a senior product engineer and technical partner, not as a blind code generator.

"""

path = Path("/mnt/data/KAROBAAR\_AI\_FROM\_SCRATCH\_CONTEXT.md")  
path.write\_text(content, encoding="utf-8")  
print(path)

STDOUT/STDERR

```
/mnt/data/KAROBAAR\_AI\_FROM\_SCRATCH\_CONTEXT.md
```

Yes, use a **new Markdown file**.

The previous one still carried some assumptions from the failed implementation, so for a clean restart it is better to remove that ambiguity entirely. I created a fresh from-scratch version for you:

Download the new Karobaar AI from-scratch context file

Put that file in the **root of the new project folder** and let every coding session read it first.

I would use **Prompt 0 + 6 milestones**. That gives you enough separation to stop models from trying to build the entire product in one giant pass.

---

# Storytelling Context Prompt

Use this before any implementation prompt. This one is intentionally written as context rather than commands.

```
```
We are building a project called Karobaar AI for the Financial Inclusion track of the Alibaba Cloud AI Hackathon Pakistan 2026.

We are starting from a completely empty repository. There is no previous implementation worth preserving, so this should be treated as a clean product and engineering exercise from first principles.

There are three people on the team and roughly five development days available. The regional evaluation will focus on what actually works, the technical quality of the implementation, and whether the product solves the stated problem. Because of the short window, breadth is less important than having one complete, reliable, convincing workflow.

The problem we are interested in is that many Pakistani micro and small merchants conduct legitimate business but their financial history is poorly structured. Transactions may live in spoken conversations, udhaar registers, receipts, memory, and informal notes. The merchant understands something like “Ahmed ne aaj 5 hazaar ka maal udhaar liya,” while financial systems need a structured record with a customer, transaction type, amount, date, and status.

Our perception of Karobaar AI is that the merchant should not need to become an accountant in order to create useful financial records.

We imagine the user speaking an Urdu or Roman-Urdu transaction or showing the system a receipt. AI helps understand that messy input, but before the information becomes authoritative, the merchant should see what the system understood and be able to confirm or correct it.

Once confirmed, the event belongs to a deterministic financial ledger. We specifically do not want an LLM inventing balances, calculating authoritative totals, or acting as the accounting system. Sales, expenses, udhaar, payments, customer balances, and dashboard metrics should come from ordinary application logic and the database.

On top of that trusted ledger, we want Karobaar to become useful rather than merely storing records. A merchant should be able to ask simple questions such as how much total udhaar is outstanding, who owes the most money, how much was sold this month, or how this month compares with last month. The AI may interpret the question and explain the answer, but the numeric answer should originate from deterministic backend queries.

A larger financial-inclusion idea sits above this. Over time, the verified ledger can become a Financial Evidence Passport showing things like recorded business history, sales consistency, receivables, payment recovery, and documentation coverage. We do not want to invent a credit score.

We also want to compare this real business evidence against a small number of genuine Pakistani financing programs. The system should be able to explain which published requirements appear to be supported by the merchant's records, which requirements are still missing, and what the merchant's next step could be. This is financial readiness guidance, not lending approval. The product must never claim that someone has been approved or guaranteed eligible.

A final action we want to demonstrate is a simple payment-reminder flow. If the merchant asks for a reminder for Ahmed, the system should look up Ahmed's actual outstanding balance and draft a polite Urdu or Roman-Urdu reminder using that real amount. For the hackathon, displaying an editable ready-to-copy message is enough; live WhatsApp or SMS sending is not necessary.

The experience should feel like a serious modern fintech product rather than a student dashboard. We expect approximately five main product surfaces: a dashboard, transaction capture and verification, ledger and udhaar view, Ask Karobaar, and Financial Evidence / Financing Readiness. A reminder can appear as a modal or drawer.

The frontend is expected to use Next.js, TypeScript, and Tailwind CSS. We may use one restrained Spline or 3D experience around the hero or dashboard to create a premium first impression, but visual decoration should never make the live product fragile or slow.

The backend is expected to use FastAPI, Python, Pydantic, and SQLite for the hackathon. Money should be handled with integer paisa or fixed precision rather than ordinary floating point.

For AI, we want a provider-independent architecture. Alibaba Cloud Model Studio with Qwen is the intended primary provider when credentials are available. Groq should serve as a fallback where appropriate. Provider-specific code should stay behind one adapter rather than leaking across the application.

We have Qoder Teams with hackathon credits and a ChatGPT Plus account. These are development tools rather than runtime product requirements.

We care about clean architecture, maintainability, explicit validation, understandable failure states, financial correctness, human verification, and a highly reliable final demo.

Things such as authentication, inventory, POS, payroll, CRM, microservices, production WhatsApp integration, bank APIs, KYC, real underwriting, credit scoring, large vector databases, multi-agent systems, custom model training, and dozens of financing programs are outside the intended hackathon scope.

The file KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md in this repository contains the detailed product and engineering context.

Use this situation to build your own understanding of the project before suggesting architecture or implementation decisions. Challenge unnecessary complexity and prefer the smallest architecture that can convincingly deliver the complete product story within the available time.
```
```

---

# Prompt 0 — Architecture and Repository Bootstrap

This is the first coding prompt.

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and use it together with the project situation already described in this conversation.

The repository is empty and the project is beginning from zero.

Before writing code, reason about what the smallest coherent architecture should look like for this five-day hackathon build.

Think specifically about:
- frontend/backend boundaries
- API contracts
- database structure
- where deterministic logic belongs
- where AI belongs
- provider abstraction
- financial precision
- validation
- folder organization
- deployment implications
- what would make later milestones easy rather than painful

Avoid architecture that is impressive only on paper.

Once you have formed that design, create the initial repository and implement the technical foundation needed for the future milestones.

The foundation should establish the final project shape without pretending that unfinished features already exist.

It should be possible to run the frontend and backend locally, verify frontend-to-backend communication, connect to the database, understand which AI provider is configured, and navigate through the intended product screen shell.

Create useful environment examples and development documentation.

Run the relevant installation, type-check, build, backend-startup, and connectivity checks yourself and resolve failures.

When the foundation is truly stable, summarize:
- the architecture chosen and why
- project structure
- important contracts
- tests/checks actually performed
- unresolved risks

Do not begin transaction capture or AI extraction yet.
```
```

### Prompt 0 exit condition

You should have:

```
```
Fresh repository
Next.js
FastAPI
SQLite
Provider abstraction
Environment setup
Navigation/screen skeleton
Frontend ↔ backend connectivity
Clean build
```
```

Nothing more.

---

# Milestone 1 — Voice + Receipt Capture and AI Understanding

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and inspect the repository produced by the previous milestone.

The foundation is stable.

The next product question is whether Karobaar can successfully understand the way the target merchant naturally expresses business activity.

Consider the merchant who says:

“Ahmed ne aaj 5 hazaar ka maal udhaar liya.”

or takes a photograph of an ordinary business receipt.

Think through the complete journey from that raw input to a normalized proposed business event.

The experience should not treat an LLM response as authoritative. The merchant needs to see what Karobaar believes happened and have an opportunity to correct it before the record becomes trusted.

Design and implement the minimum reliable capture and understanding system around that principle.

The result should account for:
- browser voice recording
- audio transport
- transcription
- Urdu / Roman-Urdu understanding
- structured extraction
- receipt upload
- image understanding
- normalized business-event schema
- validation
- malformed model output
- low-confidence situations
- loading/error states
- review/edit/confirm/reject UX

Provider-specific AI logic should remain behind the existing adapter.

A merchant should not be forced to fill an accounting form before speaking. The interface should feel extremely simple and premium.

Use representative examples rather than assuming that one successful sentence proves the system works.

Run the system, test it with several realistic transaction phrases and receipt examples, and verify that bad or ambiguous input cannot silently become a trusted transaction.

Stop when the capture → understand → review loop is dependable.

Do not implement the authoritative ledger yet.

At the end, explain what was built, what cases were tested, where the AI still struggles, and whether the milestone exit criteria are genuinely satisfied.
```
```

### Exit condition

```
```
Voice works
Receipt works
Structured event produced
Merchant can edit
Merchant can confirm/reject
Bad AI output handled safely
No authoritative ledger yet
```
```

---

# Milestone 2 — Deterministic Ledger + Udhaar + Dashboard

This is probably the most important milestone technically.

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and inspect the completed capture and verification flow.

The next question is what happens after a merchant confirms that Karobaar understood the transaction correctly.

From that point onward, treat the information as financial data rather than an AI conversation.

Think carefully about the simplest deterministic ledger model that can support the intended hackathon product.

The product only needs to understand a focused set of events such as:
- cash sale
- credit sale
- payment received
- expense

The financial system should be able to answer questions about sales, expenses, customer balances, recovered payments, and outstanding udhaar without asking the LLM to calculate those values.

Design and implement this trusted financial core.

Pay special attention to:
- exact money representation
- event persistence
- transaction dates
- customer identity
- credit sales
- repayments
- customer outstanding balance
- invalid or impossible payments
- duplicate records
- transaction history
- dashboard metrics
- overdue / outstanding visibility

The dashboard should now become a real product screen rather than a placeholder.

Aim for a polished fintech interface with a small number of meaningful cards and views rather than many charts.

The core dashboard should make the business situation understandable within seconds.

Any animations should enhance comprehension, not obscure it.

Test the ledger with explicit expected values and ensure the database, not an LLM, determines every authoritative financial number.

Run full frontend/backend builds and relevant tests.

Do not begin Ask Karobaar or financing-readiness work until the complete flow below works reliably:

voice or receipt
→ proposed event
→ human confirmation
→ database
→ correct customer balance
→ correct dashboard update

At completion, report the database model, financial rules, tests performed, and known limitations.
```
```

### Exit condition

A reviewer can see:

> “I spoke a transaction. It became a verified financial record. The numbers actually changed correctly.”

That is a huge milestone.

---

# Milestone 3 — Ask Karobaar

Keep this separate because this is where you demonstrate proper agent/tool architecture.

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and inspect the trusted ledger and dashboard now available.

Karobaar has financial memory, but the target merchant should not need to navigate analytics screens or understand accounting terminology to interrogate it.

The next experience is conversational access to the business itself.

Imagine the merchant asking in Urdu or Roman Urdu:

“Mera total udhaar kitna hai?”

“Sabse zyada paisay kis ne dene hain?”

“Is mahine kitni sale hui?”

“Pichlay mahine ke muqablay mein sale kesi hai?”

Think about how to support this without turning the product into an open-ended chatbot and without allowing the language model to invent financial answers.

Design the smallest reliable business-question architecture.

The intended pattern is that AI helps interpret what operation the merchant wants, while deterministic backend functions query the actual ledger and calculate the answer.

Start with only a small number of supported business questions that can be demonstrated perfectly.

Consider:
- tool/function definitions
- intent extraction
- database query boundaries
- unsupported questions
- missing data
- Urdu/Roman-Urdu responses
- exact numeric grounding
- traceability of returned values

Build a polished Ask Karobaar interface that fits naturally with the rest of the application.

The user should feel they are talking to their business data, not to a generic chatbot.

Test each supported question against ledger states where the expected answer is known in advance.

Do not implement financing readiness during this milestone.

Stop when the supported questions reliably return exact database-grounded answers.

Report which questions are supported, how tool selection works, how hallucinated numbers are prevented, and what remains intentionally unsupported.
```
```

### Exit condition

This works:

```
```
Merchant question
→ AI understands intent
→ deterministic tool/query
→ exact data
→ understandable response
```
```

---

# Milestone 4 — Financial Evidence Passport + Financial Readiness

This is the most important product milestone for the **Financial Inclusion** track.

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and inspect the current trusted ledger and Ask Karobaar implementation.

The product now records and understands a merchant's business activity.

The next question is how that history can become useful financial evidence rather than merely an internal ledger.

Imagine a merchant who has been building a real record of sales, receivables, payments, business continuity, and supporting receipts.

At the same time, genuine financing programs in Pakistan publish requirements about the businesses or individuals they are intended for.

We want Karobaar to help the merchant understand the relationship between those two worlds.

Reason about a responsible and technically defensible Financial Evidence Passport and Financial Readiness experience.

The evidence profile should only display things that can actually be derived from verified records.

It should not create an unsupported credit score or pretend to be an official banking identity.

For financing opportunities, work with only a small number of genuine Pakistani programs using verified first-party or authoritative source information.

Think about whether each requirement is:
- deterministically measurable from Karobaar's data
- manually supplied/document-based
- unknown

The product should communicate:
- what evidence the merchant already has
- which published requirements appear to match
- what evidence or requirement remains missing
- what reasonable next step the merchant can take
- where the official requirement came from

Do not allow language such as:
“You are approved.”
“You will receive the loan.”
“You are guaranteed eligible.”

Prefer:
“Your recorded evidence appears to meet this requirement.”

Use a simple structured financing dataset if that is more transparent than a vector database.

Build the Financial Evidence & Readiness screen as one of the strongest visual moments in the application.

The result should explain why Karobaar belongs in the Financial Inclusion track.

Use realistic seed history if several months of real usage cannot exist during a hackathon, but clearly distinguish seeded demo history from AI-generated claims.

Test every shown financing match against the underlying source/rule data.

Do not implement additional unrelated features.

At completion, report:
- evidence metrics used
- financing programs included
- which comparisons are deterministic
- which information cannot be inferred
- source handling
- limitations
```
```

### Exit condition

A judge understands:

> “This system isn't merely storing udhaar. It is helping turn informal business activity into understandable financial evidence.”

---

# Milestone 5 — Action Layer: Reminder Draft

One excellent action is enough.

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and inspect the now-complete financial evidence workflow.

The product can understand activity, remember it, answer questions, and explain financial readiness.

The final product capability should demonstrate that Karobaar can also help the merchant act on trusted business data.

Use the narrow payment-reminder scenario.

Imagine the merchant says:

“Ahmed ko reminder bana do.”

Think through a safe and reliable workflow where the system understands the intended customer, retrieves Ahmed's real outstanding amount from the deterministic ledger, and drafts a polite Urdu or Roman-Urdu reminder.

The language model may create the wording, but it may not invent or alter the balance.

Consider:
- unknown customer
- duplicate/similar customer names
- zero outstanding balance
- multiple outstanding transactions
- malformed intent
- editing the draft
- copying the final message

For the hackathon, the action ends at an editable ready-to-copy draft.

Do not add production WhatsApp or SMS integration.

Make this interaction visually strong and fast because it can serve as the closing moment of the live demo.

After implementing it, run the entire product journey from initial transaction capture to reminder generation and identify any integration problems that appear.

At the end of this milestone, declare feature freeze.

No additional capabilities should be introduced after this point.
```
```

### Exit condition

Your full core product now exists.

---

# Milestone 6 — Hardening, Visual Polish, Deployment, Demo

This is **not optional**.

A lot of hackathon teams will spend Day 5 adding features. You should spend Day 5 making the existing product look and behave like something judges could trust.

```
```
Read KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md and inspect the complete product.

The feature set is frozen.

Approach the project now as a senior engineer preparing software for a high-stakes live technical demonstration.

Do not introduce new product capabilities.

Audit the application from several perspectives:

- product clarity
- financial correctness
- AI reliability
- validation
- edge cases
- privacy/trust
- responsiveness
- frontend consistency
- latency
- deployment
- provider failure
- demo resilience

Look for places where the application can break or confuse a judge.

Review all authoritative financial calculations.

Review all LLM boundaries.

Review schema validation and malformed-output handling.

Review the financing language so that it cannot accidentally imply lending approval.

Review the application's behavior when:
- an API key is missing
- an AI provider fails
- transcription fails
- a receipt is unreadable
- the backend times out
- a customer does not exist
- a balance is zero
- a financing program has no relevant match
- the database contains no records

Create a small representative AI evaluation set and report only measured results.

Review the visual system as a senior fintech product designer.

Use Spline/3D only if it remains fast and genuinely strengthens the first impression. Remove or simplify anything that creates demo risk.

Ensure the five primary product surfaces have consistent typography, spacing, states, and navigation.

Run:
- production frontend build
- backend tests
- relevant unit tests
- integration checks
- basic end-to-end smoke flow

Create:
- reliable seed/demo data
- an easy demo reset method
- environment/setup documentation
- architecture documentation
- polished README
- deployment configuration
- backup plan if live AI/network access fails

Then prepare a concise technical demo checklist describing exactly how the product should be demonstrated from beginning to end.

Do not add another feature even if spare time remains until all reliability and presentation issues are resolved.
```
```

---

# So the final sequence is

You now have:

**Context Prompt** — gives ChatGPT the worldview.

Then:

**Prompt 0 — Architecture + bootstrap**

**Milestone 1 — Capture + understanding + verification**

**Milestone 2 — Ledger + dashboard**

**Milestone 3 — Ask Karobaar**

**Milestone 4 — Financial Evidence + Readiness**

**Milestone 5 — Action**

**Milestone 6 — Hardening + presentation**

This is a better structure than trying to cram everything into four milestones because each milestone now has a very clear technical boundary.

---

## One important workflow change

When starting a new milestone, don't simply paste that milestone prompt into a completely fresh conversation with no context.

Use this order:

```
```
1. Put KAROBAAR_AI_FROM_SCRATCH_CONTEXT.md in repo root.

2. Start ChatGPT Desktop / coding session.

3. Give the Storytelling Context Prompt.

4. Tell it to read the Markdown context.

5. Give only the current milestone prompt.

6. Let it inspect/reason/implement/test.

7. Review the result.

8. Only then start the next milestone.
```
```

And within Qoder, the Markdown file becomes even more important because it gives the IDE agent persistent project-level context without you having to paste another 10,000-word specification into every request.

The new file is here again:

Download **KAROBAAR\_AI\_FROM\_SCRATCH\_CONTEXT.md**

KAROBAAR\_AI\_FROM\_SCRATCH\_CONTEXT.mdDocumentOpen file