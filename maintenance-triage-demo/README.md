# Property Maintenance Triage Agent (Demo)

## Setup
1. From repo root, run:
   - `python3 -m http.server 8080`
2. Open:
   - `http://localhost:8080/maintenance-triage-demo/`

## How the demo works
- Tenant form collects issue details and clarifying signals.
- Deterministic triage logic classifies urgency, vendor type, and next steps.
- Triage output generates clean tenant + manager summaries.
- Requests are stored in browser `localStorage` and shown on dashboard.
- Dashboard includes preload examples and a **Load Leaking Sink Demo** shortcut.

## For a real client pilot
- SMS intake via Twilio.
- Email notifications for tenant/manager updates.
- Database (Supabase or Airtable).
- Property manager login + role permissions.
- Vendor list configuration by portfolio/property.
- Optional AppFolio/Rent Manager/Yardi integration.
- Audit log of decisions and updates.
- Human approval workflow before vendor dispatch.
