// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyWorker from '../src/index';

interface Env {
  JINA_API_KEY: string;
  AI: {
    run: (model: string, params: any) => Promise<{ image: string }>;
  };
}

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Jina API Worker', () => {
  let worker: MyWorker;
  let ctx: ExecutionContext;

  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockReset();
    ctx = createExecutionContext();
    worker = new MyWorker(ctx, {
      JINA_API_KEY: 'test-api-key',
      AI: {
        run: async () => ({ image: 'mock-image-data' })
      }
    });
  });

  describe('reader()', () => {
    it('should call Jina Reader API with URL', async () => {
      const testUrl = 'https://example.com';
      const mockResponse = 'Mock content from Jina Reader';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse
      });

      const result = await worker.reader(testUrl);
      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://r.jina.ai/${testUrl}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should include Authorization header when token provided', async () => {
      const testToken = 'test-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content'
      });

      await worker.reader('https://example.com', testToken);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        })
      );
    });

    it('should include X-No-Cache header when noCache is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content'
      });

      await worker.reader('https://example.com', undefined, true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'X-No-Cache': 'true'
          }
        })
      );
    });

    it('should throw error when URL is missing', async () => {
      await expect(worker.reader('')).rejects.toThrow('URL is required');
    });
  });

  describe('search()', () => {
    it('should call Jina Search API with query and token', async () => {
      const testQuery = 'test query';
      const testToken = 'test-token';
      const mockResponse = 'Mock search results';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse
      });

      const result = await worker.search(testQuery, testToken);
      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://s.jina.ai/?q=${encodeURIComponent(testQuery)}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${testToken}`,
            'X-Respond-With': 'no-content'
          }
        })
      );
    });

    it('should not include X-Respond-With header when noContent is false', async () => {
      const testQuery = 'test query';
      const testToken = 'test-token';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'results'
      });

      await worker.search(testQuery, testToken, false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${testToken}`,
          }
        })
      );
      expect(mockFetch.mock.calls[0][1].headers['X-Respond-With']).toBeUndefined();
    });

    it('should throw error when query is missing', async () => {
      await expect(worker.search('', 'token')).rejects.toThrow('Search query is required');
    });

    it('should throw error when token is missing', async () => {
      await expect(worker.search('query', '')).rejects.toThrow('Bearer token is required');
    });
  });
});
