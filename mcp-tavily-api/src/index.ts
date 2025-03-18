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
   * @param {boolean} [options.includeImages=false] - Whether to include images in the response
   * @param {string} [options.extractDepth='basic'] - Extraction depth: 'basic' or 'advanced'
   * @return {Promise<TavilyExtractResponse>} The extraction results
   */
  async extract(
    urls: string | string[], 
    token: string,
    options: {
      includeImages?: boolean;
      extractDepth?: 'basic' | 'advanced';
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
          include_images: options.includeImages ?? false,
          extract_depth: options.extractDepth ?? 'basic'
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
   * @param {string} [options.searchDepth='basic'] - Search depth: 'basic' or 'advanced'
   * @param {number} [options.maxResults=5] - Maximum number of search results (0-20)
   * @param {string} [options.timeRange] - Time range filter: 'day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'
   * @param {number} [options.days=3] - Number of days back from current date (for 'news' topic)
   * @param {boolean|string} [options.includeAnswer=false] - Include AI answer: true/false or 'basic'/'advanced'
   * @param {boolean} [options.includeRawContent=false] - Include raw content of each result
   * @param {boolean} [options.includeImages=false] - Include image search results
   * @param {boolean} [options.includeImageDescriptions=false] - Include descriptions for images
   * @param {string[]} [options.includeDomains=[]] - List of domains to include
   * @param {string[]} [options.excludeDomains=[]] - List of domains to exclude
   * @return {Promise<TavilySearchResponse>} The search results
   */
  async search(
    query: string, 
    token: string, 
    options: {
      topic?: 'general' | 'news';
      searchDepth?: 'basic' | 'advanced';
      maxResults?: number;
      timeRange?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
      days?: number;
      includeAnswer?: boolean | 'basic' | 'advanced';
      includeRawContent?: boolean;
      includeImages?: boolean;
      includeImageDescriptions?: boolean;
      includeDomains?: string[];
      excludeDomains?: string[];
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
          search_depth: options.searchDepth || 'basic',
          max_results: options.maxResults !== undefined ? options.maxResults : 5,
          time_range: options.timeRange || null,
          days: options.days !== undefined ? options.days : 3,
          include_answer: options.includeAnswer !== undefined ? options.includeAnswer : false,
          include_raw_content: options.includeRawContent || false,
          include_images: options.includeImages || false,
          include_image_descriptions: options.includeImageDescriptions || false,
          include_domains: options.includeDomains || [],
          exclude_domains: options.excludeDomains || []
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
