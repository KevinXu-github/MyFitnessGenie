import { DocumentChunk } from './vector-rag-system.js';

// Mock embedding function
function getMockEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(50).fill(0);
  
  const fitnessKeywords = ['fitness', 'exercise', 'weight', 'muscle', 'cardio', 'nutrition', 'protein'];
  
  fitnessKeywords.forEach((keyword, i) => {
    if (words.some(word => word.includes(keyword))) {
      embedding[i] = 1;
    }
  });
  
  return embedding;
}

// Cosine similarity function
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (mag1 * mag2) || 0;
}

export class EnhancedRAGSystem {
  private documents: DocumentChunk[] = [];
  
  constructor(initialDocuments: DocumentChunk[] = []) {
    this.documents = [...initialDocuments];
  }
  
  // Add website knowledge (simplified)
  async addWebsiteKnowledge(url: string, category: string = 'fitness'): Promise<number> {
    try {
      // In a real implementation, you'd fetch and parse the website
      // For now, we'll create a mock document
      const mockContent = `Content from ${url} about ${category}. This would contain the actual website content in a real implementation.`;
      
      const doc: DocumentChunk = {
        id: `web_${Date.now()}`,
        content: mockContent,
        metadata: {
          category,
          source: `website_${new URL(url).hostname}`,
          relevance_score: 0
        },
        embedding: getMockEmbedding(mockContent)
      };
      
      this.documents.push(doc);
      return 1; // Return number of chunks added
      
    } catch (error) {
      console.error(`Failed to add website: ${error}`);
      return 0;
    }
  }
  
  // Add file knowledge (simplified)
  async addFileKnowledge(filePath: string, category: string = 'fitness'): Promise<number> {
    try {
      // In a real implementation, you'd read and parse the file
      const mockContent = `Content from file ${filePath} in category ${category}. This would contain the actual file content.`;
      
      const doc: DocumentChunk = {
        id: `file_${Date.now()}`,
        content: mockContent,
        metadata: {
          category,
          source: `file_${filePath.split('/').pop()}`,
          relevance_score: 0
        },
        embedding: getMockEmbedding(mockContent)
      };
      
      this.documents.push(doc);
      return 1;
      
    } catch (error) {
      console.error(`Failed to add file: ${error}`);
      return 0;
    }
  }
  
  // Search enhanced knowledge
  async searchEnhancedKnowledge(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    if (this.documents.length === 0) {
      return [];
    }
    
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
  
  // Get knowledge base stats
  getKnowledgeStats(): {
    totalDocuments: number;
    sources: string[];
    categories: string[];
    mostRecentlyAdded: string;
  } {
    const sources = [...new Set(this.documents.map(doc => doc.metadata.source))];
    const categories = [...new Set(this.documents.map(doc => doc.metadata.category))];
    
    return {
      totalDocuments: this.documents.length,
      sources,
      categories,
      mostRecentlyAdded: sources[sources.length - 1] || 'none'
    };
  }
}