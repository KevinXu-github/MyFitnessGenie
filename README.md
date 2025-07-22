# MyFitnessGenie 🧞‍♂️

Your personal AI fitness coach powered by Strava data and sports science knowledge.

## What It Does

MyFitnessGenie connects to your Strava account and provides personalized fitness coaching through Claude Desktop. It analyzes your training data and gives you science-based advice on:

- Training load and recovery
- Heart rate zone optimization
- Performance trends and insights
- Personalized workout recommendations

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/KevinXu-github/MyFitnessGenie.git
cd MyFitnessGenie
npm install
```

### 2. Get Strava API Credentials
1. Go to https://www.strava.com/settings/api
2. Create a new app
3. Note your Client ID and Client Secret

### 3. Create .env File
```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_ACCESS_TOKEN=your_access_token
STRAVA_REFRESH_TOKEN=your_refresh_token
```

### 4. Authorize Strava
```bash
npm run build
node dist/auth-setup.js
# Follow the authorization steps
node dist/complete-auth.js "your_redirect_url"
```

### 5. Test Connection
```bash
npm run test
```

### 6. Configure Claude Desktop
Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "myfitnessgenie": {
      "command": "node",
      "args": ["C:\\path\\to\\your\\MyFitnessGenie\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "STRAVA_CLIENT_ID": "your_client_id",
        "STRAVA_CLIENT_SECRET": "your_client_secret",
        "STRAVA_ACCESS_TOKEN": "your_access_token",
        "STRAVA_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

### 7. Restart Claude Desktop
Close and reopen Claude Desktop to load MyFitnessGenie.

## How to Use

Once connected, you can ask Claude questions like:

- "Show me my recent activities"
- "Analyze my training load this week"
- "Should I do a hard workout today?"
- "How's my running progress?"
- "What heart rate zones should I train in?"

## Available Tools

- `get_recent_activities` - Your recent Strava activities
- `get_athlete_profile` - Your Strava profile info
- `analyze_training_load` - Training load analysis over any period
- `get_activity_details` - Detailed info about specific activities

## Data You'll Get

- Activity distance, duration, pace
- Heart rate data (when available)
- Training patterns and trends
- Science-based coaching recommendations
- Recovery and performance insights

## For Best Results

- Use Strava app on your Apple Watch for detailed heart rate data
- Track activities consistently
- Ask specific questions about your training
- Follow the coaching advice for optimal performance

## Troubleshooting

**Token Issues:** Re-run the authorization steps
**Claude Desktop Issues:** Check your config file path and restart Claude
**Missing Data:** Make sure your Strava privacy settings allow data access

---

**Ready to unlock your fitness potential? 🏃‍♂️💪**