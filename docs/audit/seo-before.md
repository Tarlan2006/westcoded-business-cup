# SEO audit — https://mypal.tarlan-b06.workers.dev

2026-11-14 · 1 pages crawled · **2 errors, 8 warnings, 6 notes**

## Score: 48/100 (F)

`#############...............`  **48**

52 points across 9 checks. 47 passed and 50 did not apply. Clear the errors alone and it is **72**.

An error-level check costs 12 points and a warning 4, spread across the pages it is on. Notes cost nothing. A check that could not apply is left out rather than counted as passed.

| Area | Costing | Passing | Failing |
|---|--:|--:|--:|
| Content | −20 | 11 | 3 |
| Indexability | −16 | 14 | 2 |
| Redirects | −4 | 3 | 1 |
| Site & security | −4 | 6 | 1 |
| Sitemap & robots | −4 | 2 | 1 |
| Social | −4 | 6 | 1 |

## Start here

16 findings are **15 things to change**. The widest:

| | What to change | Where | Worth |
|:-:|---|---|--:|
| ✗ | No <h1> | once | +12.0 |
| ✗ | A page that does not exist answers 200 | once | +12.0 |
| ! | No canonical link | once | +4.0 |
| ! | HSTS not set | once | +4.0 |
| ! | No sitemap found | once | +4.0 |
| ! | Missing og:description | once | +4.0 |
| ! | Thin page | once | +4.0 |
| ! | Title is very short | once | +4.0 |

## Summary

| | Area | Finding | Pages |
|---|---|---|---:|
| ✗ | Indexability | A page that does not exist answers 200 | 1 |
| ! | Indexability | No canonical link | 1 |
| ✗ | Content | No <h1> | 1 |
| ! | Content | Title is very short | 1 |
| ! | Content | Thin page | 1 |
| · | Links | No links inside the content | 1 |
| ! | Redirects | https://www.mypal.tarlan-b06.workers.dev/ does not resolve to a page | 2 |
| ! | Social | Missing og:description | 1 |
| · | Social | og:image has no declared width/height | 1 |
| ! | Sitemap & robots | No sitemap found | 1 |
| · | Sitemap & robots | robots.txt does not list a sitemap | 1 |
| ! | Site & security | HSTS not set | 1 |
| · | Site & security | X-Content-Type-Options not set | 1 |
| · | Site & security | Referrer-Policy not set | 1 |
| · | Site & security | No Content-Security-Policy | 1 |

## What to fix

### Indexability

#### ✗ A page that does not exist answers 200

- https://mypal.tarlan-b06.workers.dev/seo-audit-probe-404/  
  https://mypal.tarlan-b06.workers.dev/seo-audit-probe-404/ answers 200 directly, with an HTML body. Every mistyped or stale URL is a live, indexable page, so the index fills with copies of the error page. Return a real 404.

#### ! No canonical link

- https://mypal.tarlan-b06.workers.dev/  
  Duplicate URLs will compete with each other.

### Content

#### ✗ No <h1>

- https://mypal.tarlan-b06.workers.dev/  
  The page has no headline.

#### ! Title is very short

- https://mypal.tarlan-b06.workers.dev/  
  5 chars: "MyPal"

#### ! Thin page

- https://mypal.tarlan-b06.workers.dev/  
  1 words. Under ~300 rarely ranks for anything competitive.

### Redirects

#### ! https://www.mypal.tarlan-b06.workers.dev/ does not resolve to a page

- https://www.mypal.tarlan-b06.workers.dev/  
  Request failed: fetch failed
- http://www.mypal.tarlan-b06.workers.dev/  
  Ends at HTTP 404

### Social

#### ! Missing og:description

- https://mypal.tarlan-b06.workers.dev/  
  Shared links preview with whatever text the platform scrapes.

### Sitemap & robots

#### ! No sitemap found

- https://mypal.tarlan-b06.workers.dev  
  Tried: https://mypal.tarlan-b06.workers.dev/sitemap-index.xml → 200, https://mypal.tarlan-b06.workers.dev/sitemap_index.xml → 200, https://mypal.tarlan-b06.workers.dev/sitemap.xml → 200. This run followed links from the homepage instead, which is what a crawler has to do without one — 1 pages were reached that way. A sitemap states the pages you want indexed rather than leaving it to be inferred, and carries lastmod. Pass --sitemap <url> if one exists somewhere unusual.

### Site & security

#### ! HSTS not set

- https://mypal.tarlan-b06.workers.dev/  
  Browsers will try HTTP first on the next visit.

## Worth knowing

None of this costs the score anything, and some of it is deliberate — a note is a fact, not an instruction.

### Links

#### · No links inside the content

- https://mypal.tarlan-b06.workers.dev/  
  Only navigation links out of this page — nothing passes authority to related pages.

### Social

#### · og:image has no declared width/height

- https://mypal.tarlan-b06.workers.dev/  
  Scrapers guess, and some skip the preview rather than guess.

### Sitemap & robots

#### · robots.txt does not list a sitemap

- https://mypal.tarlan-b06.workers.dev/robots.txt  
  One line, and every crawler finds the sitemap without guessing.

### Site & security

#### · X-Content-Type-Options not set

- https://mypal.tarlan-b06.workers.dev/  
  nosniff stops MIME-type guessing.

#### · Referrer-Policy not set

- https://mypal.tarlan-b06.workers.dev/  
  Full URLs leak to third parties by default.

#### · No Content-Security-Policy

- https://mypal.tarlan-b06.workers.dev/  
  The strongest defence against injected scripts.

## Passing — 47 checks


**Indexability**

- ✅ Every page answers 200
- ✅ The site answers
- ✅ There is something to crawl
- ✅ No page in the sitemap says noindex
- ✅ No X-Robots-Tag hides a page
- ✅ No page tells Google to follow none of its links
- ✅ The robots meta and header agree
- ✅ Every page served as HTML is HTML
- ✅ No page declares two canonicals
- ✅ Every canonical target loads
- ✅ No canonical points at a redirect
- ✅ No canonical points at a noindexed page
- ✅ Paginated pages name themselves
- ✅ No canonical target is canonicalised again

**Content**

- ✅ Every page has a title
- ✅ No title is cut off in results
- ✅ Every page has a meta description
- ✅ No meta description is cut off
- ✅ No page has two h1s
- ✅ Heading levels do not skip
- ✅ Every page declares its language
- ✅ Every page declares its character set
- ✅ Every page declares a viewport
- ✅ No viewport blocks zooming
- ✅ No viewport is a fixed pixel width

**Links**

- ✅ Every internal link resolves
- ✅ Every destination has a link that names it

**Redirects**

- ✅ No page redirects with a meta refresh
- ✅ No redirect takes more than one hop
- ✅ Trailing slashes are consistent

**Social**

- ✅ Every page has an og:title
- ✅ Every page has an og:image
- ✅ Every og:image is an absolute URL
- ✅ Every og:image loads
- ✅ No og:image is too heavy to scrape
- ✅ No og:image is WebP

**Multilingual**

- ✅ html lang agrees with the Content-Language header

**Sitemap & robots**

- ✅ robots.txt is there
- ✅ robots.txt does not block the site

**AI & answer engines**

- ✅ robots.txt and llms.txt agree about AI assistants

**Site & security**

- ✅ The favicon loads
- ✅ No page loads an insecure subresource
- ✅ The TLS certificate is valid
- ✅ The TLS certificate is not about to expire
- ✅ No URL has uppercase in its path
- ✅ No URL has a space in it

**Performance**

- ✅ HTML arrives compressed

## Not checked — 50 checks

These did not apply to this run and are not counted either way.

| Why | Checks |
|---|---|
| The pages were not fetched a second time — run with --compare-as. | `serves-differently` |
| Only one page was crawled. | `duplicate-title`, `duplicate-description`, `no-path-from-home` |
| No page marks its content region, so pages cannot be compared. | `duplicate-content` |
| No crawled page links to a section inside another crawled page. | `fragment-missing` |
| Outbound links were not checked — run with --check-external. | `external-broken` |
| No sitemap was found. | `orphan-page`, `missing-from-sitemap`, `sitemap-redirect`, `robots-blocks-sitemap-url`, `sitemap-not-indexable`, `sitemap-lastmod-future`, `sitemap-too-many-urls`, `sitemap-too-large` |
| No redirect map was given — run with --redirects. | `redirect-dead`, `redirect-broken`, `redirect-not-applied`, `redirect-hops`, `redirect-elsewhere`, `redirect-temporary` |
| No page carries an image. | `img-alt`, `img-alt-filename`, `img-alt-placeholder`, `img-dimensions`, `broken-image` |
| No page declares a twitter:image of its own. | `twitter-image-broken` |
| No page carries structured data. | `jsonld-invalid`, `jsonld-no-type`, `schema-incomplete`, `schema-date-order`, `schema-date-future`, `schema-image-broken` |
| No schema expectations are configured. | `schema-expected` |
| No page declares hreflang. | `hreflang-invalid`, `hreflang-one-way`, `hreflang-dead`, `hreflang-no-self`, `hreflang-lang-mismatch` |
| The rest of the domain was not enumerated — run with --hosts. | `subdomain-takeover`, `staging-indexable`, `duplicate-host` |
| PageSpeed was not asked — run with --psi. | `psi-score`, `psi-lcp`, `psi-cls`, `psi-inp`, `psi-opportunity` |
| Google has no real-visitor data for these pages yet. | `psi-field-lcp`, `psi-field-cls`, `psi-field-inp` |

---

Performance and Core Web Vitals are deliberately not measured here — use [PageSpeed Insights](https://pagespeed.web.dev) and [WebPageTest](https://webpagetest.org), which run real browsers. Generated by [seo-audit](https://github.com/nurkamol/seo-audit).
