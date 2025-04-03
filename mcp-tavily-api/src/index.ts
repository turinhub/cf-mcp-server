import { WorkerEntrypoint } from 'cloudflare:workers'
import { ProxyToSelf } from 'workers-mcp'

interface TavilyExtractResult {
  url: string;
  raw_content: string;
  images: string[];
}

interface TavilyExtractFailedResult {
  url: string;
  error: string;
}

interface TavilyExtractResponse {
  results: TavilyExtractResult[];
  failed_results: TavilyExtractFailedResult[];
  response_time: number;
}

interface TavilySearchImage {
  url: string;
  description?: string;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

interface TavilySearchResponse {
  query: string;
  answer?: string;
  images: TavilySearchImage[];
  results: TavilySearchResult[];
  response_time: string | number;
}

export default class MyWorker extends WorkerEntrypoint<Env> {
  /**
   * Call Tavily Extract API to extract content from one or more URLs
   * 
   * @param {string|string[]} urls - Single URL or array of URLs to extract content from
   * @param {string} token - API key for authentication
   * @param {Object} options - Additional extract options
   * @param {boolean} [options.include_images=false] - Whether to include images in the response
   * @param {string} [options.extract_depth='basic'] - Extraction depth: 'basic' or 'advanced'
   * @return {Promise<TavilyExtractResponse>} The extraction results
   */
  async extract(
    urls: string | string[], 
    token: string,
    options: {
      include_images?: boolean;
      extract_depth?: 'basic' | 'advanced';
    } = {}
  ): Promise<TavilyExtractResponse> {
    if (!urls) {
      throw new Error('URLs are required');
    }

    if (!token) {
      throw new Error('API key is required for Tavily Extract API');
    }

    const tavilyUrl = 'https://api.tavily.com/extract';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(tavilyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          urls: urls,
          include_images: options.include_images ?? false,
          extract_depth: options.extract_depth ?? 'basic'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Tavily Extract API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as TavilyExtractResponse;
      return data;
    } catch (error) {
      console.error('Error calling Tavily Extract API:', error);
      throw error;
    }
  }

  /**
   * Call Tavily Search API to search for information
   * 
   * @param {string} query - The search query
   * @param {string} token - Required API key for authentication
   * @param {Object} options - Additional search options
   * @param {string} [options.topic='general'] - The category of the search: 'general' or 'news'
   * @param {string} [options.search_depth='basic'] - Search depth: 'basic' or 'advanced'
   * @param {number} [options.max_results=5] - Maximum number of search results (0-20)
   * @param {string} [options.time_range] - Time range filter: 'day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'
   * @param {number} [options.days=3] - Number of days back from current date (for 'news' topic)
   * @param {boolean|string} [options.include_answer=false] - Include AI answer: true/false or 'basic'/'advanced'
   * @param {boolean} [options.include_raw_content=false] - Include raw content of each result
   * @param {boolean} [options.include_images=false] - Include image search results
   * @param {boolean} [options.include_image_descriptions=false] - Include descriptions for images
   * @param {string[]} [options.include_domains=[]] - List of domains to include
   * @param {string[]} [options.exclude_domains=[]] - List of domains to exclude
   * @return {Promise<TavilySearchResponse>} The search results
   */
  async search(
    query: string, 
    token: string, 
    options: {
      topic?: 'general' | 'news';
      search_depth?: 'basic' | 'advanced';
      max_results?: number;
      time_range?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
      days?: number;
      include_answer?: boolean | 'basic' | 'advanced';
      include_raw_content?: boolean;
      include_images?: boolean;
      include_image_descriptions?: boolean;
      include_domains?: string[];
      exclude_domains?: string[];
    } = {}
  ): Promise<TavilySearchResponse> {
    if (!query) {
      throw new Error('Search query is required');
    }
    
    if (!token) {
      throw new Error('API key is required for Tavily Search API');
    }

    const tavilyUrl = 'https://api.tavily.com/search';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(tavilyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          topic: options.topic || 'general',
          search_depth: options.search_depth || 'basic',
          max_results: options.max_results !== undefined ? options.max_results : 5,
          time_range: options.time_range || null,
          days: options.days !== undefined ? options.days : 3,
          include_answer: options.include_answer !== undefined ? options.include_answer : false,
          include_raw_content: options.include_raw_content || false,
          include_images: options.include_images || false,
          include_image_descriptions: options.include_image_descriptions || false,
          include_domains: options.include_domains || [],
          exclude_domains: options.exclude_domains || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Tavily Search API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as TavilySearchResponse;
      return data;
    } catch (error) {
      console.error('Error calling Tavily Search API:', error);
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
