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
   * @ignore
   **/
  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(request)
  }
}
