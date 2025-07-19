import 'dotenv/config';
import axios from 'axios';

// Test Strava API connection
async function testStravaConnection() {
    console.log('🧞‍♂️ MyFitnessGenie - Testing Strava Connection...\n');
    
    const accessToken = process.env.STRAVA_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.error('❌ No access token found in .env file');
        return;
    }
    
    try {
        // Test 1: Get athlete info (your profile)
        console.log('📋 Getting your athlete profile...');
        const athleteResponse = await axios.get('https://www.strava.com/api/v3/athlete', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const athlete = athleteResponse.data;
        console.log(`✅ Connected to ${athlete.firstname} ${athlete.lastname}'s Strava account`);
        console.log(`📍 Location: ${athlete.city}, ${athlete.state}`);
        console.log(`🏃‍♂️ Follower count: ${athlete.follower_count}`);
        console.log(`📊 Activity count: ${athlete.activity_count}\n`);
        
        // Test 2: Get recent activities
        console.log('🏃‍♂️ Getting your recent activities...');
        const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                per_page: 5 // Get last 5 activities
            }
        });
        
        const activities = activitiesResponse.data;
        console.log(`✅ Found ${activities.length} recent activities:\n`);
        
        activities.forEach((activity: any, index: number) => {
            const date = new Date(activity.start_date).toLocaleDateString();
            const distance = (activity.distance / 1000).toFixed(2); // Convert to km
            const duration = Math.round(activity.moving_time / 60); // Convert to minutes
            
            console.log(`${index + 1}. ${activity.name}`);
            console.log(`   📅 ${date} | 🏃‍♂️ ${activity.type} | 📏 ${distance}km | ⏱️ ${duration}min`);
            if (activity.average_heartrate) {
                console.log(`   💓 Avg HR: ${Math.round(activity.average_heartrate)} bpm`);
            }
            console.log('');
        });
        
        console.log('🎉 Strava connection successful! Ready to build MyFitnessGenie! 🧞‍♂️');
        
    } catch (error: any) {
        console.error('❌ Error connecting to Strava:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Message: ${error.response.data.message || 'Unknown error'}`);
        } else {
            console.error(error.message);
        }
    }
}

// Run the test
testStravaConnection();