/**
 * Resource setup and registration
 * This file manages the registration and configuration of all available resources
 */

import { ResourceDefinition } from '../types/index.js';
import { configResource } from './config.js';
import { docsResource } from './docs.js';
import { logsResource } from './logs.js';

/**
 * Registry of all available resources
 */
const resourceRegistry: ResourceDefinition[] = [configResource, docsResource, logsResource];

/**
 * Setup and return all available resources
 */
export async function setupResources(): Promise<ResourceDefinition[]> {
  // Here you could add dynamic resource loading, filtering based on config, etc.
  return resourceRegistry;
}

/**
 * Get a specific resource by URI
 */
export async function getResource(uri: string): Promise<ResourceDefinition | undefined> {
  const resources = await setupResources();
  return resources.find(resource => resource.uri === uri);
}

/**
 * Check if a resource exists
 */
export async function resourceExists(uri: string): Promise<boolean> {
  const resource = await getResource(uri);
  return resource !== undefined;
}
