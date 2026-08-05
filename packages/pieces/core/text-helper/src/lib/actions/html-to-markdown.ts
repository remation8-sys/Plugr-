import { Property, createAction } from '@activepieces/pieces-framework';
import TurndownService from 'turndown';

export const htmlToMarkdown = createAction({
  audience: 'human',
  name: 'html_to_markdown',
  displayName: 'HTML to Markdown',
  description: 'Convert HTML to Markdown',
  aiMetadata: {
    description:
      'Converts an HTML string into Markdown, optionally with GitHub Flavored Markdown extensions (tables, strikethrough, task lists) enabled. Use it when you want compact readable markup preserving structure; prefer Remove HTML Tags for bare text with no markup, Extract from HTML to pull specific elements, or Markdown to HTML for the reverse. Requires the HTML content and script elements are dropped; deterministic and idempotent.',
    idempotent: true,
  },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML to convert to markdown',
      required: true,
    }),
  },
  run: async (context) => {
    const html = context.propsValue.html;
    const service = new TurndownService();
    service.remove('script');
    return service.turndown(html);
  },
});
