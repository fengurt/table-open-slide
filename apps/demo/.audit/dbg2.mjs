import { chromium } from 'playwright';
const BASE='http://localhost:5173';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto(BASE+'/s/restaurant-profit-breakthrough-day1?p=1',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2000);
console.log(JSON.stringify(await p.evaluate(()=>({
  url:location.href, title:document.title,
  osd:document.querySelectorAll('[data-osd-canvas]').length,
  insp:document.querySelectorAll('[data-inspector-root]').length,
  inspCanvas:document.querySelectorAll('[data-inspector-root] [data-osd-canvas]').length,
})),null,2));
await b.close();
