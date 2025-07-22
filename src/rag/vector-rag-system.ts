// src/rag/vector-rag-system.ts

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    category: string;
    source: string;
    relevance_score?: number;
  };
  embedding?: number[]; // Vector representation
}

export interface RAGQuery {
  query: string;
  userContext: {
    goal: string;
    currentSituation: string;
    userProfile: any;
  };
}

// This would be your fitness knowledge base split into chunks
const FITNESS_DOCUMENTS: DocumentChunk[] = [
  {
    id: "plateau_1",
    content: "Weight loss plateaus occur when your metabolism adapts to sustained calorie restriction. The body reduces NEAT (non-exercise activity thermogenesis) by up to 15% and increases hunger hormones like ghrelin while decreasing leptin sensitivity.",
    metadata: { category: "weight_loss", source: "metabolic_research" }
  },
  {
    id: "plateau_2", 
    content: "Research shows that strategic refeed days can restore leptin levels and thyroid function. A 2-day period eating at maintenance calories can reset metabolic hormones and break through plateaus in 70% of cases.",
    metadata: { category: "weight_loss", source: "hormone_research" }
  },
  {
    id: "protein_1",
    content: "Protein requirements for weight loss are higher than for maintenance. Studies indicate 1.2-1.6g per lb of body weight preserves muscle mass during calorie restriction. Protein also has the highest thermic effect, burning 20-30% of calories consumed.",
    metadata: { category: "nutrition", source: "protein_research" }
  },
  {
    id: "cardio_1",
    content: "The fat-burning zone (Zone 2, 60-70% max HR) burns 85% fat vs 15% carbs, but higher intensity intervals burn more total calories. Optimal fat loss combines 80% Zone 2 work with 20% high-intensity intervals.",
    metadata: { category: "exercise", source: "cardio_research" }
  },
  {
    id: "sleep_1",
    content: "Sleep deprivation increases ghrelin by 15% and decreases leptin by 18%, leading to increased appetite and cravings. People sleeping 5.5 hours lose 55% less fat than those sleeping 8.5 hours despite identical calorie intake.",
    metadata: { category: "recovery", source: "sleep_research" }
  },
  {
    id: "habits_1",
    content: "Habit formation takes an average of 66 days, with a range of 18-254 days depending on complexity. The key is consistency over intensity - performing a behavior 90% of the time is more effective than 100% intensity 50% of the time.",
    metadata: { category: "psychology", source: "behavioral_research" }
  }
];

// Mock embedding function (in production, you'd use OpenAI or local model)
function getMockEmbedding(text: string): number[] {
  // This is a simplified mock - real embeddings are 1536-dimensional vectors
  // In production: const embedding = await openai.embeddings.create({model: "text-embedding-ada-002", input: text});
  
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(50).fill(0); // Mock 50-dimensional vector
  
  // Mock semantic understanding based on keywords
  const weightKeywords = ['weight', 'loss', 'plateau', 'deficit', 'metabolism'];
  const proteinKeywords = ['protein', 'muscle', 'amino', 'leucine', 'synthesis'];
  const exerciseKeywords = ['exercise', 'cardio', 'zone', 'heart', 'rate', 'training'];
  const sleepKeywords = ['sleep', 'recovery', 'hormone', 'leptin', 'ghrelin'];
  
  weightKeywords.forEach((keyword, i) => {
    if (words.some(word => word.includes(keyword))) {
      embedding[i] = 1;
    }
  });
  
  proteinKeywords.forEach((keyword, i) => {
    if (words.some(word => word.includes(keyword))) {
      embedding[10 + i] = 1;
    }
  });
  
  exerciseKeywords.forEach((keyword, i) => {
    if (words.some(word => word.includes(keyword))) {
      embedding[20 + i] = 1;
    }
  });
  
  sleepKeywords.forEach((keyword, i) => {
    if (words.some(word => word.includes(keyword))) {
      embedding[30 + i] = 1;
    }
  });
  
  return embedding;
}

// Cosine similarity for vector comparison
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (mag1 * mag2) || 0;
}

export class TrueRAGSystem {
  private documents: DocumentChunk[] = [];
  
  constructor() {
    // Initialize with pre-computed embeddings
    this.documents = FITNESS_DOCUMENTS.map(doc => ({
      ...doc,
      embedding: getMockEmbedding(doc.content)
    }));
  }
  
  // Semantic search using vector similarity
  async searchSimilarDocuments(query: string, topK: number = 3): Promise<DocumentChunk[]> {
    const queryEmbedding = getMockEmbedding(query);
    
    // Calculate similarity scores
    const scoredDocs = this.documents.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        relevance_score: cosineSimilarity(queryEmbedding, doc.embedding!)
      }
    }));
    
    // Sort by relevance and return top K
    return scoredDocs
      .sort((a, b) => (b.metadata.relevance_score || 0) - (a.metadata.relevance_score || 0))
      .slice(0, topK);
  }
  
  // True RAG: Retrieve relevant context and generate response
  async generateRAGResponse(ragQuery: RAGQuery): Promise<string> {
    // 1. Retrieve relevant documents
    const relevantDocs = await this.searchSimilarDocuments(ragQuery.query, 3);
    
    // 2. Build context from retrieved documents
    const context = relevantDocs
      .map(doc => `**Source**: ${doc.metadata.source} (Relevance: ${(doc.metadata.relevance_score! * 100).toFixed(1)}%)\n${doc.content}`)
      .join('\n\n');
    
    // 3. Create enriched prompt with context
    const enrichedPrompt = `
**Context Information:**
${context}

**User Situation:**
- Goal: ${ragQuery.userContext.goal}
- Current Situation: ${ragQuery.userContext.currentSituation}

**User Query:** ${ragQuery.query}

**Instructions:** Based on the scientific context above and the user's specific situation, provide practical, actionable advice. Reference the research but make it applicable to their goals.
`;
    
    // 4. In production, this would go to an LLM
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: enrichedPrompt }]
    // });
    
    // For now, return the enriched prompt (this would be the LLM's input)
    return this.mockLLMResponse(enrichedPrompt, relevantDocs);
  }
  
  // Mock LLM response based on retrieved context
  private mockLLMResponse(prompt: string, retrievedDocs: DocumentChunk[]): string {
    const categories = [...new Set(retrievedDocs.map(doc => doc.metadata.category))];
    const avgRelevance = retrievedDocs.reduce((sum, doc) => sum + (doc.metadata.relevance_score || 0), 0) / retrievedDocs.length;
    
    let response = `**RAG-Enhanced Response** (${(avgRelevance * 100).toFixed(1)}% relevance)\n\n`;
    
    if (categories.includes('weight_loss')) {
      response += `**Weight Loss Science:**\n${retrievedDocs.find(d => d.metadata.category === 'weight_loss')?.content}\n\n`;
    }
    
    if (categories.includes('nutrition')) {
      response += `**Nutrition Research:**\n${retrievedDocs.find(d => d.metadata.category === 'nutrition')?.content}\n\n`;
    }
    
    if (categories.includes('exercise')) {
      response += `**Exercise Science:**\n${retrievedDocs.find(d => d.metadata.category === 'exercise')?.content}\n\n`;
    }
    
    response += `**Retrieved Sources:** ${retrievedDocs.map(d => d.metadata.source).join(', ')}\n`;
    response += `**Semantic Match Quality:** ${(avgRelevance * 100).toFixed(1)}%`;
    
    return response;
  }
  
  // Add new documents to the knowledge base
  async addDocument(content: string, metadata: { category: string; source: string }): Promise<void> {
    const embedding = getMockEmbedding(content);
    const doc: DocumentChunk = {
      id: `doc_${Date.now()}`,
      content,
      metadata,
      embedding
    };
    this.documents.push(doc);
  }
  
  // Get knowledge base statistics
  getStats(): { totalDocs: number; categories: string[]; avgEmbeddingDimension: number } {
    const categories = [...new Set(this.documents.map(doc => doc.metadata.category))];
    const avgDimension = this.documents[0]?.embedding?.length || 0;
    
    return {
      totalDocs: this.documents.length,
      categories,
      avgEmbeddingDimension: avgDimension
    };
  }
}

// Integration with your coaching system
export class RAGCoachingSystem {
  private ragSystem: TrueRAGSystem;
  
  constructor() {
    this.ragSystem = new TrueRAGSystem();
  }
  
  async getRAGEnhancedAdvice(userQuery: string, userProfile: any, currentSituation: string): Promise<string> {
    const ragQuery: RAGQuery = {
      query: userQuery,
      userContext: {
        goal: userProfile.goal,
        currentSituation,
        userProfile
      }
    };
    
    return await this.ragSystem.generateRAGResponse(ragQuery);
  }
  
  async searchKnowledge(topic: string, userGoal: string): Promise<DocumentChunk[]> {
    return await this.ragSystem.searchSimilarDocuments(`${topic} for ${userGoal}`, 3);
  }
}