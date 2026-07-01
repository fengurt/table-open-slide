import type { HtmlTemplate, ModuleDef, TuneParamDef } from './templateRegistry.js';

export type ModuleStat = {
  id: string;
  label: string;
  maxChars: number;
  counts: { index: number; chars: number; preview: string }[];
  over: boolean;
};

export type LabBridgeComponent = {
  id: string;
  label: string;
  selector: string;
  paramKeys: string[];
  moduleId?: string;
};

export type LabSelectMessage = {
  type: 'hl-lab-select';
  componentId: string;
  label: string;
  elementIndex: number;
};

export function charCount(text: string): number {
  return text.replace(/\s+/g, '').length;
}

export function buildTuneCss(template: HtmlTemplate, params: Record<string, number>): string {
  const lines = template.params.map((p) => {
    const v = params[p.key] ?? p.default;
    return template.cssVar(p.key, v);
  });
  return `:root{\n${lines.join(';\n')};\n}`;
}

const BRIDGE_STYLES = `
#hl-lab-highlight,#hl-lab-highlight-label{position:fixed;z-index:2147483646;pointer-events:none;box-sizing:border-box}
#hl-lab-highlight{display:none;border-radius:4px;background:transparent;border:2px solid transparent}
#hl-lab-highlight::after{content:"";position:absolute;inset:-2px;border-radius:6px;padding:2px;background:linear-gradient(90deg,#7aa2ff,#ff8b7a,#7aa2ff,#7aa2ff);background-size:300% 100%;animation:hl-lab-flow 2.2s linear infinite;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude}
#hl-lab-highlight.is-on{display:block}
#hl-lab-highlight.is-selected::after{background:linear-gradient(90deg,#ff8b7a,#7aa2ff,#ff8b7a,#ff8b7a);animation-duration:1.6s}
#hl-lab-highlight-label{display:none;top:0;left:0;padding:3px 8px;border-radius:4px;font:600 11px/1.3 ui-sans-serif,system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#fff;background:rgba(18,24,36,.88);border:1px solid rgba(122,162,255,.45);white-space:nowrap;transform:translateY(calc(-100% - 4px))}
#hl-lab-highlight-label.is-on{display:block}
@keyframes hl-lab-flow{0%{background-position:0% 50%}100%{background-position:300% 50%}}
[data-hl-tunable]{cursor:pointer}
`;

function buildBridgeScript(components: LabBridgeComponent[]): string {
  const payload = JSON.stringify(components).replace(/<\//g, '<\\/');
  return `(function(){
var components=${payload};
var highlight=null,label=null,selected=null,selectedEl=null;
function ensure(){
  if(highlight)return;
  highlight=document.createElement("div");
  highlight.id="hl-lab-highlight";
  label=document.createElement("div");
  label.id="hl-lab-highlight-label";
  document.body.appendChild(highlight);
  document.body.appendChild(label);
}
function hide(){
  if(!highlight)return;
  if(selected)return;
  highlight.classList.remove("is-on");
  label.classList.remove("is-on");
}
function show(el,text,isSel){
  ensure();
  var r=el.getBoundingClientRect();
  highlight.style.top=r.top+"px";
  highlight.style.left=r.left+"px";
  highlight.style.width=r.width+"px";
  highlight.style.height=r.height+"px";
  label.style.top=r.top+"px";
  label.style.left=r.left+"px";
  label.textContent=text;
  highlight.classList.toggle("is-selected",!!isSel);
  highlight.classList.add("is-on");
  label.classList.add("is-on");
}
function bind(comp){
  var nodes=document.querySelectorAll(comp.selector);
  nodes.forEach(function(el,idx){
    el.setAttribute("data-hl-tunable","1");
    el.addEventListener("mouseenter",function(){
      if(selectedEl&&selectedEl!==el)return;
      show(el,comp.label,false);
    });
    el.addEventListener("mouseleave",function(){
      if(selectedEl===el)return;
      hide();
    });
    el.addEventListener("click",function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      selected={id:comp.id,label:comp.label,index:idx};
      selectedEl=el;
      show(el,comp.label,true);
      parent.postMessage({type:"hl-lab-select",componentId:comp.id,label:comp.label,elementIndex:idx},"*");
    });
  });
}
function init(){
  components.forEach(bind);
  window.addEventListener("scroll",function(){if(selectedEl)show(selectedEl,selected.label,true);else hide();},true);
  window.addEventListener("resize",function(){if(selectedEl)show(selectedEl,selected.label,true);});
}
window.addEventListener("message",function(ev){
  var d=ev.data;
  if(!d||typeof d!=="object")return;
  if(d.type==="hl-lab-deselect"){
    selected=null;selectedEl=null;
    highlight&&highlight.classList.remove("is-on","is-selected");
    label&&label.classList.remove("is-on");
  }
  if(d.type==="hl-lab-measure"){
    var regions=[];
    var overflow=false;
    [".slide",".main",".columns"].concat(Array.from(document.querySelectorAll(".col")).map(function(_,i){return".col";})).forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        var sh=el.scrollHeight,ch=el.clientHeight;
        if(sh>ch+1)overflow=true;
        regions.push({selector:sel,scrollHeight:sh,clientHeight:ch});
      });
    });
    document.querySelectorAll(".col").forEach(function(el,i){
      var sh=el.scrollHeight,ch=el.clientHeight;
      if(sh>ch+1)overflow=true;
      regions.push({selector:".col["+i+"]",scrollHeight:sh,clientHeight:ch});
    });
    parent.postMessage({type:"hl-lab-measure-result",id:d.id,overflow:overflow,regions:regions},"*");
  }
});
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init);}else{init();}
})();`;
}

export function injectLabPreview(
  html: string,
  css: string,
  components: LabBridgeComponent[],
): string {
  const headInject = `<style id="html-lab-tune">\n${css}\n</style>\n<style id="html-lab-bridge">\n${BRIDGE_STYLES}\n</style>\n`;
  const scriptBlock = `<script id="html-lab-bridge">${buildBridgeScript(components)}</script>\n`;
  let out = html;
  if (out.includes('</head>')) {
    out = out.replace('</head>', `${headInject}</head>`);
  } else {
    out = `${headInject}${out}`;
  }
  if (out.includes('</body>')) {
    return out.replace('</body>', `${scriptBlock}</body>`);
  }
  return `${out}${scriptBlock}`;
}

/** @deprecated use injectLabPreview */
export function injectTuneIntoHtml(html: string, css: string): string {
  const block = `<style id="html-lab-tune">\n${css}\n</style>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${block}\n</head>`);
  }
  return `${block}\n${html}`;
}

export function updatePreviewTuneCss(
  doc: Document,
  template: HtmlTemplate,
  params: Record<string, number>,
): void {
  const css = buildTuneCss(template, params);
  let el = doc.getElementById('html-lab-tune');
  if (!el) {
    el = doc.createElement('style');
    el.id = 'html-lab-tune';
    doc.head?.appendChild(el);
  }
  el.textContent = css;
}

export function analyzeModules(html: string, modules: ModuleDef[]): ModuleStat[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return modules.map((mod) => {
    const nodes = doc.querySelectorAll(mod.selector);
    const counts: ModuleStat['counts'] = [];
    if (mod.perElement) {
      nodes.forEach((el, i) => {
        const text = (el.textContent ?? '').trim();
        counts.push({
          index: i + 1,
          chars: charCount(text),
          preview: text.slice(0, 36) + (text.length > 36 ? '…' : ''),
        });
      });
    } else if (nodes.length > 0) {
      const text = Array.from(nodes)
        .map((el) => (el.textContent ?? '').trim())
        .join('');
      counts.push({
        index: 1,
        chars: charCount(text),
        preview: text.slice(0, 36) + (text.length > 36 ? '…' : ''),
      });
    }
    const over = counts.some((c) => c.chars > mod.maxChars);
    return { id: mod.id, label: mod.label, maxChars: mod.maxChars, counts, over };
  });
}

export function filterParamsForComponent(
  template: HtmlTemplate,
  componentId: string | null,
): TuneParamDef[] {
  if (!componentId) return template.params;
  const comp = template.components.find((c) => c.id === componentId);
  if (!comp || comp.paramKeys.length === 0) return [];
  const keys = new Set(comp.paramKeys);
  return template.params.filter((p) => keys.has(p.key));
}

export function filterModuleStatsForComponent(
  moduleStats: ModuleStat[],
  componentId: string | null,
  elementIndex: number | null,
  template: HtmlTemplate,
): ModuleStat[] {
  if (!componentId) return moduleStats;
  const comp = template.components.find((c) => c.id === componentId);
  if (!comp?.moduleId) return [];
  const mod = moduleStats.find((m) => m.id === comp.moduleId);
  if (!mod) return [];
  if (elementIndex === null) return [mod];
  const one = mod.counts.find((c) => c.index === elementIndex + 1);
  if (!one) return [mod];
  return [
    {
      ...mod,
      counts: [one],
      over: one.chars > mod.maxChars,
    },
  ];
}
