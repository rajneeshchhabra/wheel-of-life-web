# Wheel of Life - Deployment Guide

## Prerequisites

- GitHub account
- Supabase account (free tier)
- Vercel account (free tier)
- Domain: `nokk.shop` (via GoDaddy)

---

## Step 1: Push to GitHub

```bash
# In an interactive terminal, authenticate GitHub CLI
gh auth login

# Select: GitHub.com → HTTPS → Authorize in browser
# Then return here and the code will be pushed automatically
```

---

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up with **rajneesh.chhabra@gmail.com**
3. Create new project:
   - **Name:** wheel-of-life
   - **Database password:** Save this securely
   - **Region:** Choose closest to you
4. Once created, go to **Settings → API**
5. Copy these values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<Your Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   ```
6. Run the schema SQL:
   - In Supabase dashboard, go to **SQL Editor**
   - Click **New query**
   - Paste contents of `supabase-schema.sql`
   - Click **Run**

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with **rajneesh.chhabra@gmail.com**
3. Click **Add New** → **Project**
4. **Import Git Repository** → Search `wheel-of-life-web`
5. Click **Import**
6. Configure project:
   - **Framework Preset:** Next.js
   - **Environment Variables:** Add these three:
     ```
     NEXT_PUBLIC_SUPABASE_URL=<from step 2>
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<from step 2>
     SUPABASE_SERVICE_ROLE_KEY=<from step 2>
     ```
   - Click **Deploy**
7. Wait ~2 minutes for deployment to complete

---

## Step 4: Connect Domain

1. After Vercel deployment succeeds, go to **Settings → Domains**
2. Click **Add Domain**
3. Enter: `nokk.shop`
4. Vercel will show DNS records needed:
   - **4 records:** A records and CNAME
5. Go to [GoDaddy DNS settings](https://www.godaddy.com/domains/manage) for nokk.shop
6. Update DNS records in GoDaddy:
   - Delete old A records
   - Add Vercel's A records
   - Add Vercel's CNAME record
7. Wait 24 hours for DNS propagation (usually 5-30 minutes)

---

## Step 5: Enable Auth (Optional for Phase 2)

Once domain is live, add Supabase Auth:

1. In Supabase, go to **Authentication → Providers**
2. Enable **Email Provider**
3. Update app to use auth (React Context + Supabase client)

---

## Testing Checklist

- [ ] App loads at https://nokk.shop
- [ ] Onboarding flow works
- [ ] Data persists in localStorage
- [ ] Settings panel opens
- [ ] Wheel animates smoothly
- [ ] Can add goals/tasks/habits

---

## Support

- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
- Next.js docs: https://nextjs.org/docs
