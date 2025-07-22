// src/coaching/weight-loss-coach.ts

import { UserProfile } from '../types/user-profile.js';

export interface WeightLossAssessment {
  recommendation: string;
  reasoning: string;
  actionItems: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface RecentProgress {
  daysTracked: number;
  averageWeightChange: number; // lbs per week
  workoutsCompleted: number;
  workoutsPlanned: number;
  averageCalories?: number;
}

export class WeightLossCoach {
  
  static assessProgress(profile: UserProfile, progress: RecentProgress): WeightLossAssessment {
    
    // Calculate adherence rate
    const workoutAdherence = progress.workoutsPlanned > 0 
      ? progress.workoutsCompleted / progress.workoutsPlanned 
      : 0;
    
    // Analyze weight trend
    const expectedWeeklyLoss = -1.0; // Aiming for 1 lb per week loss
    const actualWeeklyLoss = progress.averageWeightChange;
    
    // Decision tree logic
    
    // Scenario 1: Great progress
    if (actualWeeklyLoss <= -0.5 && actualWeeklyLoss >= -2.0 && workoutAdherence >= 0.8) {
      return {
        recommendation: "Excellent progress! Keep doing exactly what you're doing.",
        reasoning: `You're losing ${Math.abs(actualWeeklyLoss).toFixed(1)} lbs per week with ${Math.round(workoutAdherence * 100)}% workout adherence. This is sustainable and healthy.`,
        actionItems: [
          "Continue your current eating and workout routine",
          "Take progress photos to track visual changes", 
          "Consider adding one new healthy habit to build momentum"
        ],
        urgency: 'low'
      };
    }
    
    // Scenario 2: Weight loss stalled
    if (actualWeeklyLoss > -0.2 && workoutAdherence >= 0.7) {
      return {
        recommendation: "Your weight loss has stalled. Time to make adjustments.",
        reasoning: "You're doing the workouts but not losing weight. This is normal - your metabolism has adapted.",
        actionItems: [
          "Reduce daily calories by 200 (temporarily)",
          "Add 10 minutes to your cardio sessions",
          "Track your food more carefully for a week",
          "Consider a 'refeed day' this weekend to reset metabolism"
        ],
        urgency: 'medium'
      };
    }
    
    // Scenario 3: Losing too fast
    if (actualWeeklyLoss < -2.5) {
      return {
        recommendation: "You're losing weight too quickly. Let's slow down for better health.",
        reasoning: "Rapid weight loss can cause muscle loss, fatigue, and metabolic damage.",
        actionItems: [
          "Increase daily calories by 200-300",
          "Add more protein to preserve muscle mass",
          "Focus on strength training to maintain muscle",
          "Monitor energy levels closely"
        ],
        urgency: 'high'
      };
    }
    
    // Scenario 4: Low workout adherence
    if (workoutAdherence < 0.5) {
      return {
        recommendation: "Let's focus on building a sustainable workout habit first.",
        reasoning: "Consistency beats intensity. Let's make workouts easier to stick with.",
        actionItems: [
          "Reduce workout time to 15-20 minutes",
          "Choose activities you actually enjoy", 
          "Set workout reminders on your phone",
          "Find an accountability partner or join a group"
        ],
        urgency: 'high'
      };
    }
    
    // Scenario 5: Eating too much despite workouts
    if (progress.averageCalories && progress.averageCalories > (profile.dailyCalories || 0) + 200) {
      return {
        recommendation: "Your workouts are great, but calories are too high for weight loss.",
        reasoning: `You're eating about ${progress.averageCalories} calories but need around ${profile.dailyCalories} for your goal.`,
        actionItems: [
          "Focus on protein at each meal to feel fuller",
          "Drink a large glass of water before meals",
          "Use smaller plates and measure portions",
          "Plan your meals in advance"
        ],
        urgency: 'medium'
      };
    }
    
    // Default: Need more data
    return {
      recommendation: "I need more information to give you the best advice.",
      reasoning: "Track your progress for a few more days so I can spot patterns.",
      actionItems: [
        "Weigh yourself daily at the same time",
        "Log your workouts when you complete them",
        "Track calories for at least 3 days",
        "Rate your energy and motivation daily (1-10)"
      ],
      urgency: 'low'
    };
  }
  
  // Simple daily advice based on recent activity
  static getDailyAdvice(profile: UserProfile, lastWorkout?: string, daysAgo?: number): string {
    
    if (!lastWorkout || !daysAgo) {
      return "Ready to start your fitness journey? Let's begin with a simple 20-minute walk today!";
    }
    
    // Recovery recommendations
    if (daysAgo === 0) {
      return "Great job on today's workout! Make sure to get good protein within 2 hours and stay hydrated.";
    }
    
    if (daysAgo === 1) {
      return "Perfect timing for your next workout! Your muscles have recovered. What sounds good today?";
    }
    
    if (daysAgo >= 3) {
      return "It's been a few days since your last workout. No judgment! Let's get back on track with something easy today.";
    }
    
    return "You're in a great routine! Keep up the consistency - that's the key to success.";
  }
}