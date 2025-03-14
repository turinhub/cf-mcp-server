import { WorkerEntrypoint } from 'cloudflare:workers'
import { ProxyToSelf } from 'workers-mcp'

export default class ImageGenerationWorker extends WorkerEntrypoint<Env> {
  /**
   * Get details about this worker.
   * 
   * @return {string} detailed descriptions of this cloudflare MCP worker and its functions
   */
  readMe(name: string) {
    return `This is a cloudflare MCP worker for image generation. It uses the Cloudflare AI API to generate Images. Currently it only supports the flux - 1 - schnell model.`
  }

  /**
   * Generate an image using the `flux - 1 - schnell` model. Works best with 8 steps.
   *
   * @param {string} prompt - A text description (in English) of the image you want to generate.
   * @param {number} steps - The number of diffusion steps; higher values can improve quality but take longer. Must be between 4 and 8, inclusive.
   * @return {Response} - A Response object containing the generated image as JPEG.
   */
  async generateImageWithFLux1Schnell(prompt: string, steps: number) {
    // Validate steps parameter
    if (steps < 4 || steps > 8) {
      return new Response('Steps must be between 4 and 8, inclusive.', { status: 400 })
    }

    try {
      const response = await this.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt,
        steps,
      })

      // Convert from base64 string
      const binaryString = atob(response.image)
      // Create byte representation
      const img = Uint8Array.from(binaryString, (m) => m.codePointAt(0)!)

      return new Response(img, {
        headers: {
          'Content-Type': 'image/jpeg',
        },
      })
    } catch (error) {
      console.error('Error generating image:', error)
      return new Response('Error generating image: ' + (error as Error).message, { status: 500 })
    }
  }

  /**
   * @ignore
   **/
  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(request)
  }
}
