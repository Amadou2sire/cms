/**
 * Extracts plain text from a modular content JSON string or raw HTML.
 */
export function extractExcerpt(content: string, length: number = 150): string {
  if (!content) return ''
  
  let plainText = ''
  
  try {
    const parsed = JSON.parse(content)
    if (parsed && parsed.version === 2 && Array.isArray(parsed.blocks)) {
      // Extract from modular blocks
      plainText = parsed.blocks
        .map((block: any) => {
          if (block.type === 'richtext') {
            return block.data?.html || ''
          }
          if (block.type === 'text') {
            return block.data?.content || ''
          }
          if (block.type === 'heading') {
            return block.data?.text || ''
          }
          return ''
        })
        .join(' ')
    }
  } catch (e) {
    // Treat as raw HTML
    plainText = content
  }

  // Strip HTML tags
  const doc = new DOMParser().parseFromString(plainText, 'text/html')
  const stripped = doc.body.textContent || ''
  
  if (stripped.length <= length) return stripped
  return stripped.substring(0, length).trim() + '...'
}
