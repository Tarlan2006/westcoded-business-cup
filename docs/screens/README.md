# Browser audit evidence

`smoke-report.json` lists all checked states at 390×844, 768×1024, 1280×900 and 844×390. `large-text/` contains the same path at 390×844 with 200% root text size. Screenshots use synthetic AuditPal data; no real child's details are included.

API success/failure responses are mocked and deliberate offline/404/503 resource errors are reported. Real YouTube playback, physical-device speech and provider success are not certified by these images. See the repository's `AUDIT.md` for measurements and limitations.

Recreate with `npm run build`, `npm run preview`, then `SMOKE_URL=<local preview URL> SMOKE_MOCK_API=1 npm run smoke` (set environment variables using your shell's syntax). `CHROME_PATH` can select an installed Chrome. Restart the preview after rebuilding.
