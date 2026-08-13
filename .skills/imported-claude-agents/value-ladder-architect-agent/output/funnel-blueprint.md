# Sales Funnel Blueprint

Project: value-ladder-production
Source: value_ladder_report.json + persona-brief.json

## TOFU (Awareness)

Objective: attract qualified creator-operators and convert anonymous traffic into known leads.

Assets:
- Channel content: short tutorials, framework posts, case-study clips
- Lead asset page: `Free Growth Playbook` opt-in landing page
- Thank-you page with next step CTA to `Starter Toolkit`

Primary traffic routes:
- YouTube -> Lead Magnet Landing Page
- Instagram/TikTok short-form -> Lead Magnet Landing Page
- LinkedIn/Reddit educational posts -> Lead Magnet Landing Page

TOFU KPIs:
- Landing page opt-in rate
- Cost per lead
- Email welcome click-through rate

Handoff rules:
- If lead submits form -> add tag `lead.playbook` and enter welcome + nurture sequence
- If lead clicks CTA on thank-you page -> route into Tripwire checkout

## MOFU (Interest/Consideration)

Objective: nurture trust, monetize early intent, and qualify buyers for core transformation.

Assets:
- Tripwire checkout flow: `Starter Toolkit`
- 5-email nurture sequence (value + objections + case snippets)
- Webinar registration page for `Core Accelerator Program`
- Webinar reminders and replay page

Segmentation:
- Segment A: lead only (no purchase)
- Segment B: tripwire buyer
- Segment C: webinar registrant
- Segment D: webinar attendee

MOFU KPIs:
- Tripwire take rate
- Webinar registration rate
- Webinar show-up rate

Handoff rules:
- Segment A after email #3 with intent click -> webinar registration CTA
- Segment B immediately -> webinar invite sequence
- Segment C + attended webinar -> BOFU close sequence
- Segment C + no-show -> replay + deadline follow-up

## BOFU (Purchase/Ascension)

Objective: convert nurtured prospects into core buyers, then ascend qualified buyers to premium advisory.

Assets:
- Core sales page and checkout: `Core Accelerator Program`
- 48-hour close sequence (email + urgency)
- High-ticket application page: `Elite Advisory`
- Qualification call script and enrollment workflow
- Continuity offer page: `Insider Membership`

BOFU KPIs:
- Core offer conversion rate
- Application rate for high ticket
- Call-to-close rate
- Continuity attachment rate

Handoff rules:
- Core buyer + milestone completion -> invite to `Elite Advisory` application
- Core buyer not yet high-ticket qualified -> route to `Insider Membership`
- High-ticket not closed -> return to continuity + case-study nurture

## Full Journey Map

1. Awareness content -> Lead Magnet opt-in (`Free Growth Playbook`)
2. Thank-you page OTO -> Tripwire (`Starter Toolkit`)
3. Nurture/segmentation -> Webinar registration
4. Webinar -> Core conversion (`Core Accelerator Program`)
5. Post-core split:
- Ascension path -> Application + Call -> `Elite Advisory`
- Retention path -> `Insider Membership`
6. Referral trigger after milestone wins from continuity/high-ticket clients

## Required build sequence

1. Lead magnet funnel pages + welcome emails
2. Tripwire checkout + onboarding assets
3. Webinar registration/reminder/replay stack
4. Core sales page + close sequence
5. High-ticket application + qualification call flow
6. Continuity onboarding + retention loops

## Analytics event plan

- `lead_optin_submitted`
- `tripwire_checkout_started`
- `tripwire_purchased`
- `webinar_registered`
- `webinar_attended`
- `core_checkout_started`
- `core_purchased`
- `high_ticket_applied`
- `high_ticket_closed`
- `continuity_started`
- `continuity_retained_30d`

