/**
 * Text Processing Tool
 * Provides various text manipulation and analysis capabilities
 */

import { ToolDefinition, ToolContext } from '../types/index.js';
import { log } from '../utils/logger.js';


/**
 * Text processing tool implementation
 */
export const textProcessingTool: ToolDefinition = {
  name: 'text-processing',
  description: 'Process and analyze text with various operations like counting, formatting, and transformation',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['count', 'uppercase', 'lowercase', 'reverse', 'wordcount', 'sentiment'],
        description: 'Text processing operation to perform',
      },
      text: {
        type: 'string',
        description: 'Text content to process',
      },
      options: {
        type: 'object',
        description: 'Additional options for the operation',
        properties: {
          caseSensitive: {
            type: 'boolean',
            default: true,
            description: 'Whether to consider case in operations',
          },
          includeWhitespace: {
            type: 'boolean',
            default: true,
            description: 'Whether to include whitespace in character counts',
          },
        },
      },
    },
    required: ['operation', 'text'],
  },
  handler: async (args: Record<string, unknown>, context: ToolContext) => {
    const { operation, text, options = {} } = args as {
      operation: 'count' | 'uppercase' | 'lowercase' | 'reverse' | 'wordcount' | 'sentiment';
      text: string;
      options?: {
        caseSensitive?: boolean;
        includeWhitespace?: boolean;
      };
    };

    try {
      log.withContext(context.requestId).info(`Text processing operation: ${operation}`, {
        textLength: text.length,
        options,
      });

      let result: unknown;

      switch (operation) {
        case 'count':
          result = countCharacters(text, options);
          break;
        case 'uppercase':
          result = text.toUpperCase();
          break;
        case 'lowercase':
          result = text.toLowerCase();
          break;
        case 'reverse':
          result = text.split('').reverse().join('');
          break;
        case 'wordcount':
          result = countWords(text);
          break;
        case 'sentiment':
          result = analyzeSentiment(text);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      log.withContext(context.requestId).info(`Text processing completed: ${operation}`);

      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'object'
              ? JSON.stringify(result, null, 2)
              : String(result),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown text processing error';

      log.withContext(context.requestId).error(`Text processing failed: ${operation}`, error instanceof Error ? error : new Error(String(error)), {
        textLength: text.length,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};

/**
 * Count characters in text
 */
function countCharacters(text: string, options: { includeWhitespace?: boolean } = {}): {
  total: number;
  withoutWhitespace: number;
  whitespace: number;
} {
  const total = text.length;
  const withoutWhitespace = text.replace(/\s/g, '').length;
  const whitespace = total - withoutWhitespace;

  return {
    total,
    withoutWhitespace,
    whitespace,
  };
}

/**
 * Count words in text
 */
function countWords(text: string): {
  words: number;
  sentences: number;
  paragraphs: number;
  averageWordsPerSentence: number;
} {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
  const averageWordsPerSentence = sentences > 0 ? Math.round((words / sentences) * 100) / 100 : 0;

  return {
    words,
    sentences,
    paragraphs,
    averageWordsPerSentence,
  };
}

/**
 * Basic sentiment analysis
 */
function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
} {
  // Simple keyword-based sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];

  const words = text.toLowerCase().split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  const totalSentimentWords = positiveCount + negativeCount;
  const score = totalSentimentWords > 0
    ? (positiveCount - negativeCount) / totalSentimentWords
    : 0;

  let sentiment: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) sentiment = 'positive';
  else if (score < -0.1) sentiment = 'negative';
  else sentiment = 'neutral';

  const confidence = Math.min(Math.abs(score) * 2, 1);

  return {
    sentiment,
    score: Math.round(score * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}
