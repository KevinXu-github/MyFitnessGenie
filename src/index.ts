#!/usr/bin/env node

import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import { StravaTokenManager } from './token-manager.js';

// MyFitnessGenie MCP Server
class MyFitnessGenieServer {
  private server: Server;
  private tokenManager: StravaTokenManager;

  constructor() {
    this.server = new Server(
      {
        name: "MyFitnessGenie",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tokenManager = new StravaTokenManager();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_recent_activities",
            description: "Get your recent Strava activities with details like distance, duration, heart rate",
            inputSchema: {
              type: "object",
              properties: {
                count: {
                  type: "number",
                  description: "Number of recent activities to fetch (default: 10)",
                  default: 10
                }
              }
            }
          },
          {
            name: "get_athlete_profile",
            description: "Get your Strava athlete profile information",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "analyze_training_load",
            description: "Analyze your recent training load and intensity distribution",
            inputSchema: {
              type: "object",
              properties: {
                days: {
                  type: "number",
                  description: "Number of days to analyze (default: 7)",
                  default: 7
                }
              }
            }
          },
          {
            name: "get_activity_details",
            description: "Get detailed information about a specific activity",
            inputSchema: {
              type: "object",
              properties: {
                activity_id: {
                  type: "string",
                  description: "Strava activity ID"
                }
              },
              required: ["activity_id"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_recent_activities":
            return await this.getRecentActivities((args as any)?.count || 10);
          
          case "get_athlete_profile":
            return await this.getAthleteProfile();
          
          case "analyze_training_load":
            return await this.analyzeTrainingLoad((args as any)?.days || 7);
          
          case "get_activity_details":
            if (!(args as any)?.activity_id) {
              throw new Error("activity_id is required");
            }
            return await this.getActivityDetails((args as any).activity_id);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  private async getRecentActivities(count: number) {
    const accessToken = await this.tokenManager.getValidAccessToken();
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { per_page: Math.min(count, 30) } // Strava max is 30
    });

    const activities = response.data;
    
    const summary = activities.map((activity: any) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      date: new Date(activity.start_date).toLocaleDateString(),
      distance_km: (activity.distance / 1000).toFixed(2),
      duration_minutes: Math.round(activity.moving_time / 60),
      avg_heart_rate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
      max_heart_rate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
      avg_pace_per_km: activity.type === 'Run' && activity.distance > 0 ? 
        this.formatPace(activity.moving_time / (activity.distance / 1000)) : null,
      elevation_gain: activity.total_elevation_gain
    }));

    return {
      content: [
        {
          type: "text",
          text: `Found ${activities.length} recent activities:\n\n${JSON.stringify(summary, null, 2)}`
        }
      ]
    };
  }

  private async getAthleteProfile() {
    const accessToken = await this.tokenManager.getValidAccessToken();
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const athlete = response.data;
    
    return {
      content: [
        {
          type: "text", 
          text: `Athlete Profile:
Name: ${athlete.firstname} ${athlete.lastname}
Location: ${athlete.city}, ${athlete.state}
Total Activities: ${athlete.activity_count || 'Unknown'}
Followers: ${athlete.follower_count || 'Unknown'}
Created: ${new Date(athlete.created_at).toLocaleDateString()}
Profile: ${athlete.profile}`
        }
      ]
    };
  }

  private async analyzeTrainingLoad(days: number) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    const accessToken = await this.tokenManager.getValidAccessToken();
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { 
        after: Math.floor(sinceDate.getTime() / 1000),
        per_page: 50
      }
    });

    const activities = response.data;
    
    if (activities.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No activities found in the last ${days} days.`
          }
        ]
      };
    }

    // Calculate training metrics
    const totalDistance = activities.reduce((sum: number, a: any) => sum + (a.distance || 0), 0) / 1000;
    const totalTime = activities.reduce((sum: number, a: any) => sum + (a.moving_time || 0), 0) / 60;
    const avgHeartRate = activities
      .filter((a: any) => a.average_heartrate)
      .reduce((sum: number, a: any, _: any, arr: any[]) => sum + a.average_heartrate / arr.length, 0);

    const activityTypes = activities.reduce((types: any, a: any) => {
      types[a.type] = (types[a.type] || 0) + 1;
      return types;
    }, {});

    return {
      content: [
        {
          type: "text",
          text: `Training Load Analysis (Last ${days} days):
          
📊 **Summary:**
- Total Activities: ${activities.length}
- Total Distance: ${totalDistance.toFixed(2)} km
- Total Time: ${(totalTime / 60).toFixed(1)} hours
- Average Heart Rate: ${avgHeartRate ? Math.round(avgHeartRate) + ' bpm' : 'No HR data'}

🏃‍♂️ **Activity Breakdown:**
${Object.entries(activityTypes).map(([type, count]) => `- ${type}: ${count} activities`).join('\n')}

💡 **Weekly Averages:**
- Distance per week: ${(totalDistance * 7 / days).toFixed(1)} km
- Time per week: ${(totalTime * 7 / days / 60).toFixed(1)} hours
- Activities per week: ${(activities.length * 7 / days).toFixed(1)}`
        }
      ]
    };
  }

  private async getActivityDetails(activityId: string) {
    const accessToken = await this.tokenManager.getValidAccessToken();
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const activity = response.data;
    
    return {
      content: [
        {
          type: "text",
          text: `Detailed Activity Information:

🏃‍♂️ **${activity.name}**
- Type: ${activity.type}
- Date: ${new Date(activity.start_date).toLocaleString()}
- Distance: ${(activity.distance / 1000).toFixed(2)} km
- Duration: ${Math.round(activity.moving_time / 60)} minutes
- Elevation Gain: ${activity.total_elevation_gain}m

💓 **Heart Rate:**
- Average: ${activity.average_heartrate ? Math.round(activity.average_heartrate) + ' bpm' : 'No data'}
- Maximum: ${activity.max_heartrate ? Math.round(activity.max_heartrate) + ' bpm' : 'No data'}

⚡ **Performance:**
- Average Speed: ${activity.average_speed ? (activity.average_speed * 3.6).toFixed(1) + ' km/h' : 'No data'}
- Calories: ${activity.calories || 'No data'}
- Perceived Effort: ${activity.perceived_exertion || 'No data'}

📍 **Location:**
- Start: ${activity.start_latlng ? activity.start_latlng.join(', ') : 'No GPS data'}
- End: ${activity.end_latlng ? activity.end_latlng.join(', ') : 'No GPS data'}`
        }
      ]
    };
  }

  private formatPace(secondsPerKm: number): string {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🧞‍♂️ MyFitnessGenie MCP Server running");
  }
}

// Start the server
const server = new MyFitnessGenieServer();
server.run().catch(console.error);