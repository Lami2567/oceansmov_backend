# 🌙 Neon Database Setup Guide

## Why Switch to Neon?

- ✅ **Render-Compatible** - No network restrictions
- ✅ **Better Performance** - Serverless PostgreSQL
- ✅ **Free Tier** - Generous limits
- ✅ **Easy Setup** - Simple connection

## Step 1: Create Neon Account

1. Go to https://neon.tech/
2. Sign up with GitHub
3. Create a new project
4. Choose a project name (e.g., "movie-web")

## Step 2: Get Connection String

1. In your Neon dashboard, click "Connection Details"
2. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/database
   ```

## Step 3: Update Render Environment

1. Go to your Render dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Update `DATABASE_URL` with the Neon connection string

## Step 4: Migrate Data (Optional)

If you have existing data in Supabase:

1. Set both environment variables:
   ```
   SUPABASE_URL=your_old_supabase_connection
   DATABASE_URL=your_new_neon_connection
   ```

2. Run the migration script:
   ```bash
   cd backend
   node migrate-to-neon.js
   ```

## Step 5: Deploy

1. Commit the changes:
   ```bash
   git add .
   git commit -m "Switch to Neon database"
   git push origin master
   ```

2. Check Render logs for:
   ```
   🌙 Neon Database Connection Starting...
   📍 Connecting to Neon: ep-xxx-xxx-xxx.region.aws.neon.tech
   ✅ Neon connection successful!
   ```

## Expected Results

After deployment, you should see:
- ✅ No more `ENETUNREACH` errors
- ✅ Fast database connections
- ✅ Reliable deployment
- ✅ Better performance

## Troubleshooting

**If connection fails:**
1. Check the connection string format
2. Verify the database name is correct
3. Ensure SSL is enabled
4. Check Render environment variables

**If migration fails:**
1. Verify both connection strings
2. Check table permissions
3. Ensure data types match

## Neon Benefits

- **No Network Restrictions** - Works perfectly with Render
- **Automatic Scaling** - Handles traffic spikes
- **Point-in-Time Recovery** - Data safety
- **Branching** - Easy development environments
- **Free Tier** - 3GB storage, 10GB transfer/month 