import { UserProfile, createUserProfile } from '../types/user-profile.js';
import { RAGCoachingSystem, DocumentChunk } from '../rag/vector-rag-system.js';
import { EnhancedRAGSystem } from '../rag/dynamic-knowledge-ingestion.js';

// Simple in-memory storage
let userProfile: UserProfile | null = null;
let progressHistory: Array<{date: string, weight: number, workouts: number, calories?: number}> = [];

export class TrueRAGCoachingTools {
  private static ragSystem = new RAGCoachingSystem();
  private static enhancedRAG = new EnhancedRAGSystem();

  // Existing tools (unchanged)...
  static async setupUserProfile(args: {
    age: number;
    gender: 'male' | 'female';
    weight: number;
    height: number;
    goal: 'lose_weight' | 'gain_muscle' | 'get_fit';
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    targetWeight?: number;
  }) {
    
    userProfile = createUserProfile(args);
    
    const heightFeet = Math.floor(args.height / 12);
    const heightInches = args.height % 12;
    
    return {
      content: [{
        type: "text",
        text: `🧞‍♂️ **True RAG-Powered Profile Created!**

**Your Stats:**
- Age: ${args.age} years old
- Height: ${heightFeet}'${heightInches}"
- Current Weight: ${args.weight} lbs
${args.targetWeight ? `- Target Weight: ${args.targetWeight} lbs` : ''}
- Goal: ${args.goal.replace('_', ' ').toUpperCase()}

**Your Personalized Targets:**
- Calories: ${userProfile.dailyCalories} per day
- Protein: ${userProfile.proteinTarget}g per day

**🧠 RAG System Status:** 
- Knowledge Base: Loaded with fitness research
- Semantic Search: Active
- Dynamic Ingestion: Ready for websites/files
- Personalization: Enabled for ${args.goal}

Ready for AI-powered coaching with expandable knowledge! 🚀`
      }]
    };
  }

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
          text: "❌ Please set up your profile first."
        }]
      };
    }

    const today = new Date().toISOString().split('T')[0];
    
    const existingIndex = progressHistory.findIndex(p => p.date === today);
    if (existingIndex >= 0) {
      if (args.weight) progressHistory[existingIndex].weight = args.weight;
      if (args.workoutsToday) progressHistory[existingIndex].workouts = args.workoutsToday;
      if (args.calories) progressHistory[existingIndex].calories = args.calories;
    } else {
      progressHistory.push({
        date: today,
        weight: args.weight || userProfile.weight,
        workouts: args.workoutsToday || 0,
        calories: args.calories
      });
    }

    let response = `✅ **Progress Logged with Enhanced RAG**\n\n`;
    
    if (args.weight) {
      const weightChange = args.weight - userProfile.weight;
      response += `⚖️ Weight: ${args.weight} lbs (${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} lbs)\n`;
    }
    
    if (args.workoutsToday) {
      response += `💪 Workouts: ${args.workoutsToday} completed\n`;
    }
    
    if (args.calories) {
      const target = userProfile.dailyCalories || 0;
      const difference = args.calories - target;
      response += `🍽️ Calories: ${args.calories} (${difference >= 0 ? '+' : ''}${difference} vs target)\n`;
    }
    
    response += `\n🧠 **Enhanced RAG:** Add websites/files for even more personalized advice!`;

    return {
      content: [{ type: "text", text: response }]
    };
  }

  static async getCoachingAdvice(args: { days?: number }) {
    
    if (!userProfile) {
      return {
        content: [{
          type: "text",
          text: "❌ Please set up your profile first."
        }]
      };
    }

    const daysToAnalyze = args.days || 7;
    const recentData = progressHistory.slice(-daysToAnalyze);
    
    if (recentData.length < 2) {
      const ragAdvice = await this.ragSystem.getRAGEnhancedAdvice(
        "I'm just starting my fitness journey and need guidance on tracking and consistency",
        userProfile,
        "new_user_insufficient_data"
      );
      
      return {
        content: [{
          type: "text",
          text: `🧠 **RAG-Powered Beginner Guidance**

I need more data for personalized analysis, but here's what the science says:

${ragAdvice}

**💡 Enhance Your Coaching:** Add websites, research papers, or files to expand my knowledge base for even more personalized advice!

**Next Steps:** Log your progress for a few more days for deeper analysis!`
        }]
      };
    }

    // Analyze progress
    const firstWeight = recentData[0].weight;
    const lastWeight = recentData[recentData.length - 1].weight;
    const weightChange = lastWeight - firstWeight;
    const weeklyChange = (weightChange / recentData.length) * 7;
    
    const totalWorkouts = recentData.reduce((sum, day) => sum + day.workouts, 0);
    const workoutAdherence = totalWorkouts / recentData.length;
    
    // Create context-aware RAG query
    let ragQuery = '';
    let currentSituation = '';
    
    if (weeklyChange > -0.2 && workoutAdherence >= 0.7) {
      ragQuery = "my weight loss has plateaued despite consistent exercise what should I do";
      currentSituation = `plateau_with_exercise_adherence_${workoutAdherence.toFixed(1)}`;
    } else if (weeklyChange < -2.5) {
      ragQuery = "I'm losing weight too quickly what are the risks and how should I slow down";
      currentSituation = `rapid_weight_loss_${Math.abs(weeklyChange).toFixed(1)}_lbs_per_week`;
    } else if (workoutAdherence < 0.5) {
      ragQuery = "I'm struggling with workout consistency and building exercise habits";
      currentSituation = `low_adherence_${(workoutAdherence * 100).toFixed(0)}_percent`;
    } else {
      ragQuery = `I'm making progress with ${Math.abs(weeklyChange).toFixed(1)} lbs per week loss how can I optimize further`;
      currentSituation = `steady_progress_${Math.abs(weeklyChange).toFixed(1)}_lbs_per_week`;
    }

    // Get RAG-enhanced advice
    const ragAdvice = await this.ragSystem.getRAGEnhancedAdvice(
      ragQuery,
      userProfile,
      currentSituation
    );

    // Also search enhanced knowledge base
    const enhancedResults = await this.enhancedRAG.searchEnhancedKnowledge(ragQuery, 2);
    const enhancedContext = enhancedResults.length > 0 
      ? `\n\n**📚 Additional Sources:**\n${enhancedResults.map(doc => `• ${doc.metadata.source}: ${doc.content.substring(0, 100)}...`).join('\n')}`
      : '';

    return {
      content: [{
        type: "text",
        text: `🧞‍♂️ **Enhanced RAG Personal Coaching Analysis**

**📊 Your Progress Pattern (${recentData.length} days):**
- Weight Change: ${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} lbs (${weeklyChange.toFixed(1)} lbs/week)
- Workout Adherence: ${(workoutAdherence * 100).toFixed(0)}%
- Data Quality: ${recentData.length >= 7 ? 'Excellent' : 'Good'}

**🧠 RAG Analysis:**
${ragAdvice}${enhancedContext}

**🔍 Query:** "${ragQuery}"
**📊 Context:** ${currentSituation}

**💡 Want Even Better Advice?** Add research papers, websites, or files to enhance my knowledge base!

---
*Powered by semantic search across scientific fitness research + your custom knowledge sources*`
      }]
    };
  }

  // NEW DYNAMIC KNOWLEDGE TOOLS

  // Tool: Add website knowledge
  static async addWebsiteKnowledge(args: {
    url: string;
    category?: string;
    description?: string;
  }) {
    
    try {
      const chunksAdded = await this.enhancedRAG.addWebsiteKnowledge(
        args.url, 
        args.category || 'fitness'
      );
      
      const stats = this.enhancedRAG.getKnowledgeStats();
      
      return {
        content: [{
          type: "text",
          text: `🌐 **Website Knowledge Added Successfully!**

**Source:** ${args.url}
**Category:** ${args.category || 'fitness'}
**Chunks Added:** ${chunksAdded} new document chunks
${args.description ? `**Description:** ${args.description}` : ''}

**📊 Updated Knowledge Base:**
- Total Documents: ${stats.totalDocuments}
- Categories: ${stats.categories.join(', ')}
- Sources: ${stats.sources.length} unique sources

**🧠 RAG Enhancement:** This content is now searchable and will be included in coaching advice!

**Try This:** Ask for coaching advice or search for topics from this website!`
        }]
      };
      
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `❌ **Failed to add website knowledge**

Error: ${error.message}

**Common Issues:**
- Website might block automated access
- URL might be incorrect
- Content might not be text-based

Try a different URL or check if the site is publicly accessible.`
        }]
      };
    }
  }

  // Tool: Add file knowledge  
  static async addFileKnowledge(args: {
    filePath: string;
    category?: string;
    description?: string;
  }) {
    
    try {
      const chunksAdded = await this.enhancedRAG.addFileKnowledge(
        args.filePath,
        args.category || 'fitness'
      );
      
      const stats = this.enhancedRAG.getKnowledgeStats();
      
      return {
        content: [{
          type: "text",
          text: `📄 **File Knowledge Added Successfully!**

**File:** ${args.filePath}
**Category:** ${args.category || 'fitness'}
**Chunks Added:** ${chunksAdded} new document chunks
${args.description ? `**Description:** ${args.description}` : ''}

**📊 Enhanced Knowledge Base:**
- Total Documents: ${stats.totalDocuments}
- Categories: ${stats.categories.join(', ')}
- Sources: ${stats.sources.length} unique sources

**🧠 Integration Complete:** Your file content is now part of the RAG system!

**Supported:** PDF, TXT, MD, DOCX files
**Next:** Ask questions about your file content!`
        }]
      };
      
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `❌ **Failed to add file knowledge**

Error: ${error.message}

**Troubleshooting:**
- Check file path and permissions
- Supported: PDF, TXT, MD, DOCX
- File should contain substantial text content`
        }]
      };
    }
  }

  // Tool: Search all knowledge (static + dynamic)
  static async searchKnowledge(args: {
    topic: string;
    context?: string;
  }) {
    
    if (!userProfile) {
      return {
        content: [{
          type: "text",
          text: "❌ Please set up your profile first for personalized knowledge search."
        }]
      };
    }

    // Search both systems
    const staticResults = await this.ragSystem.searchKnowledge(args.topic, userProfile.goal);
    const dynamicResults = await this.enhancedRAG.searchEnhancedKnowledge(args.topic, 3);
    
    const allResults = [...staticResults, ...dynamicResults];
    const stats = this.enhancedRAG.getKnowledgeStats();

    return {
      content: [{
        type: "text",
        text: `🔍 **Complete Knowledge Search: "${args.topic}"**

**🧠 Static Knowledge Results:**
${staticResults.map((doc: DocumentChunk, i: number) => 
  `${i + 1}. **${doc.metadata.category}** - ${doc.content.substring(0, 100)}...`
).join('\n')}

**📚 Dynamic Knowledge Results:**
${dynamicResults.length > 0 
  ? dynamicResults.map((doc, i) => 
      `${i + 1}. **${doc.metadata.source}** (${((doc.metadata.relevance_score || 0) * 100).toFixed(1)}% match)\n   ${doc.content.substring(0, 100)}...`
    ).join('\n')
  : 'No dynamic knowledge sources added yet'
}

**📊 Search Stats:**
- Static sources: ${staticResults.length} results
- Dynamic sources: ${dynamicResults.length} results  
- Total knowledge base: ${stats.totalDocuments} documents
- Sources available: ${stats.sources.length}

**💡 Add websites or files to get even more comprehensive answers!**`
      }]
    };
  }

  // Tool: Knowledge base analytics
  static async getRAGStats() {
    const staticStats = { documents: 6, categories: ['weight_loss', 'nutrition', 'exercise'] }; // Mock static stats
    const dynamicStats = this.enhancedRAG.getKnowledgeStats();
    
    return {
      content: [{
        type: "text",
        text: `🧠 **Complete RAG System Analytics**

**📊 Static Knowledge Base:**
- Built-in documents: ${staticStats.documents}
- Core categories: ${staticStats.categories.join(', ')}
- Status: Always available

**📈 Dynamic Knowledge Base:**
- Added documents: ${dynamicStats.totalDocuments}
- Unique sources: ${dynamicStats.sources.length}
- Categories: ${dynamicStats.categories.join(', ') || 'None added yet'}
- Most recent: ${dynamicStats.mostRecentlyAdded}

**🔬 RAG Capabilities:**
- Semantic search across ALL sources ✅
- Context-aware retrieval ✅
- Multi-document synthesis ✅
- Real-time knowledge expansion ✅
- Website ingestion ✅
- File processing (PDF, DOC, TXT) ✅

**💡 Your RAG system combines built-in fitness science with YOUR custom knowledge!**

**Add More:** Use 'add_website_knowledge' or 'add_file_knowledge' to expand further.`
      }]
    };
  }
}