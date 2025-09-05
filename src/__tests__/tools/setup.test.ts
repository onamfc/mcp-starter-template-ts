/**
 * Tests for tools/setup.ts
 * - Mocks filesystem and weather tools to keep tests fast and deterministic
 * - Verifies setupTools/getTool/validateToolArguments behavior
 */

// Mock heavy tools with lightweight stubs
jest.mock('../../tools/filesystem.js', () => ({
  fileSystemTool: {
    name: 'filesystem',
    description: 'mock filesystem tool',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
    handler: jest.fn(async () => ({
      content: [{ type: 'text', text: 'mock-fs-ok' }],
    })),
  },
}));

jest.mock('../../tools/weather.js', () => ({
  weatherTool: {
    name: 'weather',
    description: 'mock weather tool',
    inputSchema: {
      type: 'object',
      properties: { location: { type: 'string' } },
      required: ['location'],
    },
    handler: jest.fn(async () => ({
      content: [{ type: 'text', text: 'mock-weather-ok' }],
    })),
  },
}));

import { setupTools, getTool, validateToolArguments } from '../../tools/setup.js';

describe('tools/setup', () => {
  it('setupTools returns a registry including known tools', async () => {
    const tools = await setupTools();
    const names = tools.map(t => t.name).sort();

    // Expect stubs + real ones
    expect(names).toEqual(
      expect.arrayContaining(['filesystem', 'weather', 'calculator', 'text-processing'])
    );

    // Ensure there are exactly four tools as defined by the registry
    expect(tools).toHaveLength(4);
  });

  it('getTool finds tools by name and returns undefined for unknown', async () => {
    await expect(getTool('filesystem')).resolves.toBeDefined();
    await expect(getTool('weather')).resolves.toBeDefined();
    await expect(getTool('calculator')).resolves.toBeDefined();
    await expect(getTool('text-processing')).resolves.toBeDefined();
    await expect(getTool('nope')).resolves.toBeUndefined();
  });

  it('validateToolArguments fails when required args are missing', async () => {
    // Use the mocked filesystem tool (requires "path")
    const fsTool = await getTool('filesystem');
    expect(fsTool).toBeDefined();

    const bad = validateToolArguments(fsTool!, {}); // missing "path"
    expect(bad.valid).toBe(false);
    expect(bad.errors).toEqual(['Missing required parameter: path']);
  });

  it('validateToolArguments passes when required args are present', async () => {
    // Use the mocked weather tool (requires "location")
    const wTool = await getTool('weather');
    expect(wTool).toBeDefined();

    const ok = validateToolArguments(wTool!, { location: 'NYC' });
    expect(ok.valid).toBe(true);
    expect(ok.errors).toBeUndefined();
  });

  it('validateToolArguments respects multiple required fields (custom dummy)', () => {
    // Minimal dummy tool to test multiple "required" fields
    const dummyTool = {
      name: 'dummy',
      description: 'dummy',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'number' } },
        required: ['a', 'b'],
      },
      handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
    };

    const missing = validateToolArguments(dummyTool as any, { a: 'x' });
    expect(missing.valid).toBe(false);
    expect(missing.errors).toEqual(['Missing required parameter: b']);

    const present = validateToolArguments(dummyTool as any, { a: 'x', b: 1 });
    expect(present.valid).toBe(true);
  });
});
