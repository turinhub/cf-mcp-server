import { WorkerEntrypoint } from 'cloudflare:workers'
import { ProxyToSelf } from 'workers-mcp'

export default class MyWorker extends WorkerEntrypoint<Env> {
  /**
   * Call Jina Reader API to extract content from a URL
   * 
   * @param {string} url - The URL to extract content from
   * @param {string} [token] - Optional Bearer token for higher rate limits
   * @param {boolean} [noCache=false] - Whether to bypass cache (true) or use cached results if available (false)
   * @return {Promise<string>} The extracted content from the URL
   */
  async reader(url: string, token?: string, noCache: boolean = false): Promise<string> {
    if (!url) {
      throw new Error('URL is required');
    }

    const jinaReaderUrl = `https://r.jina.ai/${url}`;
    
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (noCache) {
      headers['X-No-Cache'] = 'true';
    }
    
    try {
      const response = await fetch(jinaReaderUrl, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Jina Reader API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error calling Jina Reader API:', error);
      throw error;
    }
  }

  /**
   * Call Jina Search API to search for information. A valid Jina API key is required.
   * 
   * @param {string} query - The search query
   * @param {string} token - Required Bearer token for authentication
   * @param {boolean} [noContent=true] - Whether to exclude content in the response (true) or include it (false)
   * @return {Promise<string>} The search results as text
   */
  async search(query: string, token: string, noContent: boolean = true): Promise<string> {
    if (!query) {
      throw new Error('Search query is required');
    }
    
    if (!token) {
      throw new Error('Bearer token is required for Jina Search API');
    }

    const jinaSearchUrl = `https://s.jina.ai/?q=${encodeURIComponent(query)}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`
    };
    
    if (noContent) {
      headers['X-Respond-With'] = 'no-content';
    }
    
    try {
      const response = await fetch(jinaSearchUrl, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Jina Search API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error calling Jina Search API:', error);
      throw error;
    }
  }

  /**
   * @ignore
   **/
  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(request)
  }
}
