# Marketing Validation Engine — Signal Accuracy Report & Improvement Plan

> Produced 2026-06-10. Grounded in live VirtueBud data and a full code inventory.
> Goal: convert the funnel from an activity tracker into a decision engine that
> supports keep / pivot / kill calls with earlier, higher-fidelity ICP feedback.
>
> Note: written against the post-migration schema — all `mkt_*` tables key on
> `idea_id` and routes live under `src/app/marketing/[ideaId]/`.

## Context

The Marketing feature runs a 6-step validation funnel: Set positioning → Publish landing page → Source prospects → Run outreach → Schedule content → Watch signals. Its purpose is to produce a keep / pivot / kill decision for each business idea.

Verdict up front: **the funnel measures activity, not evidence.** It tells you that things happened. It does not tell you whether the right people responded, or what their response means.

Grounding data (VirtueBud, live DB at time of writing): 41 page views, 23 unique sessions, **1 captured signal**, 0 signals with UTM attribution, 106 sourced prospects, **0 outreach emails sent**, 0 replies. [Fact]

---

## Part A — Diagnosis: why today's signals are not decision-grade

1. **Step completion is binary, not evidentiary.** [Fact] One signup marks "Watch signals" done. Motion gets confused with validation.
2. **No denominator discipline.** [Fact] Conversion is `stage[i]/stage[i-1]` with no minimum n, no window, no confidence interval. The dashboard would show "4.3%" from one capture.
3. **Signals are not ICP-scored.** [Fact] A perfect-fit ICP email and a curious random count identically. `mkt_prospect.score` exists; nothing fills it. The core question, "do the *right* people want this?", is unanswerable.
4. **Quiz answers cannot be aggregated.** [Fact] Free-form JSONB, no schema; each AI-generated page invents its own fields.
5. **The strongest evidence channels are dormant.** [Fact] Preorder (money) is rejected at the API. Outreach has 106 prospects, 0 sends. Opens/replies are manual; no webhooks.
6. **No attribution chain.** [Fact] Published posts carry no UTM links; 0 signals have UTM. Channel learning is impossible.
7. **The decision is unstructured.** [Fact] Status is a manual dropdown. No thresholds, no rationale log, no review cadence. Confirmation bias decides.
8. **Binding constraint is traffic, not analytics.** [Inference] At 23 sessions, no dashboard produces a valid decision. Part of the fix is operational: ~300+ targeted sessions and actually sending the queued sequence.

---

## Part B — Improvements per existing step

### Step 1 · Set positioning → make it falsifiable
- **Decision Contract** (new `mkt_validation.decision_contract` JSONB): riskiest_assumption, success_metrics `{metric, threshold, window_days}`, review_date. AI-suggested from positioning, human-approved. Dashboard renders progress against thresholds, not raw counts.
- **Structured ICP**: extend `icp_definition` with `qualifying_criteria` (roles, firmographics, pain indicators) consumed by scoring (B3, B6).
- **Message testing before traffic** (see Part G): test 2-3 positioning statements against a verified ICP panel (e.g. Wynter for B2B) before spending on traffic. Cheapest possible pivot data. [High Confidence]

### Step 2 · Publish landing page → capture quality, not just emails
1. **Structured qualification quiz** (highest-leverage fix): `mkt_landing.quiz_schema` JSONB with fixed multiple-choice questions (role, pain severity 1-5, current solution, WTP band). LP Designer prompt renders from schema; capture route validates against it. Answers become chartable segments.
2. **Micro-events**: beacon fires `cta_click`, `scroll_50`, `scroll_90`, `pricing_click` into the existing `mkt_event` table. Intent gradient instead of one view bit.
3. **Fake-door pricing**: pricing section whose CTA logs `pricing_click` then shows early-access capture, disclosed at click. Money-intent at zero billing complexity. Or skip straight to Stripe Payment Links (Part G) — real preorders, near-zero integration.
4. **Email verification (double opt-in)**: `verified_at` on `mkt_signal`. Raw conversion drops; purity rises. Only verified emails count toward thresholds.
5. **A/B angle variants**: two slugs per idea from the Researcher's `hero_angles`; per-variant conversion = which *message* resonates (pivot data).

### Step 3 · Source prospects → score fit at import
- AI fills `mkt_prospect.score` (0-100 vs `qualifying_criteria`) + `segment` tag at import.
- Dormancy nudge when prospects > 0 and sends = 0 for 7+ days.

### Step 4 · Run outreach → replies as classified evidence
1. **Webhooks** for opens/bounces/replies (see Part G for the tool correction here).
2. **AI reply classification**: positive / neutral / negative / meeting-request → `reply_sentiment`. A "no, because X" is pivot evidence.
3. **Interview CTA as first-class signal**: booking link variable in sequences; `meeting_booked` event. 5 ICP conversations outweigh 500 anonymous views. [High Confidence]
4. **Per-segment sends**: reply rate per segment = which ICP responds (audience-pivot data).

### Step 5 · Schedule content → close the attribution loop
- **Auto-UTM every published link** in `publishNow`/`scheduleWithBuffer`. Single change that makes content → landing → signal chains attributable.
- Persist per-post engagement snapshots (Buffer stats already fetched in `fetchAnalytics`).

### Step 6 · Watch signals → from table to decision panel
1. **Weighted validation score** (evidence weights: view 0.1 · cta_click 0.5 · quiz 2 · waitlist 3 · verified +1 · pricing_click 5 · meeting 8 · positive reply 8 · interview insight 10 · preorder 20), displayed with confidence tier gated on n (Low <30 sessions, Medium <200, High ≥200).
2. **ICP split everywhere**: ICP-fit vs non-fit funnel rows. 10 ICP captures > 100 random captures.
3. **Statistical guardrails**: Wilson intervals; "not enough data" below n=30 instead of a percentage.
4. **Decision panel**: progress vs Decision Contract + evidence summary + AI-written keep/pivot/kill recommendation (squad-prompt pattern). Human confirms; verdict + rationale + data snapshot stored in new `mkt_decision_log`.
5. **Pivot taxonomy** on threshold failure: audience pivot (non-target segment converts) · problem pivot (quiz pain distribution contradicts positioning) · channel pivot (one UTM source converts) · value pivot (feature-interest skew). Answers "pivot *how*".
6. **Feedback loop to Idea Refiner**: push funnel evidence into the idea's go/no-go Report step.

---

## Part C — New steps to add to the funnel

| # | New step | Where | Why |
|---|---|---|---|
| 0 | **Define hypothesis & thresholds** (Decision Contract) | Before/within "Set positioning" | Pre-registered criteria separate measurement from rationalization |
| 2.5 | **Interview Intelligence track** (full spec: Part F) | Parallel to landing/outreach | Earliest, highest-fidelity ICP feedback |
| 2.7 | **Drive paid traffic** (full spec: Part I-1) | After "Publish landing page" | Buys the ~300+ ICP-targeted sessions the funnel starves without; the funnel gains a budget-vs-evidence step |
| 6.5 | **Post-capture micro-survey** (Tally, spec: Part I-4) | After waitlist submit | One question at peak intent ("What would make this a must-have?" / WTP ladder) |
| 7 | **Decision review** (recurring) | After "Watch signals" | Dated review vs contract; verdict logged in `mkt_decision_log` |

The funnel therefore becomes: Set positioning (+ contract) → Publish landing page → **Drive paid traffic** → Source prospects → Run outreach (+ interviews) → Schedule content → Watch signals → **Decision review**.

---

## Part F — Interview Intelligence (transcript feature, full spec)

The single most underused validation asset is the recorded ICP conversation. Design:

### Data model
New table `mkt_interview`:
- `id`, `idea_id`, `prospect_id` (nullable FK → mkt_prospect), `participant_name`, `participant_role`, `segment`, `source` (outreach / network / panel / inbound)
- `conducted_at`, `recording_url` (nullable), `transcript` (text, pasted or uploaded), `consent` (boolean — record it, this is personal data)
- `analysis` JSONB (per-interview AI output), `analyzed_at`, `created_by`

### Per-interview AI analysis (prompt "1. Interview Analyst", new group "Marketing - Interviews")
Extracts, with **verbatim quotes** as evidence for every claim:
- Pains mentioned (+ severity language), current solutions and what they cost (time/money)
- **Mom Test filter** [High Confidence methodology]: separates *past behavior* ("last month I…") from *hypothetical praise* ("I would totally use this"). Hypotheticals are flagged and down-weighted — compliments are not evidence.
- Commitment signals offered (intro, follow-up meeting, pilot interest, money talk)
- Objections and dealbreakers, feature requests, WTP mentions
- ICP-fit assessment vs `qualifying_criteria`, overall evidence grade (strong / weak / anti-signal)
Output feeds the weighted score (interview insight = weight 10; anti-signal subtracts).

### Cross-interview synthesis (prompt "2. Interview Synthesizer", re-run on demand)
- Theme frequency across all transcripts ("7 of 9 mentioned switching cost")
- Contradiction detection vs the positioning statement (direct pivot input)
- Segment contrast (which persona shows real pull)
- Saturation indicator: when the last 3 interviews produced no new themes, you have enough interviews. [Inference]

### UI
New page `/marketing/[ideaId]/interviews`: list + "Add interview" (paste transcript / upload), per-interview insight card (quotes, grade, Mom Test flags), synthesis panel at top, "Analyze" with the existing staged-progress pattern. Synthesis result is shown inside the Step-6 Decision panel.

### Transcript acquisition
Paste-in works day one (Meet/Zoom transcripts, Fireflies/tl;dv exports). Optional later: audio upload → Whisper API transcription. Do not build a recorder; every meeting tool already produces transcripts. [High Confidence]

---

## Part G — Tool stack audit: keep, fix, add

Honest assessment of the current stack. Labels reflect knowledge as of mid-2025; verify current pricing/ToS. [Uncertain on post-2025 changes]

| Tool | Role today | Verdict | Why |
|---|---|---|---|
| **Apify** | Reference-source scraping + prospect sourcing | **Keep for research; demote for sourcing** | Excellent for scraping public competitor content (its real strength here). For prospect emails it produces stale/generic addresses, and cold-emailing scraped personal data is a GDPR/LGPD exposure. [High Confidence] |
| **Buffer** | Social scheduling | **Keep, with eyes open** | Fine scheduler; weak analytics; organic social from a zero-follower account will never produce decision-grade traffic. It is a *secondary* signal channel, not a validation engine. |
| **Brevo** | Cold outreach sending | **Wrong tool — split the job** | Brevo is a marketing/transactional ESP. Cold (unconsented) sends violate typical ESP ToS, run on shared IPs, and get spam-foldered; the account can be suspended. **Keep Brevo for opted-in waitlist nurture. Move cold outreach to a dedicated tool (Smartlead / Instantly / Lemlist / Apollo sequences) with a separate sending domain + warmup + inbox rotation.** This is the one outright incorrect tool choice in the stack. [High Confidence] |
| **Stripe** | (not wired) | **Add now via Payment Links** | A Payment Link + webhook turns preorder from "rejected at API" into the strongest signal you can collect, with near-zero integration work. |
| **Supabase / Next.js / AI squad pipelines** | Core platform | **Keep** | The squad-prompt pattern is reusable for interviews and the decision panel. |

**Missing categories — four are now first-class features (specs in Part I):**
1. **Paid traffic** → feature spec **Part I-1** (`mkt_ad_campaign`, `/traffic` page, AI ad-creative squad, cost-per-ICP-capture). [High Confidence on necessity]
2. **Product analytics: PostHog** → feature spec **Part I-2** (snippet on public pages, mirrored events, per-signal session recordings; `mkt_event` stays canonical).
3. **Scheduling: Cal.com** → feature spec **Part I-3** (booking URL, sequence variable, webhook → `meeting_booked` + interview stub).
4. **Micro-surveys: Tally** → feature spec **Part I-4** (thank-you embed, webhook → `survey_answers`).

**Still playbook-level (no build needed):**
5. **ICP recruiting panels**: User Interviews / Respondent (B2B) / Prolific — pay $30-80/interview to talk to verified ICPs in days instead of waiting for organic volume. Feeds Part F directly.
6. **Message testing**: Wynter (B2B positioning tests against verified panels, ~48h turnaround) or PickFu (B2C quick polls) — test the positioning statement *before* building the page.
7. **Transcripts**: Fireflies / tl;dv / native Meet transcripts → paste into Part F. No new infra.

---

## Part H — Stress test: real-world failure cases and the frameworks that counter them

How this funnel fails in the wild, with named precedents:

1. **The vanity waitlist.** Waitlists cost the visitor nothing; AI-era launches routinely show huge lists and near-zero paid conversion. A 5,000-email list can coexist with zero demand. *Counter:* commitment ladder — verified email → micro-survey → pricing click → deposit. Weight accordingly. (Dropbox's 2008 video waitlist worked, but survivorship bias: it also had a working demo and a starving market.) [High Confidence]
2. **Stated vs revealed preference.** Quibi raised $1.75B on surveys and focus groups saying yes; users did not pay. Juicero validated tech, not willingness-to-pay at $399. *Counter:* never count "I would use this"; count pricing clicks, deposits, meetings kept, referrals sent. The Mom Test filter in Part F operationalizes this.
3. **Friends-and-family pollution.** Early traffic is your network; conversion is flattery. *Counter:* exclude direct/untagged traffic from decision metrics (UTM enforcement makes this possible); flag signal emails matching team domains.
4. **The free-tier trap.** Validating at price zero (Color Labs: $41M pre-launch, no demand at any price). *Counter:* price visible on page from day one; fake-door or Payment Link preorder.
5. **Channel mirage.** Exactly our live data: organic social → 23 sessions → eternal "validating". *Counter:* paid ICP-targeted traffic as a standard funnel step with budget tracked per idea.
6. **Cold-email domain burn.** Sending cold via a marketing ESP from the primary domain: spam-foldered, domain reputation damaged, ESP account banned. Silent failure — dashboards show "sent", nobody ever saw it. *Counter:* Part G's outreach split; track opens via proper tooling; treat 0% open rate as an infrastructure alarm, not market signal. [High Confidence]
7. **Compliance failure.** Cold-emailing scraped personal emails in EU/Brazil (GDPR/LGPD) risks complaints and blacklisting. *Counter:* B2B corporate addresses only, lawful-basis note, honor `mkt_suppression` (already built), prefer opt-in panels for B2C ICPs.
8. **Champion vs buyer mismatch (B2B).** Users love it; the economic buyer never pays. *Counter:* persona tag on every signal and interview; require ≥1 buyer-persona interview before "keep".
9. **Positive-only instrumentation.** The funnel records yeses; the nos vanish. *Counter:* classified negative replies, exit micro-survey, anti-signal grade in interview analysis. Kill decisions need disconfirming evidence, not absence of confirmation.
10. **Premature kill on thin data.** Killing at n=30 because thresholds were never sample-gated. *Counter:* confidence tiers + minimum-n in the Decision Contract.

**Modern frameworks companies use (and where this product should borrow):** [High Confidence as of mid-2025]
- **Testing Business Ideas (Bland/Osterwalder)** — catalog of 44 experiments each rated by evidence strength; directly inspires the weighted-score + experiment-picker idea. The funnel should eventually offer more experiment types than "landing page + cold email".
- **The Mom Test (Fitzpatrick)** — interview discipline; embedded in Part F's analyst prompt.
- **Continuous Discovery Habits (Torres)** — weekly customer touchpoints; the recurring Decision Review (C-7) institutionalizes this.
- **Sean Ellis PMF survey** ("how disappointed if it disappeared") — micro-version usable on waitlist members after a prototype exists.
- **JTBD switch interviews (Moesta)** — the "current solutions / switching triggers" extraction in Part F.
- **Lean B2B / design partners** — for B2B ideas, 3-5 signed pilot LOIs or prepaid design-partner slots beat any landing-page metric. Worth a first-class `loi` signal type (weight ~25).

---

## Part I — Tool-integration feature specs (promoted from recommendations to features)

### I-1 · Paid traffic tracker (Meta / Google / LinkedIn Ads)
The funnel's missing fuel line. $300-500 per idea buys the ~300+ ICP-targeted sessions everything else starves without. [High Confidence]

**Data model** — new table `mkt_ad_campaign`:
`id`, `idea_id`, `landing_id` (FK), `platform` (meta/google/linkedin), `name`, `status` (draft/live/paused/ended), `budget_cents`, `spend_cents`, `targeting_notes` (text — the ICP targeting spec used in the ad platform), `utm_campaign` (unique per campaign, auto-generated), `started_at`, `ended_at`, timestamps.

**v1 scope (no ads-API integration):**
- New page `/marketing/[ideaId]/traffic`: create campaign → app generates the final ad URL with locked UTMs (`utm_source=meta&utm_medium=paid&utm_campaign=<slug>`), staff paste it into Ads Manager. Spend updated manually (or weekly).
- **AI ad-creative squad** (reuse the content 5-agent pattern + image generation): generates 2-3 ad copy variants + image per ICP angle from positioning/Brand DNA. One angle per campaign → channel-pivot data.
- Attribution is automatic: ViewBeacon already stores UTM on `mkt_event`, capture route stores UTM on `mkt_signal`. Dashboard joins on `utm_campaign`.
- **Metrics per campaign**: sessions, captures, verified captures, cost/session, **cost per verified ICP capture** (the budget-vs-evidence number the Decision Contract can threshold).
- v2: platform APIs for spend/impressions auto-sync.

### I-2 · PostHog product analytics
`mkt_event` stays the canonical store; PostHog adds what hand-rolled charting cannot: session recordings, funnels, retention, A/B flags.
- PostHog JS snippet on the public `/m/[slug]` host only (not the admin app), `NEXT_PUBLIC_POSTHOG_KEY` env var.
- Identify with the existing beacon `session_id`; attach `idea_id`, `landing_id`, `variant` as properties — recordings become filterable per idea.
- Mirror beacon events (`view`, `cta_click`, `scroll_*`, `pricing_click`) to PostHog alongside the existing POST.
- Signals page: "Watch session" link per signal (PostHog recording filtered by that session_id). Watching 10 real ICP sessions is qualitative gold for pivot direction.
- Landing A/B variants (B2.5) run on PostHog feature flags when implemented; PostHog MCP available for in-IDE analysis.

### I-3 · Cal.com interview booking
- `booking_url` field on `mkt_validation` (set once per idea; Cal.com is open source / free tier).
- `{{booking_link}}` template variable in outreach sequences; post-capture thank-you screen shows "Book a 20-min call" CTA (commitment-ladder rung between waitlist and preorder).
- **Webhook** `/api/webhooks/calcom` (BOOKING_CREATED): logs `mkt_event type='meeting_booked'` + auto-creates an `mkt_interview` stub (participant name/email prefilled, transcript pending) — bookings flow straight into the Part F pipeline.
- Embed option on `/marketing/[ideaId]/interviews`.

### I-4 · Tally post-capture micro-survey
- `survey_url` field on `mkt_landing` (Tally form, free tier, embeddable).
- After successful capture, the thank-you state embeds the Tally form with hidden fields (`signal_id`, `idea_id`, `email`) — one question at peak intent.
- **Webhook** `/api/webhooks/tally`: writes answers into `mkt_signal.survey_answers` (new JSONB column) keyed by `signal_id`.
- Survey answers join quiz answers in segment charts and feed the weighted score (answered survey = +1 commitment weight).

---

## Part D — Counter-arguments (stress-tested, still true)

- **"Over-engineering for n=23 sessions."** Partly true. [Uncertain] P0 items are cheap and structural; advanced dashboards should wait for traffic. Buy traffic first.
- **"Automated scores create false authority."** Mitigated by confidence gating, human-confirmed decisions, pre-registered thresholds.
- **"Verification and structured quizzes lower conversion."** Yes. Accuracy over vanity metrics, intentionally.

---

## Part E — Prioritized roadmap

**P0 — decision integrity + unblock evidence channels**
1. Decision Contract + threshold-aware dashboard (B1, C-0)
2. Structured quiz schema + capture validation (B2.1)
3. Auto-UTM on published links (B5)
4. **Paid traffic tracker**: `mkt_ad_campaign` + `/traffic` page + AI ad-creative squad + cost-per-ICP-capture metric (Part I-1) — without traffic every other improvement starves
5. Outreach tooling split: cold → dedicated sender, Brevo → nurture only (Part G) + webhooks (B4.1)
6. Stripe Payment Link preorder (Part G) or fake-door pricing events (B2.3)
7. Weighted score + ICP split + n-gating on Signals (B6.1-3)

**P1 — evidence breadth (the "earlier ICP feedback" core)**
8. **Interview Intelligence**: `mkt_interview` + analyst & synthesizer prompts + `/interviews` page (Part F)
9. **Cal.com booking**: `booking_url` + `{{booking_link}}` in sequences + post-capture CTA + webhook → `meeting_booked` + interview stub (Part I-3)
10. **Tally micro-survey**: `survey_url` + thank-you embed + webhook → `survey_answers` (Part I-4, C-6.5)
11. **PostHog**: snippet on `/m/[slug]`, mirrored events, per-signal "Watch session" links (Part I-2)
12. Email verification (B2.4); prospect ICP scoring + per-segment sends (B3, B4.4)

**P2 — scale & learning**
13. A/B landing variants on PostHog flags (B2.5, I-2); ads-API spend auto-sync (I-1 v2)
14. Decision panel + `mkt_decision_log` + pivot taxonomy (B6.4-5, C-7)
15. Idea Refiner feedback loop (B6.6); experiment-type catalog (Part H)

Key files: `src/app/marketing/[ideaId]/page.tsx` (metrics), `positioning/` (contract), `src/app/api/m/[slug]/capture/route.ts` + `ViewBeacon.tsx` (events/verification), `src/lib/marketing/outreach.ts` (sender split, webhooks), `content/actions.ts` (UTM), `signals/` (score, panel), new `interviews/` and `traffic/` (Parts F, I-1). Reuse: `fillTemplate` squad pattern, generic `mkt_event`, `resolveAiConfig`, staged-progress UI.

## Verification (post-implementation)
1. Quiz submit on `/m/virtuebud` stores schema-valid answers + UTM; off-schema payload rejected.
2. Published post link carries UTM; visiting it populates `mkt_event.utm`; chain visible in Signals.
3. Dashboard shows "insufficient data" below n=30, never a bare percentage.
4. Paste a transcript → analyst output with verbatim quotes + Mom Test flags; second transcript → synthesis updates theme counts.
5. Status change requires a rationale row in `mkt_decision_log`.
6. Cold send goes out via the dedicated sender from the secondary domain; Brevo only ever emails captured/opted-in signals.
7. Create an ad campaign in `/traffic` → locked-UTM URL generated; visit it → session + capture attribute to that campaign; cost-per-verified-capture renders after manual spend entry.
8. Book via the Cal.com link → webhook fires → `meeting_booked` event + interview stub appears in `/interviews`.
9. Complete the Tally form after a capture → webhook writes `survey_answers` onto the originating signal; answer appears in segment charts.
10. Load `/m/virtuebud` with PostHog key set → recording appears in PostHog with `idea_id` property; "Watch session" link on the signal opens it.
