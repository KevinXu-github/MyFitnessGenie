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
import { TrueRAGCoachingTools } from './tools/rag-coaching-tools.js';

// MyFitnessGenie MCP Server - Complete RAG System
class MyFitnessGenieServer {
  private server: Server;
  private tokenManager: StravaTokenManager;

  constructor() {
    this.server = new Server(
      {
        name: "MyFitnessGenie",
        version: "3.0.0", // Full RAG with dynamic ingestion!
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
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Existing Strava tools
          {
            name: "get_recent_activities",
            description: "Get your recent Strava activities with details",
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
          },
          
          // Core RAG coaching tools
          {
            name: "setup_user_profile",
            description: "Set up your personalized fitness profile with RAG-powered coaching",
            inputSchema: {
              type: "object",
              properties: {
                age: { type: "number", description: "Your age in years" },
                gender: { type: "string", enum: ["male", "female"], description: "Your gender" },
                weight: { type: "number", description: "Your current weight in pounds" },
                height: { type: "number", description: "Your height in inches" },
                goal: { 
                  type: "string", 
                  enum: ["lose_weight", "gain_muscle", "get_fit"], 
                  description: "Your primary fitness goal" 
                },
                activityLevel: { 
                  type: "string", 
                  enum: ["sedentary", "lightly_active", "moderately_active", "very_active"], 
                  description: "Your typical activity level" 
                },
                targetWeight: { type: "number", description: "Your target weight in pounds (optional)" }
              },
              required: ["age", "gender", "weight", "height", "goal", "activityLevel"]
            }
          },
          {
            name: "log_progress",
            description: "Log your daily progress for enhanced RAG analysis",
            inputSchema: {
              type: "object",
              properties: {
                weight: { type: "number", description: "Your weight today in pounds" },
                workoutsToday: { type: "number", description: "Number of workouts completed today" },
                calories: { type: "number", description: "Calories consumed today" },
                notes: { type: "string", description: "Any notes about how you're feeling" }
              }
            }
          },
          {
            name: "get_coaching_advice",
            description: "Get RAG-powered personalized coaching advice using semantic search",
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
          
          // Dynamic knowledge ingestion tools
          {
            name: "add_website_knowledge",
            description: "Add knowledge from any website to enhance coaching advice",
            inputSchema: {
              type: "object",
              properties: {
                url: { 
                  type: "string", 
                  description: "URL of the website to add (e.g., fitness articles, research sites)" 
                },
                category: { 
                  type: "string", 
                  description: "Category for the content (e.g., 'nutrition', 'exercise', 'supplements')" 
                },
                description: { 
                  type: "string", 
                  description: "Optional description of what this website contains" 
                }
              },
              required: ["url"]
            }
          },
          {
            name: "add_file_knowledge",
            description: "Add knowledge from uploaded files (PDF, TXT, DOC) to personalize coaching",
            inputSchema: {
              type: "object",
              properties: {
                filePath: { 
                  type: "string", 
                  description: "Path to the file to add (PDF, TXT, MD, DOCX supported)" 
                },
                category: { 
                  type: "string", 
                  description: "Category for the content (e.g., 'research', 'plans', 'nutrition')" 
                },
                description: { 
                  type: "string", 
                  description: "Optional description of the file contents" 
                }
              },
              required: ["filePath"]
            }
          },
          
          // Enhanced search tools
          {
            name: "search_knowledge",
            description: "Search across ALL knowledge sources (built-in + added) with semantic similarity",
            inputSchema: {
              type: "object",
              properties: {
                topic: { 
                  type: "string", 
                  description: "Topic to search for across all knowledge sources" 
                },
                context: { 
                  type: "string", 
                  description: "Additional context to refine the search" 
                }
              },
              required: ["topic"]
            }
          },
          {
            name: "get_rag_stats",
            description: "Get complete analytics about the RAG system and knowledge base",
            inputSchema: {
              type: "object",
              properties: {}
            }
          }
        ]
      };
    });

    // Handle all tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Existing Strava tools
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
          
          // Core RAG coaching tools
          case "setup_user_profile":
            return await TrueRAGCoachingTools.setupUserProfile(args as any);
          case "log_progress":
            return await TrueRAGCoachingTools.logProgress(args as any);
          case "get_coaching_advice":
            return await TrueRAGCoachingTools.getCoachingAdvice(args as any);
          
          // Dynamic knowledge tools
          case "add_website_knowledge":
            return await TrueRAGCoachingTools.addWebsiteKnowledge(args as any);
          case "add_file_knowledge":
            return await TrueRAGCoachingTools.addFileKnowledge(args as any);
          
          // Enhanced search tools
          case "search_knowledge":
            return await TrueRAGCoachingTools.searchKnowledge(args as any);
          case "get_rag_stats":
            return await TrueRAGCoachingTools.getRAGStats();
          
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

  // Existing Strava methods (unchanged)
  private async getRecentActivities(count: number) {
    const accessToken = await this.tokenManager.getValidAccessToken();
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: { per_page: Math.min(count, 30) }
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
    console.error("🧞‍♂️ MyFitnessGenie v3.0 - Complete RAG System with Dynamic Knowledge Ingestion!");
  }
}

// Start the server
const server = new MyFitnessGenieServer();
server.run().catch(console.error);