// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import ImageGenerationWorker from '../src/index';

interface Env {
  AI: {
    run: (model: string, params: any) => Promise<{ image: string }>;
  };
  SHARED_SECRET: string;
}

const mockEnv: Env = {
  AI: {
    run: async () => ({ image: 'mock-image-data' }) // Mock AI service
  },
  SHARED_SECRET: 'test-secret' // Required by Env interface
};

const ctx = createExecutionContext();
const worker = new ImageGenerationWorker(ctx, mockEnv);

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Image Generation Worker', () => {
  it('should generate image with valid parameters (unit style)', async () => {
    const request = new IncomingRequest('http://example.com', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'a beautiful sunset',
        steps: 6
      })
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('should reject invalid steps parameter (unit style)', async () => {
    const request = new IncomingRequest('http://example.com', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'a beautiful sunset',
        steps: 3
      })
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Steps must be between 4 and 8, inclusive.');
  });

  it('should generate image with valid parameters (integration style)', async () => {
    const response = await SELF.fetch('https://example.com', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'a mountain landscape',
        steps: 5
      })
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });
});
