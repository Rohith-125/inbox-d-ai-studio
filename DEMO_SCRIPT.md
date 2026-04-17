# 🎬 Inbox'd — Live Demo Script

> **Duration:** ~3–5 minutes
> **Goal:** Show a complete, working flow — from signup → import customers → generate AI campaign → personalize → send → track.
> **Tip:** Have a test account ready and a small CSV of 3–5 fake customers prepared in advance.

---

## ✅ Pre-Demo Checklist (Do this BEFORE you present)

- [ ] App is published or running on preview URL
- [ ] Browser zoom set to 100%
- [ ] Test customer CSV ready (3–5 rows: name, email, cart_status, engagement_level)
- [ ] Logged out — start fresh from the landing page
- [ ] Resend API key + sender email configured
- [ ] Have your own real email in the test list so you can show a *received* email
- [ ] Close all unrelated browser tabs / notifications

---

## 🎬 SCENE 1 — Landing & Sign Up (30 seconds)

**Say:**
> "Here's the Inbox'd landing page. Let me create a fresh account."

**Do:**
1. Click **Sign Up**
2. Enter company name, email, password
3. Click **Create Account**
4. → You land on the **Dashboard**

**Say:**
> "Account created instantly — auth and the database are managed by Lovable Cloud."

---

## 🎬 SCENE 2 — Dashboard Overview (30 seconds)

**Say:**
> "This is the main dashboard. Right now it's empty because we haven't done anything yet — but soon we'll see total emails sent, open rates, click rates, and AI insights here."

**Do:**
- Hover over the stat cards
- Point to the **AI Insights** panel
- Point to the **Campaign Performance** chart

---

## 🎬 SCENE 3 — Import Subscribers (45 seconds)

**Say:**
> "Step one of any campaign — getting subscribers in. I can add them manually or import a CSV."

**Do:**
1. Click **Subscribers** in sidebar
2. Click **Import CSV** → select your prepared file
3. Watch the table populate
4. Point to the **cart status** and **engagement level** dropdowns:

**Say:**
> "Notice each subscriber has behavioral data — cart status, engagement level, total purchases. This is the data our AI will use to personalize emails."

---

## 🎬 SCENE 4 — Build a Campaign with AI (1 minute)

**Say:**
> "Now let's build a campaign. Watch how fast this is."

**Do:**
1. Click **Campaigns** in sidebar
2. Fill in:
   - Campaign Name: `Spring Sale Launch`
   - Subject: `Our biggest sale of the year`
   - Product Name: `Premium Coffee Beans`
3. Pick a tone — click **Friendly**
4. Click **Generate with AI**
5. Wait ~3 seconds → AI fills in the email body

**Say:**
> "That's Google Gemini writing copy in real time, in the tone we picked. I can edit it, or just use it as-is."

6. (Optional) Upload an image
7. Add CTA text: `Shop Now` and a link

---

## 🎬 SCENE 5 — Personalization Engine (1 minute) ⭐ **THE WOW MOMENT**

**Say:**
> "Here's what makes Inbox'd different. Instead of sending the same email to everyone, watch this."

**Do:**
1. Click **Personalization** in sidebar
2. Select 3–4 subscribers (one with abandoned cart, one VIP, one inactive)
3. Pick a tone
4. Click **Generate Personalized Emails**
5. Wait ~5 seconds
6. Expand each generated email one by one

**Say:**
> "Look — the abandoned-cart subscriber gets a recovery message with urgency. The VIP gets exclusive treatment. The inactive subscriber gets a 'we miss you' angle. **Every email is unique**, written by AI based on their actual behavior."

**Do:**
7. Click **Send All** → confirm

---

## 🎬 SCENE 6 — Schedule a Campaign (30 seconds)

**Say:**
> "I can also schedule campaigns to send automatically."

**Do:**
1. Go back to **Campaigns**
2. Click **Schedule Campaign**
3. Pick a date/time 2 minutes from now
4. Confirm
5. Navigate to **Scheduled** in sidebar — show it sitting there

**Say:**
> "A cron job runs every minute on the backend and will pick this up and send it automatically — no human needed."

---

## 🎬 SCENE 7 — Receive the Email (30 seconds) ⭐ **PROOF IT WORKS**

**Do:**
1. Switch to your email inbox (Gmail, Outlook, etc.)
2. Show the email that just arrived
3. Open it — show the personalized content
4. Click the CTA link

**Say:**
> "And there it is — a real email, personalized, delivered through Resend. When I clicked, our tracking pixel and click handler logged the event."

---

## 🎬 SCENE 8 — Analytics & Tracking (45 seconds)

**Do:**
1. Go to **Sent History** in sidebar
2. Show the campaign with sent count, open rate, click rate

**Say:**
> "Every open and every click is tracked in real time using a tracking pixel and redirect URL — both running as edge functions."

3. Go back to **Dashboard**
4. Show updated stats and click **Generate AI Insights**
5. Wait for AI to produce 3–5 actionable insights

**Say:**
> "And finally — AI insights. Instead of just showing numbers, our AI tells the marketer what to do next."

---

## 🎬 SCENE 9 — Wrap (15 seconds)

**Say:**
> "That's the full flow — signup, import, generate, personalize, send, track, and learn — all in under 5 minutes, all powered by Lovable Cloud and Google Gemini.
>
> Any questions?"

---

## 🛟 Backup Plan — If Something Breaks

| Problem | Fallback |
|---|---|
| AI generation slow/fails | Show pre-saved draft from **Drafts** page |
| Email doesn't arrive | Show the `email_sends` row with status `sent` in Sent History |
| Personalization fails | Show a screenshot/recording you prepared earlier |
| Schedule cron didn't fire | Manually click **Send Now** instead |
| Auth fails | Have a second pre-made account ready to log into |

---

## 📝 Sample CSV for Demo

Save this as `demo_customers.csv`:

```csv
name,email,cart_status,engagement_level,total_purchases,last_purchase_date
Alex Johnson,alex@example.com,abandoned,active,3,2025-03-15
Sam Lee,sam@example.com,empty,vip,12,2025-04-10
Jamie Park,jamie@example.com,active,new,0,
Taylor Reed,YOUR_REAL_EMAIL@gmail.com,abandoned,inactive,1,2024-11-02
Morgan Diaz,morgan@example.com,empty,active,5,2025-02-20
```

> ⚠️ Replace `YOUR_REAL_EMAIL@gmail.com` with your actual inbox so you can show a received email live.
