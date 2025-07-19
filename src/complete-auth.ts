import 'dotenv/config';
import axios from 'axios';

// Complete the OAuth flow and get proper access tokens
async function completeAuth() {
    const redirectUrl = process.argv[2];
    
    if (!redirectUrl) {
        console.error('❌ Please provide the redirect URL as an argument');
        console.error('Usage: node dist/complete-auth.js "http://localhost/?code=..."');
        return;
    }
    
    console.log('🧞‍♂️ MyFitnessGenie - Completing Strava Authorization...\n');
    
    // Extract the authorization code from the URL
    const url = new URL(redirectUrl);
    const code = url.searchParams.get('code');
    
    if (!code) {
        console.error('❌ No authorization code found in URL');
        console.error('Make sure the URL contains ?code=...');
        return;
    }
    
    console.log('✅ Found authorization code:', code.substring(0, 10) + '...\n');
    
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    
    try {
        // Exchange authorization code for access tokens
        console.log('🔄 Exchanging code for access tokens...');
        
        const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code'
        });
        
        const tokens = tokenResponse.data;
        
        console.log('🎉 SUCCESS! Got new tokens with activity read permissions:\n');
        console.log('📋 UPDATE YOUR .env FILE:');
        console.log('Replace the STRAVA_ACCESS_TOKEN line with:');
        console.log(`STRAVA_ACCESS_TOKEN=${tokens.access_token}`);
        console.log('\n📋 ALSO ADD THIS LINE:');
        console.log(`STRAVA_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('\n💡 Token Info:');
        console.log(`Expires at: ${new Date(tokens.expires_at * 1000).toLocaleString()}`);
        console.log(`Scope: ${tokens.scope}`);
        console.log('\n🚀 After updating .env, run: npm run test');
        
    } catch (error: any) {
        console.error('❌ Error getting tokens:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Message:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Run the completion
completeAuth();