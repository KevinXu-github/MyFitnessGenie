import { UserProfile, createUserProfile } from '../types/user-profile.js';
import { WeightLossCoach, RecentProgress } from '../coaching/weight-loss-coach.js';

// Simple in-memory storage 
let userProfile: UserProfile | null = null;
let progressHistory: Array<{date: string, weight: number, workouts: number}> = [];

export class PersonalizedCoachingTools {

  // Tool 1: Set up user profile
  static async setupUserProfile(args: {
    age: number;
    gender: 'male' | 'female';
    weight: number; // current weight in lbs
    height: number; // height in inches
    goal: 'lose_weight' | 'gain_muscle' | 'get_fit';
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    targetWeight?: number; // target weight in lbs
  }) {
    
    userProfile = createUserProfile(args);
    
    const heightFeet = Math.floor(args.height / 12);
    const heightInches = args.height % 12;
    
    return {
      content: [{
        type: "text",
        text: `🧞‍♂️ **Profile Created Successfully!**

**Your Stats:**
- Age: ${args.age} years old
- Height: ${heightFeet}'${heightInches}"
- Current Weight: ${args.weight} lbs
${args.targetWeight ? `- Target Weight: ${args.targetWeight} lbs (${Math.abs(args.weight - args.targetWeight)} lbs to ${args.weight > args.targetWeight ? 'lose' : 'gain'})` : ''}
- Goal: ${args.goal.replace('_', ' ').toUpperCase()}
- Activity Level: ${args.activityLevel.replace('_', ' ').toUpperCase()}

**Your Daily Targets:**
- Calories: ${userProfile.dailyCalories} per day
- Protein: ${userProfile.proteinTarget}g per day

**What's Next:**
1. Start tracking your daily weight
2. Log your workouts when you complete them  
3. Ask me for daily coaching advice anytime!

Ready to start your transformation? 💪`
      }]
    };
  }

  // Tool 2: Log daily progress
  static async logProgress(args: {
    weight?: number;
    workoutsToday?: number;
    calories?: number;
    notes?: string;
  }) {
    
    if (!userProfile) {
      return {
        content: [{
          type: "text", 
          text: "❌ Please set up your profile first using the setup_user_profile tool."
        }]
      };
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Update or add today's progress
    const existingIndex = progressHistory.findIndex(p => p.date === today);
    if (existingIndex >= 0) {
      if (args.weight) progressHistory[existingIndex].weight = args.weight;
      if (args.workoutsToday) progressHistory[existingIndex].workouts = args.workoutsToday;
    } else {
      progressHistory.push({
        date: today,
        weight: args.weight || userProfile.weight,
        workouts: args.workoutsToday || 0
      });
    }

    let response = `✅ **Progress Logged for Today**\n\n`;
    
    if (args.weight) {
      const weightChange = args.weight - userProfile.weight;
      const changeText = weightChange > 0 ? `+${weightChange.toFixed(1)}` : `${weightChange.toFixed(1)}`;
      response += `⚖️ Weight: ${args.weight} lbs (${changeText} lbs from start)\n`;
    }
    
    if (args.workoutsToday) {
      response += `💪 Workouts: ${args.workoutsToday} completed today\n`;
    }
    
    if (args.calories) {
      const target = userProfile.dailyCalories || 0;
      const difference = args.calories - target;
      const diffText = difference > 0 ? `+${difference}` : `${difference}`;
      response += `🍽️ Calories: ${args.calories} (${diffText} vs target of ${target})\n`;
    }
    
    if (args.notes) {
      response += `📝 Notes: ${args.notes}\n`;
    }
    
    response += `\n💡 Use 'get_coaching_advice' to see how you're doing overall!`;

    return {
      content: [{ type: "text", text: response }]
    };
  }

  // Tool 3: Get personalized coaching advice
  static async getCoachingAdvice(args: { days?: number }) {
    
    if (!userProfile) {
      return {
        content: [{
          type: "text",
          text: "❌ Please set up your profile first using the setup_user_profile tool."
        }]
      };
    }

    const daysToAnalyze = args.days || 7;
    const recentData = progressHistory.slice(-daysToAnalyze);
    
    if (recentData.length < 2) {
      return {
        content: [{
          type: "text",
          text: `📊 **Need More Data**
          
I need at least 2 days of progress logs to give you personalized advice. Please log your weight and workouts for a few more days, then ask for coaching advice again!

**Quick Tips for Today:**
${WeightLossCoach.getDailyAdvice(userProfile)}`
        }]
      };
    }

    // Calculate recent progress
    const firstWeight = recentData[0].weight;
    const lastWeight = recentData[recentData.length - 1].weight;
    const weightChange = lastWeight - firstWeight;
    const weeklyChange = (weightChange / recentData.length) * 7; // Convert to weekly rate
    
    const totalWorkouts = recentData.reduce((sum, day) => sum + day.workouts, 0);
    const avgWorkoutsPerWeek = (totalWorkouts / recentData.length) * 7;
    
    const progress: RecentProgress = {
      daysTracked: recentData.length,
      averageWeightChange: weeklyChange,
      workoutsCompleted: totalWorkouts,
      workoutsPlanned: recentData.length * 1, // Assume 1 workout per day planned
    };

    const assessment = WeightLossCoach.assessProgress(userProfile, progress);
    
    let urgencyEmoji = '';
    if (assessment.urgency === 'high') urgencyEmoji = '🚨';
    else if (assessment.urgency === 'medium') urgencyEmoji = '⚠️';
    else urgencyEmoji = '✅';

    return {
      content: [{
        type: "text",
        text: `🧞‍♂️ **Your Personal Coaching Report** ${urgencyEmoji}

**Recent Progress (${recentData.length} days):**
- Weight Change: ${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} lbs (${weeklyChange.toFixed(1)} lbs/week)
- Workouts: ${totalWorkouts} completed (${avgWorkoutsPerWeek.toFixed(1)}/week average)

**🎯 Recommendation:**
${assessment.recommendation}

**🤔 Why:**
${assessment.reasoning}

**📋 Action Items:**
${assessment.actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

---
💪 Keep up the great work! Small consistent actions lead to big results.`
      }]
    };
  }

  // Tool 4: Get daily motivation/advice  
  static async getDailyAdvice() {
    
    if (!userProfile) {
      return {
        content: [{
          type: "text",
          text: "❌ Please set up your profile first using the setup_user_profile tool."
        }]
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayProgress = progressHistory.find(p => p.date === today);
    const lastWorkoutEntry = progressHistory.slice().reverse().find(p => p.workouts > 0);
    const lastWorkoutDate = lastWorkoutEntry?.date;
    
    let daysAgo: number | undefined;
    if (lastWorkoutDate) {
      const lastDate = new Date(lastWorkoutDate);
      const todayDate = new Date(today);
      daysAgo = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const advice = WeightLossCoach.getDailyAdvice(userProfile, lastWorkoutDate ? 'workout' : undefined, daysAgo);
    
    let todayStatus = '';
    if (todayProgress?.workouts) {
      todayStatus = `🎉 You've already completed ${todayProgress.workouts} workout(s) today - amazing!\n\n`;
    }

    return {
      content: [{
        type: "text",
        text: `🌅 **Daily Coaching Check-in**

${todayStatus}${advice}

**Quick Reminder:**
- Calorie target: ${userProfile.dailyCalories} calories
- Protein target: ${userProfile.proteinTarget}g protein

Need specific workout suggestions or meal ideas? Just ask! 🧞‍♂️`
      }]
    };
  }
}