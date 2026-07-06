// Generates static, JS-free HTML for the Plugr blog so search engines and
// AI crawlers (which mostly don't execute JavaScript) can read it directly.
// Reads Markdown sources from ../blog-content/posts, writes HTML + sitemap.xml
// + feed.xml into ../public so Vite copies them into the production build
// as-is (see vite.config.mts outDir handling of the public/ directory).
import { marked } from 'marked';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(WEB_ROOT, 'blog-content', 'posts');
const PUBLIC_DIR = path.join(WEB_ROOT, 'public');
const BLOG_OUT_DIR = path.join(PUBLIC_DIR, 'blog');

const SITE_URL = 'https://plugr.cloud';
const SITE_NAME = 'Plugr';
const DEFAULT_IMAGE = `${SITE_URL}/plugr-logo-v2.png`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseFrontmatter(raw) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) {
    throw new Error('Missing frontmatter block (expected leading --- ... ---)');
  }
  const [, fmBlock, body] = match;
  const meta = {};
  for (const line of fmBlock.split('\n')) {
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  if (meta.tags) {
    meta.tags = meta.tags.split(',').map((t) => t.trim()).filter(Boolean);
  } else {
    meta.tags = [];
  }
  return { meta, body: body.trim() };
}

function extractFaq(markdownBody) {
  const heading = /^##\s+FAQ\s*$/im.exec(markdownBody);
  if (!heading) return [];
  const section = markdownBody.slice(heading.index + heading[0].length);
  const qaRe = /^###\s+(.+?)\s*\n+([\s\S]*?)(?=\n###\s+|\n##\s+|$)/gm;
  const faqs = [];
  let m;
  while ((m = qaRe.exec(section))) {
    const question = m[1].trim();
    const answer = m[2].trim().replace(/\n+/g, ' ');
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

function formatDisplayDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function siteHeader() {
  return `<header class="blog-header">
  <div class="blog-header-inner">
    <a href="/" class="blog-brand"><img src="/favicon-32.png" alt="" width="24" height="24" /> Plugr</a>
    <nav class="blog-nav">
      <a href="/#features">Features</a>
      <a href="/#pricing">Pricing</a>
      <a href="/blog/">Blog</a>
      <a href="/sign-up" class="blog-cta">Start free trial</a>
    </nav>
  </div>
</header>`;
}

function siteFooter() {
  return `<footer class="blog-footer">
  <div class="blog-footer-inner">
    <p>&copy; ${new Date().getFullYear()} Plugr</p>
    <div class="blog-footer-links">
      <a href="/">Home</a>
      <a href="/blog/">Blog</a>
      <a href="/sign-up">Create account</a>
    </div>
  </div>
</footer>`;
}

function pageShell({ title, description, canonicalPath, ogType = 'website', image = DEFAULT_IMAGE, jsonLd = [], bodyHtml }) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const jsonLdBlocks = jsonLd
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${canonical}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${image}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${image}" />
<link rel="icon" type="image/png" href="/favicon-32.png" />
<link rel="alternate" type="application/rss+xml" title="Plugr Blog" href="/feed.xml" />
<link rel="stylesheet" href="/blog/assets/blog.css" />
${jsonLdBlocks}
</head>
<body>
${siteHeader()}
<main class="blog-main">
${bodyHtml}
</main>
${siteFooter()}
</body>
</html>
`;
}

function renderPost(meta, faqs, contentHtml) {
  const canonicalPath = `/blog/${meta.slug}/`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: meta.title,
      description: meta.description,
      image: [DEFAULT_IMAGE],
      datePublished: meta.date,
      dateModified: meta.date,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-192.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${canonicalPath}` },
      url: `${SITE_URL}${canonicalPath}`,
      keywords: meta.tags.join(', '),
    },
  ];
  if (faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  const bodyHtml = `<article class="post">
  <p class="post-meta"><time datetime="${meta.date}">${formatDisplayDate(meta.date)}</time></p>
  <h1>${escapeHtml(meta.title)}</h1>
  <div class="post-body">
${contentHtml}
  </div>
  <p class="post-cta"><a href="/sign-up">Start a free Plugr trial &rarr;</a></p>
  <p class="post-back"><a href="/blog/">&larr; Back to all posts</a></p>
</article>`;

  return pageShell({
    title: `${meta.title} | Plugr Blog`,
    description: meta.description,
    canonicalPath,
    ogType: 'article',
    jsonLd,
    bodyHtml,
  });
}

function renderIndex(posts) {
  const cards = posts
    .map(
      (p) => `  <a class="post-card" href="/blog/${p.slug}/">
    <p class="post-card-date"><time datetime="${p.date}">${formatDisplayDate(p.date)}</time></p>
    <h2>${escapeHtml(p.title)}</h2>
    <p>${escapeHtml(p.description)}</p>
  </a>`,
    )
    .join('\n');

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Plugr Blog',
      url: `${SITE_URL}/blog/`,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      blogPost: posts.map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        datePublished: p.date,
        url: `${SITE_URL}/blog/${p.slug}/`,
      })),
    },
  ];

  const bodyHtml = `<div class="blog-index">
  <h1>The Plugr Blog</h1>
  <p class="blog-index-intro">Workflow automation, AI agents, and what's actually working right now &mdash; written by the Plugr team.</p>
  <div class="post-grid">
${cards}
  </div>
</div>`;

  return pageShell({
    title: 'Blog | Plugr',
    description: "Workflow automation, AI agents, and GEO/AI-search insights from the Plugr team.",
    canonicalPath: '/blog/',
    jsonLd,
    bodyHtml,
  });
}

function buildSitemap(posts) {
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/blog/`, changefreq: 'daily', priority: '0.8' },
    ...posts.map((p) => ({
      loc: `${SITE_URL}/blog/${p.slug}/`,
      lastmod: p.date,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ];
  const body = urls
    .map((u) => {
      const lines = [`    <loc>${u.loc}</loc>`];
      if (u.lastmod) lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
      if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority) lines.push(`    <priority>${u.priority}</priority>`);
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildFeed(posts) {
  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.slug}/`;
      const pubDate = new Date(`${p.date}T00:00:00Z`).toUTCString();
      return `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${link}</link>
    <guid>${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeHtml(p.description)}</description>
  </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Plugr Blog</title>
  <link>${SITE_URL}/blog/</link>
  <description>Workflow automation, AI agents, and GEO/AI-search insights from the Plugr team.</description>
  <language>en-us</language>
${items}
</channel>
</rss>
`;
}

function main() {
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  if (!files.length) {
    throw new Error(`No markdown posts found in ${POSTS_DIR}`);
  }

  const posts = [];

  for (const file of files) {
    const raw = readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    for (const required of ['title', 'slug', 'date', 'description']) {
      if (!meta[required]) {
        throw new Error(`${file}: missing required frontmatter field "${required}"`);
      }
    }
    const faqs = extractFaq(body);
    const contentHtml = marked.parse(body);
    posts.push({ ...meta, faqs, contentHtml });
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  mkdirSync(BLOG_OUT_DIR, { recursive: true });

  for (const post of posts) {
    const postDir = path.join(BLOG_OUT_DIR, post.slug);
    mkdirSync(postDir, { recursive: true });
    const html = renderPost(post, post.faqs, post.contentHtml);
    writeFileSync(path.join(postDir, 'index.html'), html, 'utf8');
  }

  writeFileSync(path.join(BLOG_OUT_DIR, 'index.html'), renderIndex(posts), 'utf8');
  writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemap(posts), 'utf8');
  writeFileSync(path.join(PUBLIC_DIR, 'feed.xml'), buildFeed(posts), 'utf8');

  console.log(`Built ${posts.length} blog posts + index + sitemap.xml + feed.xml`);
  for (const p of posts) console.log(`  - /blog/${p.slug}/  (${p.date})`);
}

main();
