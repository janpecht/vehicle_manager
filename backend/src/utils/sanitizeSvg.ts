/**
 * Sanitizes an SVG buffer by removing script tags, event handlers,
 * foreignObject elements, and other potentially dangerous content.
 * Returns the sanitized SVG as a Buffer.
 */
export function sanitizeSvg(buffer: Buffer): Buffer {
  let svg = buffer.toString('utf-8');

  // Remove <script> tags and their content
  svg = svg.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  // Remove self-closing <script /> tags
  svg = svg.replace(/<script[^>]*\/>/gi, '');

  // Remove <foreignObject> tags and their content
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');

  // Remove <iframe>, <embed>, <object> tags
  svg = svg.replace(/<(iframe|embed|object)[\s\S]*?<\/\1\s*>/gi, '');
  svg = svg.replace(/<(iframe|embed|object)[^>]*\/>/gi, '');

  // Remove all on* event handler attributes
  svg = svg.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: and data: URIs in href/xlink:href/src attributes
  svg = svg.replace(/(href|src)\s*=\s*["']?\s*javascript:/gi, '$1="');
  svg = svg.replace(/(href|src)\s*=\s*["']?\s*data:\s*text\/html/gi, '$1="');

  // Remove <use> elements pointing to external resources
  svg = svg.replace(/<use[^>]*href\s*=\s*["']https?:\/\/[^"']*["'][^>]*\/?>/gi, '');

  return Buffer.from(svg, 'utf-8');
}
