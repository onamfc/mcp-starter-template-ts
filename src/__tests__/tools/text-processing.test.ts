import { textProcessingTool } from '../../tools/text-processing.js';

const ctx = { requestId: 'cov-req', timestamp: new Date().toISOString() } as any;

type TextBlock = { type: 'text'; text: string };
type ToolResponse = { content: TextBlock[]; isError?: boolean };

function isToolResponse(x: unknown): x is ToolResponse {
  return (
    !!x &&
    typeof x === 'object' &&
    Array.isArray((x as any).content) &&
    (x as any).content.every((c: any) => c && c.type === 'text' && typeof c.text === 'string')
  );
}

function expectToolResponse(res: unknown): ToolResponse {
  if (!isToolResponse(res)) {
    fail(`Unexpected tool response shape: ${JSON.stringify(res)}`);
  }
  return res;
}

function firstJson(res: unknown) {
  const r = expectToolResponse(res);
  const first = r.content[0];
  if (!first) {
    fail('Tool returned empty content array');
  }
  expect(first.type).toBe('text');
  return JSON.parse(first.text);
}

describe('text-processing tool', () => {
  it('uppercase', async () => {
    const res = await textProcessingTool.handler({ operation: 'uppercase', text: 'Hello' }, ctx);
    const obj = firstJson(res); // pass the WHOLE response
    expect(obj.value).toBe('HELLO');
  });

  it('lowercase', async () => {
    const res = await textProcessingTool.handler({ operation: 'lowercase', text: 'MiXeD' }, ctx);
    const obj = firstJson(res);
    expect(obj.value).toBe('mixed');
  });

  it('reverse handles emoji (grapheme-ish)', async () => {
    const res = await textProcessingTool.handler({ operation: 'reverse', text: 'abc🙂' }, ctx);
    const obj = firstJson(res);
    expect(typeof obj.value).toBe('string');
    expect((obj.value as string).startsWith('🙂')).toBe(true);
    expect((obj.value as string).endsWith('a')).toBe(true);
  });

  it('count with whitespace (default include)', async () => {
    const res = await textProcessingTool.handler({ operation: 'count', text: 'a b\tc\n' }, ctx);
    const obj = firstJson(res);
    expect(obj.total).toBeGreaterThan(0);
    expect(obj.withoutWhitespace).toBeLessThan(obj.total);
    expect(obj.selectedTotal).toBe(obj.total);
  });

  it('count without whitespace (option exclude)', async () => {
    const res = await textProcessingTool.handler(
      { operation: 'count', text: 'a b\tc\n', options: { includeWhitespace: false } },
      ctx
    );
    const obj = firstJson(res);
    expect(obj.selectedTotal).toBe(obj.withoutWhitespace);
  });

  it('count on empty string', async () => {
    const res = await textProcessingTool.handler({ operation: 'count', text: '' }, ctx);
    const obj = firstJson(res);
    expect(obj.total).toBe(0);
    expect(obj.whitespace).toBe(0);
    expect(obj.withoutWhitespace).toBe(0);
    expect(obj.selectedTotal).toBe(0);
  });

  it('wordcount across sentences and paragraphs', async () => {
    const res = await textProcessingTool.handler(
      { operation: 'wordcount', text: 'Hi there. How are you?\n\nFine!' },
      ctx
    );
    const obj = firstJson(res);
    expect(obj.words).toBeGreaterThanOrEqual(4);
    expect(obj.sentences).toBeGreaterThanOrEqual(2);
    expect(obj.paragraphs).toBeGreaterThanOrEqual(1);
    expect(obj.averageWordsPerSentence).toBeGreaterThan(0);
  });

  it('sentiment positive', async () => {
    const res = await textProcessingTool.handler(
      { operation: 'sentiment', text: 'This is amazing and wonderful, I love it.' },
      ctx
    );
    const obj = firstJson(res);
    expect(obj.sentiment).toBe('positive');
    expect(obj.score).toBeGreaterThan(0);
    expect(obj.confidence).toBeGreaterThan(0);
  });

  it('sentiment negative', async () => {
    const res = await textProcessingTool.handler(
      { operation: 'sentiment', text: 'This is awful, terrible and bad. I hate it.' },
      ctx
    );
    const obj = firstJson(res);
    expect(obj.sentiment).toBe('negative');
    expect(obj.score).toBeLessThan(0);
  });

  it('sentiment neutral (mixed)', async () => {
    const res = await textProcessingTool.handler(
      { operation: 'sentiment', text: 'good bad good bad' },
      ctx
    );
    const obj = firstJson(res);
    expect(obj.sentiment).toBe('neutral');
  });

  it('unsupported operation yields error response', async () => {
    const res = await textProcessingTool.handler({ operation: 'nope', text: 'x' }, ctx);
    const toolRes = expectToolResponse(res);
    expect(toolRes.isError).toBe(true);
    expect(String(toolRes.content?.[0]?.text || '')).toMatch(/Unsupported operation/i);
  });
});
