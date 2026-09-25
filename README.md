# SEO page check

A single-page tool for checking a web page's on-page SEO before you publish it. Fill in the fields, or paste a page's HTML source, and every check is rated **good**, **medium** or **bad** as you type, with live Google and social-share previews.

**[Try it online](https://thecoolsim.github.io/SEO-page-check/)**

![SEO page check screenshot](docs/screenshot.png)

## Features

- Checks the focus keyphrase, SEO title, meta description, URL slug, body content, featured image, alt text and tags
- Overall score out of 100, plus a verdict for each group
- Google result preview that truncates the title and description by pixel width, as Google does
- Social share card preview (Open Graph style, 1.91:1 image)
- Rich-text body editor with headings, lists, and internal and external links (colour-coded), plus an HTML view and "Copy HTML"
- Pasting from Word or a web page is cleaned down to plain paragraphs, headings, lists, bold, italic and links
- **Import from page source**: paste a page's full HTML to fill the fields and run technical checks (H1 count, canonical, Open Graph, Twitter card, `lang`, hreflang, robots `noindex`, viewport, image alt attributes)
- "Load an example" button for a quick demo
- Light and dark themes (follows the system setting)

## Privacy

Everything runs in your browser. Nothing you type, paste or upload is sent to a server. Your last draft, including an uploaded image, is kept in the browser's `localStorage` so it survives a reload. **Clear all fields** removes it. The only external request is for the Public Sans font from Google Fonts.

## What is checked

| Group | Checks | Good range |
|---|---|---|
| Focus keyphrase | Word count | 1–4 words |
| SEO title | Pixel width (20px Arial), character count, keyphrase at the start | 30+ characters, ≤ 600 px |
| Meta description | Length, keyphrase present | 120–158 characters |
| URL | Allowed characters, last segment length, keyphrase words | Lowercase, digits, hyphens; ≤ 75 characters |
| Content | Word count, keyphrase in first paragraph, density, subheadings, paragraph and sentence length, internal and outbound links | 300+ words; density 0.5–3%; ≤ 25% of sentences over 20 words; paragraphs ≤ 150 words |
| Featured image | Dimensions, aspect ratio, file size, format, alt text | ≥ 1200 × 630 px, about 1.91:1, ≤ 300 KB, JPEG/PNG/WebP/AVIF; alt ≤ 125 characters |
| Tags | Count, duplicates, long phrases, keyphrase match | 3–8 tags |
| Page tags (import only) | H1, canonical, Open Graph, Twitter card, `lang`, hreflang, robots, viewport, image alt attributes | One H1, all tags present |

Keyphrase matching ignores case and accents and matches whole words only, so "art" does not match "party".

Links are classified as internal when they are relative or point to the **Site domain** (including subdomains); everything else counts as outbound. Set the site domain to classify absolute links correctly.

The score counts good checks as 1 and medium checks as 0.5, divided by the number of checks. 80 or more is Good and 55 or more is Medium.

These thresholds are common SEO guidelines (similar to the ones Yoast and Rank Math use), not official Google rules. Treat the results as a writing checklist, not a ranking guarantee.

## Usage

### Online

Open the [GitHub Pages version](https://thecoolsim.github.io/SEO-page-check/).

### Locally

No build step and no dependencies. Download or clone the repository and open `index.html` in a browser:

```bash
git clone https://github.com/Thecoolsim/SEO-page-check.git
cd SEO-page-check
open index.html          # macOS; or double-click the file
```

### Importing a page

1. Open the page in your browser.
2. View the source: <kbd>Ctrl</kbd>+<kbd>U</kbd> on Windows or Linux, <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>U</kbd> on a Mac (in Safari, turn on the Develop menu first).
3. Select all, copy, and paste into **Import from a page's source**, then click **Read source**.
4. Set the focus keyphrase to complete the checks.

The body is taken from the first match of a Drupal body field, `article`, `main`, `[role=main]` or `body`. Navigation, headers, footers, forms and the H1 are removed.

## Files

| File | Description |
|---|---|
| `index.html` | Page markup |
| `seo-page-check.css` | Styles, including light and dark themes |
| `seo-page-check.js` | Checks, previews, editor and import logic |
| `docs/screenshot.png` | Screenshot for this README |

## Browser support

Current versions of Chrome, Edge, Firefox and Safari (16.4 or later). The editor uses `document.execCommand`, which is deprecated but still supported by all major browsers.

## Author

**Simon Adjatan**
- Website: https://adjatan.org/
- GitHub: https://github.com/Thecoolsim
- X: https://x.com/adjatan

## License

[MIT](LICENSE) © 2026 Simon Adjatan
