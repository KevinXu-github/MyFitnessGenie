import 'dotenv/config';

// One-time setup to get proper access tokens with activity read scope
async function setupStravaAuth() {
    console.log('🧞‍♂️ MyFitnessGenie - Setting up Strava Authorization...\n');
    
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error('❌ Missing Client ID or Client Secret in .env file');
        return;
    }
    
    // Step 1: Generate authorization URL
    const scope = 'read,activity:read_all'; // Request activity read permissions
    const redirectUri = 'http://localhost';
    
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
    
    console.log('📋 STEP 1: Visit this URL in your browser:');
    console.log('📝 Copy the full URL and paste it below after you authorize\n');
    console.log('🔗 Authorization URL:');
    console.log(authUrl);
    console.log('\n🚨 IMPORTANT:');
    console.log('1. Click the link above');
    console.log('2. Click "Authorize" on Strava');
    console.log('3. You\'ll be redirected to localhost (this will fail - that\'s OK!)');
    console.log('4. Copy the FULL redirect URL from your browser address bar');
    console.log('5. Come back here and paste it\n');
    
    console.log('📋 STEP 2: After authorization, your browser will show an error page.');
    console.log('The URL will look like: http://localhost/?state=&code=XXXXXX&scope=read,activity:read_all');
    console.log('Copy that ENTIRE URL and run this command:');
    console.log('\n💻 COMMAND TO RUN NEXT:');
    console.log('node dist/complete-auth.js "YOUR_FULL_REDIRECT_URL_HERE"');
    console.log('\nExample:');
    console.log('node dist/complete-auth.js "http://localhost/?state=&code=abc123&scope=read,activity:read_all"');
}

// Run the setup
setupStravaAuth();