# SEO audit — http://127.0.0.1:5188

2026-11-14 · 2 pages crawled · **0 errors, 7 warnings, 7 notes**

## Score: 80/100 (B)

`######################......`  **80**

20 points across 6 checks. 58 passed and 42 did not apply.

An error-level check costs 12 points and a warning 4, spread across the pages it is on. Notes cost nothing. A check that could not apply is left out rather than counted as passed.

| Area | Costing | Passing | Failing |
|---|--:|--:|--:|
| Content | −6 | 14 | 2 |
| Redirects | −4 | 4 | 1 |
| Site & security | −4 | 3 | 1 |
| Sitemap & robots | −4 | 7 | 1 |
| Links | −2 | 4 | 1 |

## Start here

14 findings are **11 things to change**. The widest:

| | What to change | Where | Worth |
|:-:|---|---|--:|
| ! | Thin page | every page crawled (2), starting at the homepage | +4.0 |
| ! | HSTS not set | once | +4.0 |
| ! | Nothing links to this page | once | +2.0 |
| ! | Title is very short | once | +2.0 |
| ! | Pages answer with and without a trailing slash | once | +4.0 |
| ! | 2 sitemap URLs will not be indexed | once | +4.0 |
| · | Canonical points elsewhere | every page crawled (2), starting at the homepage | — |
| · | No links inside the content | every page crawled (2), starting at the homepage | — |

## Summary

| | Area | Finding | Pages |
|---|---|---|---:|
| · | Indexability | Canonical points elsewhere | 2 |
| ! | Content | Thin page | 2 |
| ! | Content | Title is very short | 1 |
| · | Content | 2 pages were not compared for duplicate content | 1 |
| ! | Links | Nothing links to this page | 1 |
| · | Links | No links inside the content | 2 |
| ! | Redirects | Pages answer with and without a trailing slash | 1 |
| ! | Sitemap & robots | 2 sitemap URLs will not be indexed | 1 |
| · | Sitemap & robots | No page in the sitemap declares a lastmod | 1 |
| · | AI & answer engines | No llms.txt | 1 |
| ! | Site & security | HSTS not set | 1 |

## What to fix

### Content

#### ! Thin page

- http://127.0.0.1:5188/ _(not indexable)_  
  9 words. Under ~300 rarely ranks for anything competitive.
- http://127.0.0.1:5188/privacy _(not indexable)_  
  10 words. Under ~300 rarely ranks for anything competitive.

#### ! Title is very short

- http://127.0.0.1:5188/ _(not indexable)_  
  5 chars: "MyPal"

### Links

#### ! Nothing links to this page

- http://127.0.0.1:5188/privacy _(not indexable)_  
  It is in the sitemap, but no other page links to it — so it collects no internal authority.

### Redirects

#### ! Pages answer with and without a trailing slash

- http://127.0.0.1:5188  
  1 of 1 sampled pages load both ways, which is two URLs for one page. One form should redirect to the other.

### Sitemap & robots

#### ! 2 sitemap URLs will not be indexed

- http://127.0.0.1:5187/sitemap.xml  
  http://127.0.0.1:5188/ (canonical → https://mypal.tarlan-b06.workers.dev/), http://127.0.0.1:5188/privacy (canonical → https://mypal.tarlan-b06.workers.dev/privacy). A sitemap is a list of the pages you want indexed; these ask not to be. Either drop them from the sitemap or drop the directive.

### Site & security

#### ! HSTS not set

- http://127.0.0.1:5188/ _(not indexable)_  
  Browsers will try HTTP first on the next visit.

## Worth knowing

None of this costs the score anything, and some of it is deliberate — a note is a fact, not an instruction.

### Indexability

#### · Canonical points elsewhere

- http://127.0.0.1:5188/ _(not indexable)_  
  → https://mypal.tarlan-b06.workers.dev/ (deliberate for a duplicate, a problem otherwise)
- http://127.0.0.1:5188/privacy _(not indexable)_  
  → https://mypal.tarlan-b06.workers.dev/privacy (deliberate for a duplicate, a problem otherwise)

### Content

#### · 2 pages were not compared for duplicate content

- http://127.0.0.1:5188/ _(not indexable)_  
  Content is compared inside <main> or <article>. Without one of those the text of a page is the whole document, navigation and footer included, and every page of a small site would look like a copy of every other. Pages under about a hundred words are skipped for the same reason — at that length two pages share most of their words whatever they say.

### Links

#### · No links inside the content

- http://127.0.0.1:5188/ _(not indexable)_  
  Only navigation links out of this page — nothing passes authority to related pages.
- http://127.0.0.1:5188/privacy _(not indexable)_  
  Only navigation links out of this page — nothing passes authority to related pages.

### Sitemap & robots

#### · No page in the sitemap declares a lastmod

- http://127.0.0.1:5187/sitemap.xml  
  Crawlers use it to decide what to look at again. Without it, a large site is re-crawled on guesswork, and a page that changed waits its turn behind pages that did not.

### AI & answer engines

#### · No llms.txt

- http://127.0.0.1:5188/llms.txt  
  The emerging convention for telling AI assistants what a site is and which pages matter.

## Passing — 58 checks


**Indexability**

- ✅ Every page answers 200
- ✅ The site answers
- ✅ There is something to crawl
- ✅ No page in the sitemap says noindex
- ✅ No X-Robots-Tag hides a page
- ✅ No page tells Google to follow none of its links
- ✅ The robots meta and header agree
- ✅ Every page served as HTML is HTML
- ✅ A URL that cannot exist returns 404
- ✅ Every page declares a canonical
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
- ✅ Every page has an h1
- ✅ No page has two h1s
- ✅ Heading levels do not skip
- ✅ No two pages share a title
- ✅ No two pages share a description
- ✅ Every page declares its language
- ✅ Every page declares its character set
- ✅ Every page declares a viewport
- ✅ No viewport blocks zooming
- ✅ No viewport is a fixed pixel width

**Links**

- ✅ Every internal link resolves
- ✅ Every page is reachable from the homepage
- ✅ Every destination has a link that names it
- ✅ Every linked page is in the sitemap

**Redirects**

- ✅ No page redirects with a meta refresh
- ✅ No sitemap URL redirects
- ✅ No redirect takes more than one hop
- ✅ Every host variant reaches the site

**Social**

- ✅ Every page has an og:title
- ✅ Every page has an og:description
- ✅ Every page has an og:image
- ✅ Every og:image is an absolute URL
- ✅ Every og:image loads
- ✅ No og:image is too heavy to scrape
- ✅ No og:image is WebP
- ✅ Every twitter:image loads

**Multilingual**

- ✅ html lang agrees with the Content-Language header

**Sitemap & robots**

- ✅ The site has a sitemap
- ✅ robots.txt is there
- ✅ robots.txt does not block the site
- ✅ robots.txt does not block its own sitemap URLs
- ✅ No lastmod is in the future
- ✅ Every sitemap file is within 50,000 URLs
- ✅ Every sitemap file is within 50MB

**Site & security**

- ✅ The favicon loads
- ✅ No URL has uppercase in its path
- ✅ No URL has a space in it

**Performance**

- ✅ HTML arrives compressed

## Not checked — 42 checks

These did not apply to this run and are not counted either way.

| Why | Checks |
|---|---|
| The pages were not fetched a second time — run with --compare-as. | `serves-differently` |
| No page marks its content region, so pages cannot be compared. | `duplicate-content` |
| No crawled page links to a section inside another crawled page. | `fragment-missing` |
| Outbound links were not checked — run with --check-external. | `external-broken` |
| No redirect map was given — run with --redirects. | `redirect-dead`, `redirect-broken`, `redirect-not-applied`, `redirect-hops`, `redirect-elsewhere`, `redirect-temporary` |
| No page carries an image. | `img-alt`, `img-alt-filename`, `img-alt-placeholder`, `img-dimensions`, `broken-image` |
| No page carries structured data. | `jsonld-invalid`, `jsonld-no-type`, `schema-incomplete`, `schema-date-order`, `schema-date-future`, `schema-image-broken` |
| No schema expectations are configured. | `schema-expected` |
| No page declares hreflang. | `hreflang-invalid`, `hreflang-one-way`, `hreflang-dead`, `hreflang-no-self`, `hreflang-lang-mismatch` |
| The site serves no llms.txt, so there is nothing for robots.txt to contradict. | `ai-crawler-conflict` |
| The site is not served over HTTPS. | `mixed-content` |
| The certificate could not be read from this runtime. | `tls-expired`, `tls-expiring` |
| The rest of the domain was not enumerated — run with --hosts. | `subdomain-takeover`, `staging-indexable`, `duplicate-host` |
| PageSpeed was not asked — run with --psi. | `psi-score`, `psi-lcp`, `psi-cls`, `psi-inp`, `psi-opportunity` |
| Google has no real-visitor data for these pages yet. | `psi-field-lcp`, `psi-field-cls`, `psi-field-inp` |

---

Performance and Core Web Vitals are deliberately not measured here — use [PageSpeed Insights](https://pagespeed.web.dev) and [WebPageTest](https://webpagetest.org), which run real browsers. Generated by [seo-audit](https://github.com/nurkamol/seo-audit).
