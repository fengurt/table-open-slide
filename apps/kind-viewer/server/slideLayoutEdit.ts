import { layoutObjectLabelPattern } from './slideLayoutObjects.js';

/** In-slide WYSIWYG: flex columns for panels, text edit for content modules. */
export const LAYOUT_EDIT_CSS = `
.kind-layout-edit .slide-container{
  display:flex!important;position:relative!important;height:720px!important;
  overflow:hidden!important;
}
.kind-layout-edit .slide-container>.left-panel,
.kind-layout-edit .slide-container>.right-panel{
  position:relative!important;margin:0!important;height:100%!important;
  left:auto!important;top:auto!important;overflow:visible!important;
  box-sizing:border-box!important;min-height:0;
}
.kind-layout-edit .slide-container>.left-panel{flex:0 0 auto!important}
.kind-layout-edit .slide-container>.right-panel{flex:1 1 0!important;min-width:0!important}
.kind-layout-edit .slide-container>[data-kind-block]:not(.left-panel):not(.right-panel){
  position:relative!important;left:auto!important;top:auto!important;
  width:auto!important;height:auto!important;margin:0!important;
}
.kind-layout-edit [data-kind-block].kind-edit-selected{
  outline:2px solid #0ea5e9;outline-offset:2px;z-index:8!important;
}
.kind-layout-edit .kind-edit-chrome{
  position:absolute;inset:0;pointer-events:none;z-index:20;
}
.kind-layout-edit .kind-edit-chrome--panel{
  inset:0 0 0 auto;width:14px;left:auto;
}
.kind-layout-edit .kind-edit-bar{
  position:absolute;top:0;left:0;right:0;height:24px;
  background:rgba(14,165,233,.5);pointer-events:auto;
  display:flex;align-items:center;padding:0 8px;z-index:22;
  touch-action:none;user-select:none;
}
.kind-layout-edit .kind-edit-bar--panel{cursor:default;background:rgba(14,165,233,.28)}
.kind-layout-edit .kind-edit-label{
  font:600 9px/1 "JetBrains Mono",monospace;letter-spacing:.08em;
  text-transform:uppercase;color:#e0f2fe;pointer-events:none;
}
.kind-layout-edit .kind-edit-handle{
  position:absolute;background:#0ea5e9;border:1px solid #fff;
  pointer-events:auto;z-index:25;
}
.kind-layout-edit .kind-edit-handle--e{
  top:0;right:-6px;width:12px;height:100%;margin:0;cursor:ew-resize;
}
.kind-layout-edit .kind-edit-handle--w{
  top:0;left:-6px;width:12px;height:100%;margin:0;cursor:ew-resize;
}
.kind-layout-edit .kind-edit-guide{
  position:absolute;background:rgba(56,189,248,.8);pointer-events:none;z-index:30;
}
.kind-layout-edit .kind-edit-guide--v{width:2px;top:0;bottom:0}
.kind-layout-edit [data-kind-block][contenteditable="true"]:focus{
  outline:1px dashed rgba(56,189,248,.65);outline-offset:2px;
}
`;

export function injectLayoutEditScript(): string {
  const allow = layoutObjectLabelPattern();
  return `<script>
(function(){
  var SNAP=2,THRESH=1.2,MIN_COL=28,MAX_COL=72;
  var ALLOW=/${allow}/;
  var TEXT_SEL='.benefit-title,.benefit-desc,.outcome-title,.outcome-desc,.problem-title,.problem-desc,.huge-title,.subtitle,.tagline,.pillar-title,.item-title,.item-desc,.mission-text,.belief-text,.summary-label,.footer-text,.member-name,.moat-title,.moat-desc';
  var slide=document.querySelector('.slide-container');
  if(!slide){parent.postMessage({type:'kind-layout-update',blocks:[]},'*');return;}
  document.body.classList.add('kind-layout-edit');
  var selected=null,drag=null,guides=[];
  function labelOf(el){return (el.className||'').split(/\\s+/)[0]||'';}
  function isPanel(el){var l=labelOf(el);return l==='left-panel'||l==='right-panel';}
  function nodes(){
    return Array.prototype.filter.call(document.querySelectorAll('[data-kind-block]'),function(el){
      return ALLOW.test(labelOf(el));
    });
  }
  function leftPanel(){return nodes().find(function(n){return labelOf(n)==='left-panel';});}
  function rightPanel(){return nodes().find(function(n){return labelOf(n)==='right-panel';});}
  function clearAbs(el){
    el.style.position='';el.style.left='';el.style.top='';
    el.style.width='';el.style.height='';el.style.margin='';
  }
  function rectPct(el){
    var sr=slide.getBoundingClientRect();
    var r=el.getBoundingClientRect();
    return {
      x:((r.left-sr.left)/sr.width)*100,
      y:((r.top-sr.top)/sr.height)*100,
      w:(r.width/sr.width)*100,
      h:(r.height/sr.height)*100
    };
  }
  function snapVal(v){return Math.round(v/SNAP)*SNAP;}
  function setLeftColPct(pct){
    var lp=leftPanel();
    if(!lp)return;
    var w=Math.max(MIN_COL,Math.min(MAX_COL,snapVal(pct)));
    lp.style.width=w+'%';
    lp.style.flex='0 0 auto';
    lp.style.height='100%';
    var rp=rightPanel();
    if(rp){rp.style.flex='1 1 0';rp.style.minWidth='0';rp.style.height='100%';}
    showGuide('v',w);
  }
  function clearGuides(){
    guides.forEach(function(g){g.remove();});
    guides=[];
  }
  function showGuide(axis,pos){
    var g=document.createElement('div');
    g.className='kind-edit-guide kind-edit-guide--'+axis;
    if(axis==='v')g.style.left=pos+'%';
    slide.appendChild(g);guides.push(g);
  }
  function panelBlocks(){
    var blocks=[];
    var lp=leftPanel();
    var rp=rightPanel();
    if(lp){
      var w=rectPct(lp).w;
      blocks.push({id:lp.getAttribute('data-kind-block'),label:'left-panel',x:0,y:0,w:w,h:100});
    }
    if(rp&&lp){
      var w=rectPct(lp).w;
      blocks.push({id:rp.getAttribute('data-kind-block'),label:'right-panel',x:w,y:0,w:100-w,h:100});
    }else if(rp){
      var r=rectPct(rp);
      blocks.push({id:rp.getAttribute('data-kind-block'),label:'right-panel',x:r.x,y:0,w:r.w,h:100});
    }
    return blocks;
  }
  function emit(){
    parent.postMessage({
      type:'kind-layout-update',
      blocks:panelBlocks(),
      selectedId:selected?selected.getAttribute('data-kind-block'):null
    },'*');
  }
  var activeText=null;
  function clearEditable(){
    document.querySelectorAll('[contenteditable="true"]').forEach(function(t){
      t.removeAttribute('contenteditable');
    });
    activeText=null;
  }
  function fieldClassOf(el){
    return (el.className||'').split(/\\s+/)[0]||'';
  }
  function select(el){
    nodes().forEach(function(n){n.classList.remove('kind-edit-selected');});
    clearEditable();
    selected=el;
    if(el)el.classList.add('kind-edit-selected');
    emit();
  }
  function focusText(target){
    if(!selected||!target)return;
    clearEditable();
    activeText=target;
    target.setAttribute('contenteditable','true');
    target.focus();
  }
  function mountChrome(el){
    if(el.querySelector('.kind-edit-chrome'))return;
    var lab=labelOf(el);
    var panel=isPanel(el);
    var chrome=document.createElement('div');
    chrome.className='kind-edit-chrome'+(panel?' kind-edit-chrome--panel':'');
    var bar=document.createElement('div');
    bar.className='kind-edit-bar'+(panel?' kind-edit-bar--panel':'');
    bar.innerHTML='<span class="kind-edit-label">'+lab+'</span>';
    chrome.appendChild(bar);
    function handle(cls,mode){
      var h=document.createElement('span');
      h.className='kind-edit-handle '+cls;
      h.dataset.mode=mode;
      chrome.appendChild(h);
    }
    if(panel){
      if(lab==='left-panel')handle('kind-edit-handle--e','resize-col');
      if(lab==='right-panel')handle('kind-edit-handle--w','resize-col');
    }
    el.appendChild(chrome);
    function armDrag(handle,mode){
      handle.addEventListener('pointerdown',function(e){
        if(e.button!==0)return;
        e.preventDefault();e.stopPropagation();
        select(el);
        try{handle.setPointerCapture(e.pointerId);}catch(err){}
        startColDrag(e);
      });
    }
    if(panel){
      chrome.querySelectorAll('.kind-edit-handle').forEach(function(h){armDrag(h,'resize-col');});
    }
    el.addEventListener('pointerdown',function(e){
      if(e.target.closest('.kind-edit-chrome'))return;
      e.stopPropagation();
      select(el);
      var hit=e.target.closest(TEXT_SEL);
      if(hit&&el.contains(hit))focusText(hit);
    });
    el.querySelectorAll(TEXT_SEL).forEach(function(t){
      t.addEventListener('focus',function(){focusText(t);});
      t.addEventListener('blur',function(){
        if(activeText!==t)return;
        var field=fieldClassOf(t);
        if(!field)return;
        parent.postMessage({
          type:'kind-block-text',
          blockId:el.getAttribute('data-kind-block'),
          field:field,
          text:(t.innerText||t.textContent||'').trim()
        },'*');
        t.removeAttribute('contenteditable');
        activeText=null;
      });
    });
  }
  function startColDrag(e){
    var lp=leftPanel();
    if(!lp)return;
    var startW=rectPct(lp).w;
    var sx=e.clientX;
    document.body.style.userSelect='none';
    function onMove(ev){
      ev.preventDefault();
      var sr=slide.getBoundingClientRect();
      if(sr.width<1)return;
      var dx=((ev.clientX-sx)/sr.width)*100;
      setLeftColPct(startW+dx);
      emit();
    }
    function onUp(ev){
      ev.preventDefault();
      window.removeEventListener('pointermove',onMove);
      window.removeEventListener('pointerup',onUp);
      window.removeEventListener('pointercancel',onUp);
      document.body.style.userSelect='';
      clearGuides();emit();
    }
    window.addEventListener('pointermove',onMove,{passive:false});
    window.addEventListener('pointerup',onUp);
    window.addEventListener('pointercancel',onUp);
  }
  nodes().forEach(function(el){
    clearAbs(el);
    if(isPanel(el)){
      el.style.height='100%';
      if(labelOf(el)==='left-panel'&&!el.style.width)el.style.width='58%';
      if(labelOf(el)==='right-panel'){el.style.flex='1 1 0';el.style.minWidth='0';}
    }
    mountChrome(el);
  });
  var lp=leftPanel();
  if(lp&&lp.style.width)setLeftColPct(parseFloat(lp.style.width)||58);
  slide.addEventListener('pointerdown',function(e){
    if(e.target===slide)select(null);
  });
  select(rightPanel()||leftPanel()||null);
  emit();
})();
</script>`;
}
