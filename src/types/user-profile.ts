// src/types/user-profile.ts

export interface UserProfile {
  // Basic Info
  age: number;
  gender: 'male' | 'female';
  weight: number; // lbs
  height: number; // inches
  
  // Simple Goal
  goal: 'lose_weight' | 'gain_muscle' | 'get_fit';
  targetWeight?: number; // lbs (only for weight loss)
  
  // Activity Level
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  
  // Calculated Values (we'll compute these)
  dailyCalories?: number;
  proteinTarget?: number; // grams
}

// Simple calculator class
export class SimpleCalculator {
  
  // Basic BMR calculation (Mifflin-St Jeor)
  static calculateBMR(weight: number, height: number, age: number, gender: string): number {
    // Convert lbs to kg and inches to cm for the formula
    const weightKg = weight * 0.453592;
    const heightCm = height * 2.54;
    
    const baseRate = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return gender === 'male' ? baseRate + 5 : baseRate - 161;
  }
  
  // Simple TDEE calculation
  static calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375, 
      'moderately_active': 1.55,
      'very_active': 1.725
    };
    
    return Math.round(bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2));
  }
  
  // Simple calorie target
  static calculateCalorieTarget(tdee: number, goal: string): number {
    if (goal === 'lose_weight') {
      return Math.round(tdee - 500); // 1 lb per week loss
    }
    
    if (goal === 'gain_muscle') {
      return Math.round(tdee + 300); // Small surplus
    }
    
    return tdee; // Maintenance for general fitness
  }
  
  // Simple protein target (1g per lb for weight loss/muscle gain, 0.8g for general fitness)
  static calculateProteinTarget(weight: number, goal: string): number {
    if (goal === 'lose_weight' || goal === 'gain_muscle') {
      return Math.round(weight); // 1g per lb
    }
    
    return Math.round(weight * 0.8); // 0.8g per lb for general fitness
  }
}

// Simple profile creation
export function createUserProfile(basicInfo: {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  goal: 'lose_weight' | 'gain_muscle' | 'get_fit';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  targetWeight?: number;
}): UserProfile {
  
  const bmr = SimpleCalculator.calculateBMR(
    basicInfo.weight,
    basicInfo.height, 
    basicInfo.age,
    basicInfo.gender
  );
  
  const tdee = SimpleCalculator.calculateTDEE(bmr, basicInfo.activityLevel);
  const dailyCalories = SimpleCalculator.calculateCalorieTarget(tdee, basicInfo.goal);
  const proteinTarget = SimpleCalculator.calculateProteinTarget(basicInfo.weight, basicInfo.goal);
  
  return {
    ...basicInfo,
    dailyCalories,
    proteinTarget
  };
}