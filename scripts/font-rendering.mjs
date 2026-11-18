import assert from "node:assert/strict";

const alphabet = "әӘғҒқҚңҢөӨұҰүҮһҺіІ Ая Ёё AIdos 0123456789";

// fonts.check() alone also succeeds when a system font supplies a missing glyph.
// Inspect the rendered typefaces as well, isolating letters from pictographic emoji.
export async function checkRenderedFonts(page, cdp) {
  const expected = await page.evaluate(async alphabet => {
    const root = document.createElement("div");
    root.id = "font-audit";
    root.setAttribute("aria-hidden", "true");
    root.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    const faces = new Map();
    const direct = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!el.getClientRects().length || el.closest("svg,script,style,.sr-only")) continue;
      const text = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent).join("").trim() || el.placeholder || "";
      if (!/[\p{Script=Cyrillic}a-z0-9]/iu.test(text)) continue;
      const css = getComputedStyle(el);
      const family = css.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      if (!["Rubik", "Nunito"].includes(family)) throw Error(el.tagName + " renders " + text + " in " + family);
      if (el.matches("h1,h2,h3,button,[role=timer],.need-chip,.profile-submit") && family !== "Rubik")
        throw Error(el.tagName + "." + el.className + " needs Rubik: " + text);
      const spec = css.fontStyle + " " + css.fontWeight + " 24px " + family;
      faces.set(spec, family);
      // Use real nodes too when there is no icon or punctuation needing an OS symbol font.
      if (!el.children.length && !el.matches("input,textarea,select,option") && /^[\p{Script=Cyrillic}A-Za-z0-9 ]+$/u.test(text) && direct.length < 12) {
        el.dataset.fontAudit = family;
        direct.push(el);
      }
    }
    document.body.append(root);
    for (const [spec, family] of faces) {
      const probe = document.createElement("span");
      probe.dataset.fontAudit = family;
      probe.style.font = spec;
      probe.textContent = alphabet;
      root.append(probe);
      const loaded = await document.fonts.load(spec, alphabet);
      if (!loaded.length || !document.fonts.check(spec, alphabet)) throw Error("Font unavailable: " + spec);
    }
    await document.fonts.ready;
    return [...document.querySelectorAll("[data-font-audit]")].map(el => ({family: el.dataset.fontAudit, text: el.textContent.slice(0, 48)}));
  }, alphabet);

  try {
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-font-audit]" });
    assert(nodeIds.length > 0 && nodeIds.length === expected.length, "No rendered font samples");
    await Promise.all(nodeIds.map(async (nodeId, i) => {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      assert(fonts.some(f => f.glyphCount > 0), "No rendered glyphs for " + expected[i].text);
      for (const font of fonts) assert(font.isCustomFont && font.familyName.split(" ")[0] === expected[i].family,
        "Expected " + expected[i].family + ", rendered " + font.familyName + " (" + font.glyphCount + " glyphs)");
    }));
  } finally {
    await page.evaluate(() => {
      document.getElementById("font-audit")?.remove();
      document.querySelectorAll("[data-font-audit]").forEach(el => delete el.dataset.fontAudit);
    });
  }
}
