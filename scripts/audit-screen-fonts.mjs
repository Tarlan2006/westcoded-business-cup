// Chromium's platform-font list identifies the faces actually used for each text node.
// For runs mixing letters and pictograms, also shape the text without the pictograms.
export async function auditScreenFonts(page, cdp) {
  await page.evaluate(() => document.fonts.ready);
  const rows = await page.evaluate(async () => {
    const layer = document.createElement("div");
    layer.id = "live-font-audit";
    layer.style.cssText = "position:fixed;left:0;top:0;opacity:0;pointer-events:none;z-index:-1";
    layer.setAttribute("aria-hidden", "true");
    const rows = [];
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const rendered = el => el.getClientRects().length && el.checkVisibility({opacityProperty:true,visibilityProperty:true}) && !el.closest(".sr-only,.flow-sr-only,script,style");
    for (const el of document.querySelectorAll("body *")) {
      if (!rendered(el)) continue;
      const runs = [];
      const children = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      for (const [index, n] of children.entries()) {
        if (el.matches("textarea,select,option")) continue;
        const range = new Range(); range.selectNodeContents(n);
        if ([...range.getClientRects()].some(r => r.width && r.height)) runs.push({text:n.textContent,index});
      }
      if (el.matches('textarea,input:not([type=checkbox],[type=radio],[type=range],[type=hidden]),select')) {
        const value = el.matches("select") ? el.selectedOptions[0]?.textContent : el.value;
        if (value || el.placeholder) runs.push({text:value || el.placeholder, pseudo: value ? undefined : "::placeholder",form:true});
      }
      for (const pseudo of ["::before","::after"]) {
        const content = getComputedStyle(el,pseudo).content;
        if (/^".+"$/.test(content)) runs.push({text:content.slice(1,-1),pseudo});
      }
      for (const run of runs) {
        const id = rows.length;
        el.dataset.screenFont = String(id);
        const css = getComputedStyle(el,run.pseudo);
        const family = css.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g,"");
        const parts = [...segmenter.segment(run.text)].map(x => x.segment);
        const isSymbol = s => /\p{Extended_Pictographic}|\p{S}|\u20e3|\p{Regional_Indicator}/u.test(s) && !/[\p{L}\p{N}]/u.test(s.replace(/\d\uFE0F?\u20e3/gu,""));
        const plain = parts.filter(s => !isSymbol(s)).join("").trim();
        const symbols = parts.filter(isSymbol).join("");
        let probe = null;
        if (plain && (symbols || run.form || run.pseudo)) {
          probe = document.createElement("span"); probe.dataset.screenProbe = String(id);
          Object.assign(probe.style,{fontFamily:css.fontFamily,fontSize:css.fontSize,fontWeight:css.fontWeight,fontStyle:css.fontStyle,
            fontStretch:css.fontStretch,fontVariationSettings:css.fontVariationSettings,textTransform:css.textTransform});
          probe.textContent = plain; layer.append(probe);
        }
        rows.push({el, text:run.text.trim(), selector:el.id ? "#"+el.id : el.localName+"."+[...el.classList].slice(0,3).join("."),
          family, plain, symbols, index:run.index, pseudo:run.pseudo, form:!!run.form, probe:!!probe,
          spec:css.fontStyle+" "+css.fontWeight+" 20px "+css.fontFamily});
      }
    }
    document.body.append(layer);
    await document.fonts.ready;
    return rows.map(({el,...row}) => ({...row,element:el.dataset.screenFont,
      available:!row.plain || document.fonts.check(row.spec,row.plain)}));
  });
  try {
    const {root} = await cdp.send("DOM.getDocument",{depth:-1});
    const elements = new Map(), probes = new Map();
    function visit(node) {
      const a = node.attributes || [];
      for(let i=0;i<a.length;i+=2) {
        if(a[i]==="data-screen-font") elements.set(a[i+1],node);
        if(a[i]==="data-screen-probe") probes.set(a[i+1],node);
      }
      for(const child of node.children || []) visit(child);
    }
    visit(root);
    const read = async node => node ? (await cdp.send("CSS.getPlatformFontsForNode",{nodeId:node.nodeId})).fonts.filter(f=>f.glyphCount) : [];
    const issues=[], symbolFonts=new Set(), actualFamilies=new Set();
    let textRuns=0;
    await Promise.all(rows.map(async (row,id)=>{
      const el=elements.get(row.element);
      const direct = row.form ? el : row.pseudo ? el?.pseudoElements?.find(n=>n.pseudoType===row.pseudo.slice(2)) :
        el?.children?.filter(n=>n.nodeType===3 && n.nodeValue.trim())[row.index];
      const actual=await read(direct);
      const content=row.probe ? await read(probes.get(String(id))) : actual;
      const matches=f=>f.isCustomFont && f.familyName.split(" ")[0]===row.family;
      const why=[];
      if(!["Rubik","Nunito"].includes(row.family)) why.push("CSS: "+row.family);
      if(row.plain){
        textRuns++;
        if(!row.available) why.push("document.fonts.check=false");
        if(!content.length) why.push("no glyph evidence");
        for(const f of content){actualFamilies.add(f.familyName);if(!matches(f))why.push("text: "+f.familyName);}
        if(!row.symbols && !row.pseudo) for(const f of actual)if(!matches(f))why.push("rendered: "+f.familyName);
      }
      if (row.symbols) for (const font of actual) {
        if (matches(font)) continue;
        symbolFonts.add(font.familyName + " · " + row.symbols);
        if (!/emoji/i.test(font.familyName)) why.push("symbol: " + font.familyName);
      }
      if(why.length)issues.push({selector:row.selector,text:row.text,why:[...new Set(why)]});
    }));
    return {elements:new Set(rows.map(r=>r.element)).size,runs:rows.length,textRuns,actualFamilies:[...actualFamilies].sort(),symbolFonts:[...symbolFonts].sort(),issues};
  } finally {
    await page.evaluate(()=>{document.getElementById("live-font-audit")?.remove();document.querySelectorAll("[data-screen-font]").forEach(el=>el.removeAttribute("data-screen-font"));});
  }
}
