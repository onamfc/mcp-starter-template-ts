/**
 * Tool setup and registration
 * This file manages the registration and configuration of all available tools
 */

import { ToolDefinition } from '../types/index.js';
import { calculateTool } from './calculator.js';
import { fileSystemTool } from './filesystem.js';
import { textProcessingTool } from './text-processing.js';
import { weatherTool } from './weather.js';

/**
 * Registry of all available tools
 */
const toolRegistry: ToolDefinition[] = [
  calculateTool,
  fileSystemTool,
  textProcessingTool,
  weatherTool,
];

/**
 * Setup and return all available tools
 */
export async function setupTools(): Promise<ToolDefinition[]> {
  // Here you could add dynamic tool loading, filtering based on config, etc.
  return toolRegistry;
}

/**
 * Get a specific tool by name
 */
export async function getTool(name: string): Promise<ToolDefinition | undefined> {
  const tools = await setupTools();
  return tools.find(tool => tool.name === name);
}

/**
 * Validate tool arguments against schema
 */
export function validateToolArguments(
  tool: ToolDefinition,
  args: Record<string, unknown>
): { valid: boolean; errors?: string[] } {
  // Basic validation - in a real implementation you'd use a proper schema validator
  const required = tool.inputSchema.required || [];
  const missing = required.filter(field => !(field in args));

  if (missing.length > 0) {
    return {
      valid: false,
      errors: missing.map(field => `Missing required parameter: ${field}`),
    };
  }

  return { valid: true };
}
