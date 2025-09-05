/**
 * Text Processing Tool
 */

import { ToolDefinition, ToolContext } from '../types/index.js';
import { log } from '../utils/logger.js';

type Operation = 'count' | 'uppercase' | 'lowercase' | 'reverse' | 'wordcount' | 'sentiment';
type CountResult = {
  total: number;
  withoutWhitespace: number;
  whitespace: number;
  /** Mirrors includeWhitespace option: if true -> total, else -> withoutWhitespace */
  selectedTotal: number;
};
type WordStats = {
  words: number;
  sentences: number;
  paragraphs: number;
  averageWordsPerSentence: number;
};
type SentimentResult = {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
};

export const textProcessingTool: ToolDefinition = {
  name: 'text-processing',
  description:
    'Process and analyze text with operations like character/word counts, case transforms, reverse, and basic sentiment.',
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
            description: 'Whether to consider case for certain operations',
          },
          includeWhitespace: {
            type: 'boolean',
            default: true,
            description: 'Whether to include whitespace in character totals (count op)',
          },
        },
      },
    },
    required: ['operation', 'text'],
  },

  handler: async (args: Record<string, unknown>, context: ToolContext) => {
    const { operation, text, options } = args as {
      operation: Operation;
      text: string;
      options?: { caseSensitive?: boolean; includeWhitespace?: boolean };
    };

    const safeText = typeof text === 'string' ? text : '';
    const opts = {
      caseSensitive: options?.caseSensitive ?? true,
      includeWhitespace: options?.includeWhitespace ?? true,
    };

    const requestId = context.requestId;
    log.withContext(requestId).info(`Text processing: ${operation}`, {
      textLength: safeText.length,
      options: opts,
    });

    try {
      let result: string | CountResult | WordStats | SentimentResult;

      switch (operation) {
        case 'count': {
          result = countCharacters(safeText, opts.includeWhitespace);
          break;
        }
        case 'uppercase':
          result = safeText.toUpperCase();
          break;
        case 'lowercase':
          result = safeText.toLowerCase();
          break;
        case 'reverse':
          result = reverseGraphemes(safeText);
          break;
        case 'wordcount':
          result = countWords(safeText);
          break;
        case 'sentiment':
          result = analyzeSentiment(safeText);
          break;
        default:
          throw new Error(`Unsupported operation: ${String(operation)}`);
      }

      log.withContext(requestId).info(`Text processing completed: ${operation}`);

      const asObject = typeof result === 'string' ? { value: result } : result;

      return {
        content: [
          { type: 'text', text: JSON.stringify(asObject) },
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log
        .withContext(requestId)
        .error(`Text processing failed: ${operation}`, error, { textLength: safeText.length });

      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
};

/**
 * Count characters in text
 */
function countCharacters(text: string, includeWhitespace: boolean): CountResult {
  // Use code-point aware length
  const total = Array.from(text).length;
  const withoutWhitespace = Array.from(text.replace(/\s/g, '')).length;
  const whitespace = total - withoutWhitespace;
  const selectedTotal = includeWhitespace ? total : withoutWhitespace;
  return { total, withoutWhitespace, whitespace, selectedTotal };
}

/**
 * Reverse string with basic grapheme safety
 */
function reverseGraphemes(text: string): string {
  try {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      const parts: string[] = [];
      for (const { segment } of seg.segment(text)) parts.push(segment);
      return parts.reverse().join('');
    }
  } catch {
    // ignore
  }
  return Array.from(text).reverse().join('');
}

/**
 * Count words / sentences / paragraphs
 */
function countWords(text: string): WordStats {
  const normalized = normalizeText(text);

  const wordTokens = normalized.split(/\s+/).filter(Boolean);
  const words = wordTokens.length;

  const sentences = normalized
    .split(/[.!?]+(?:\s|$)/)
    .map(s => s.trim())
    .filter(Boolean).length;

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean).length;

  const averageWordsPerSentence = sentences > 0 ? Math.round((words / sentences) * 100) / 100 : 0;

  return { words, sentences, paragraphs, averageWordsPerSentence };
}

/**
 * Basic keyword sentiment (toy; deterministic)
 */
function analyzeSentiment(text: string): SentimentResult {
  const normalized = normalizeText(text).toLowerCase();
  const tokens = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const positive = new Set([
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'like',
    'happy',
    'joy',
    'awesome',
    'pleasant',
    'delight',
  ]);

  const negative = new Set([
    'bad',
    'terrible',
    'awful',
    'horrible',
    'hate',
    'dislike',
    'sad',
    'angry',
    'frustrated',
    'disappointed',
    'poor',
    'worse',
    'worst',
  ]);

  let pos = 0,
    neg = 0;
  for (const t of tokens) {
    if (positive.has(t)) pos++;
    if (negative.has(t)) neg++;
  }

  const total = pos + neg;
  const raw = total > 0 ? (pos - neg) / total : 0;

  const sentiment: SentimentResult['sentiment'] =
    raw > 0.1 ? 'positive' : raw < -0.1 ? 'negative' : 'neutral';

  const confidence = Math.min(Math.abs(raw) * 2, 1);

  return {
    sentiment,
    score: Math.round(raw * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

function normalizeText(text: string): string {
  // Normalize line endings and trim outer whitespace
  return text.replace(/\r\n?/g, '\n').trim();
}
