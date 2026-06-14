import{j as e,r as t}from"./react-vendor.ZgPL6Mwk.js";import{a as Y}from"./ports.ybe81G9A.js";import{R as Q,L as V,C as W,X as q,Y as G,T as K,b as J,a as Z}from"./recharts.Wlj53pb4.js";import{aK as $,cb as ee,cc as se,v as _,aX as re,R as O,b4 as ae,aD as te,aP as ne,a5 as le,ar as I,S as ie,c8 as oe,x as ce,y as de,X as me,Q as w,g as he,e as ue,A as xe,a as ge}from"./app._DRpJcDc.js";import{w as N}from"./websocket.Dmuo61Du.js";import{ae as pe}from"./d3-vendor.DRqLgs30.js";import{C as be,c as H,d as X,b as F,A as fe,g as je,B as U}from"./design-system.b4l7O0ja.js";import{L as ve}from"./label.jDICRyAr.js";import{S as k}from"./scroll-area.d_AinTmY.js";import{T as ye,a as Ne,b as A,c as E}from"./tabs.BlAb-dlF.js";import"./preload-helper.DD1OZmLC.js";import"./react-query-vendor.DCH_Nud3.js";import"./framer-motion.BZdbmtgE.js";import"./ui-libs.O6ACVZ0H.js";import"./web3-vendor.mI8YWscQ.js";function M({className:s,...i}){return e.jsx("div",{className:$("animate-pulse rounded-md bg-muted",s),...i})}const we=({value:s,defaultValue:i=50,min:n=0,max:h=100,step:c=1,onChange:p,onChangeEnd:g,isDisabled:l=!1,colorScheme:r="primary",size:o="md",className:d})=>{const[x,v]=t.useState(i),b=s!==void 0?s:x,a=D=>{const T=Number(D.target.value);s===void 0&&v(T),p?.(T)},u=()=>{g?.(b)},f={primary:"accent-primary-600",secondary:"accent-secondary-600",success:"accent-success-600",warning:"accent-warning-600",danger:"accent-danger-600"},S={sm:"h-1",md:"h-2",lg:"h-3"},y=(b-n)/(h-n)*100;return e.jsx("div",{className:$("relative w-full",d),children:e.jsx("input",{type:"range",min:n,max:h,step:c,value:b,onChange:a,onMouseUp:u,onTouchEnd:u,disabled:l,className:$("w-full appearance-none bg-transparent cursor-pointer","[&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-neutral-200 dark:[&::-webkit-slider-track]:bg-neutral-700","[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-md","[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-200 dark:[&::-moz-range-track]:bg-neutral-700","[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:shadow-md",f[r],S[o],l&&"opacity-50 cursor-not-allowed"),style:{background:`linear-gradient(to right, var(--color-${r}-600) 0%, var(--color-${r}-600) ${y}%, rgb(229 231 235) ${y}%, rgb(229 231 235) 100%)`}})})},R=({title:s,value:i,unit:n,history:h})=>e.jsxs("div",{className:"h-full",children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:s}),e.jsxs("p",{className:"text-xl text-blue-500",children:[i?.toFixed(2)," ",n]}),e.jsx("div",{className:"h-[100px] mt-2",children:e.jsx(Q,{width:"100%",height:"100%",children:e.jsxs(V,{data:h,children:[e.jsx(W,{strokeDasharray:"3 3"}),e.jsx(q,{dataKey:"timestamp",tickFormatter:c=>new Date(c).toLocaleTimeString()}),e.jsx(G,{}),e.jsx(K,{labelFormatter:c=>new Date(c).toLocaleTimeString()}),e.jsx(J,{type:"monotone",dataKey:"value",stroke:"#1976d2",dot:!1})]})})})]}),P=()=>{const[s,i]=t.useState(null),[n,h]=t.useState(!1),[c,p]=t.useState(null),g=t.useRef(null),[l,r]=t.useState({queue:[],latency:[],memory:[],cpu:[]});return t.useEffect(()=>{const o=()=>{const x=Y().replace(/\/ws$/,"")+"/ws/metrics",v=new WebSocket(x);v.onopen=()=>{h(!0),p(null)},v.onclose=()=>{h(!1),setTimeout(o,5e3)},v.onerror=b=>{p("WebSocket connection error"),console.error("WebSocket error:",b)},v.onmessage=b=>{try{const a=JSON.parse(b.data);i(a);const u=Date.now();r(f=>({queue:[...f.queue.slice(-50),{timestamp:u,value:a.avg_queue_length}],latency:[...f.latency.slice(-50),{timestamp:u,value:a.avg_message_latency_ms}],memory:[...f.memory.slice(-50),{timestamp:u,value:a.avg_memory_usage_mb}],cpu:[...f.cpu.slice(-50),{timestamp:u,value:a.avg_cpu_usage_percent}]}))}catch(a){console.error("Error parsing metrics:",a)}},g.current=v};return o(),()=>{g.current&&g.current.close()}},[]),n?c?e.jsxs("div",{className:"p-4 bg-red-50 border border-red-200 rounded-md mb-2 flex items-center",children:[e.jsx("div",{className:"shrink-0 w-5 h-5 text-red-600 mr-2",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-5 w-5",viewBox:"0 0 20 20",fill:"currentColor",children:e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",clipRule:"evenodd"})})}),e.jsx("p",{className:"text-sm text-red-800",children:c})]}):s?e.jsxs("div",{className:"grow p-3",children:[Object.entries(s.alerts||{}).map(([o,d])=>{const x=d.level==="error"?"red":d.level==="warning"?"yellow":d.level==="success"?"green":"blue";return e.jsxs("div",{className:`p-4 bg-${x}-50 border border-${x}-200 rounded-md mb-2 flex items-center`,children:[e.jsx("div",{className:`shrink-0 w-5 h-5 text-${x}-600 mr-2`,children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-5 w-5",viewBox:"0 0 20 20",fill:"currentColor",children:[d.level==="error"&&e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",clipRule:"evenodd"}),d.level==="warning"&&e.jsx("path",{fillRule:"evenodd",d:"M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.086-1.742 3.086H4.42c-1.532 0-2.492-1.75-1.742-3.086l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",clipRule:"evenodd"}),d.level==="success"&&e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",clipRule:"evenodd"}),(d.level==="info"||d.level==="default")&&e.jsx("path",{fillRule:"evenodd",d:"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",clipRule:"evenodd"})]})}),e.jsxs("p",{className:"text-sm",children:[d.message," (Current value: ",d.value,")"]})]},o)}),e.jsxs("div",{className:"grid grid-cols-3 gap-4",children:[e.jsx("div",{className:"col-span-3",children:e.jsx(R,{title:"Message Queue Length",value:s.avg_queue_length,unit:"messages",history:l.queue})}),e.jsx("div",{className:"col-span-3",children:e.jsx(R,{title:"Message Latency",value:s.avg_message_latency_ms,unit:"ms",history:l.latency})}),e.jsx("div",{className:"col-span-3",children:e.jsx(R,{title:"Memory Usage",value:s.avg_memory_usage_mb,unit:"MB",history:l.memory})}),e.jsx("div",{className:"col-span-3",children:e.jsx(R,{title:"CPU Usage",value:s.avg_cpu_usage_percent,unit:"%",history:l.cpu})})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"System Status"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsx("div",{className:"col-span-2",children:e.jsxs("p",{children:["Uptime: ",(s.uptime_seconds/3600).toFixed(2)," hours"]})}),e.jsx("div",{className:"col-span-2",children:e.jsxs("p",{className:s.total_errors>0?"text-red-500":"text-green-500",children:["Total Errors: ",s.total_errors]})}),e.jsx("div",{className:"col-span-2",children:e.jsxs("p",{className:n?"text-green-500":"text-red-500",children:["Status: ",n?"Connected":"Disconnected"]})})]})]})]}):e.jsx("div",{className:"flex justify-center items-center min-h-[200px]",children:e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"})}):e.jsxs("div",{className:"flex justify-center items-center min-h-[200px]",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"}),e.jsx("p",{className:"ml-2",children:"Connecting to metrics service..."})]})},ke=()=>{const[s,i]=t.useState([]),[n,h]=t.useState(null),[c,p]=t.useState(!0),[g,l]=t.useState(null),[r,o]=t.useState({search:"",severity:"all",category:"all",handled:"all",timeRange:"24h"}),[d,x]=t.useState(!1),[v,b]=t.useState(!0),a=ee.getInstance(),u=t.useCallback(async()=>{try{const m=a.getErrorHistory(),j=await a.getErrorStats();i(m),j.success&&j.data&&h(j.data)}catch(m){console.error("Failed to fetch errors:",m)}finally{p(!1)}},[a]);t.useEffect(()=>{u();const m=a.subscribeToErrors(z=>{i(C=>[z,...C].slice(0,1e3)),u()});let j=null;return v&&(j=setInterval(u,3e4)),()=>{m(),j&&clearInterval(j)}},[u,v]);const f=t.useMemo(()=>s.filter(m=>{if(r.search){const j=r.search.toLowerCase();if(!(m.message.toLowerCase().includes(j)||m.code.toLowerCase().includes(j)))return!1}if(r.handled!=="all"){const j=r.handled==="handled";if(m.handled!==j)return!1}if(r.timeRange!=="all"){const j=Date.now(),C={"1h":3600*1e3,"24h":1440*60*1e3,"7d":10080*60*1e3,"30d":720*60*60*1e3}[r.timeRange];if(j-m.timestamp>C)return!1}return!0}),[s,r]),S=t.useCallback(()=>{window.confirm("Are you sure you want to clear all error history?")&&(a.clearHistory(),i([]),l(null))},[a]),y=t.useCallback(()=>{const m=JSON.stringify(f,null,2),j=new Blob([m],{type:"application/json"}),z=URL.createObjectURL(j),C=document.createElement("a");C.href=z,C.download=`errors-${new Date().toISOString()}.json`,C.click(),URL.revokeObjectURL(z)},[f]),D=t.useCallback(m=>{se.trackError(new Error(m.message),{category:m.context?.category,metadata:m.context})},[]),T=()=>{if(!n?.trend)return null;switch(n.trend){case"up":return e.jsx(I,{className:"text-red-500",size:20});case"down":return e.jsx(oe,{className:"text-green-500",size:20});default:return null}};return e.jsxs("div",{className:"error-monitoring-dashboard",children:[e.jsxs("div",{className:"dashboard-header",children:[e.jsxs("div",{className:"header-content",children:[e.jsxs("h1",{className:"dashboard-title",children:[e.jsx(_,{size:24}),"Error Monitoring Dashboard"]}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("button",{onClick:()=>x(!d),className:"btn-secondary","aria-label":"Toggle filters",children:[e.jsx(re,{size:16}),"Filters"]}),e.jsxs("button",{onClick:u,className:"btn-secondary","aria-label":"Refresh",disabled:c,children:[e.jsx(O,{size:16,className:c?"animate-spin":""}),c?"Refreshing...":"Refresh"]}),e.jsxs("button",{onClick:y,className:"btn-secondary",disabled:f.length===0,"aria-label":"Export errors",children:[e.jsx(ae,{size:16}),"Export"]}),e.jsxs("button",{onClick:S,className:"btn-danger",disabled:s.length===0,"aria-label":"Clear errors",children:[e.jsx(te,{size:16}),"Clear"]})]})]}),n&&e.jsxs("div",{className:"statistics-grid",children:[e.jsx(L,{title:"Total Errors",value:n.total,icon:e.jsx(_,{size:20}),trend:T()}),e.jsx(L,{title:"Handled",value:n.handled,icon:e.jsx(ne,{size:20,className:"text-green-500"})}),e.jsx(L,{title:"Unhandled",value:n.unhandled,icon:e.jsx(le,{size:20,className:"text-red-500"})}),e.jsx(L,{title:"Error Rate",value:n.errorRate?.toFixed(2)||"0",unit:"/min",icon:e.jsx(I,{size:20})})]})]}),d&&e.jsxs("div",{className:"filters-panel",children:[e.jsxs("div",{className:"filter-group",children:[e.jsxs("label",{htmlFor:"search",children:[e.jsx(ie,{size:16}),"Search"]}),e.jsx("input",{id:"search",type:"text",value:r.search,onChange:m=>o({...r,search:m.target.value}),placeholder:"Search errors..."})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"handled",children:"Status"}),e.jsxs("select",{id:"handled",value:r.handled,onChange:m=>o({...r,handled:m.target.value}),children:[e.jsx("option",{value:"all",children:"All"}),e.jsx("option",{value:"handled",children:"Handled"}),e.jsx("option",{value:"unhandled",children:"Unhandled"})]})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"timeRange",children:"Time Range"}),e.jsxs("select",{id:"timeRange",value:r.timeRange,onChange:m=>o({...r,timeRange:m.target.value}),children:[e.jsx("option",{value:"1h",children:"Last Hour"}),e.jsx("option",{value:"24h",children:"Last 24 Hours"}),e.jsx("option",{value:"7d",children:"Last 7 Days"}),e.jsx("option",{value:"30d",children:"Last 30 Days"}),e.jsx("option",{value:"all",children:"All Time"})]})]}),e.jsx("div",{className:"filter-group",children:e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:v,onChange:m=>b(m.target.checked)}),"Auto-refresh"]})})]}),e.jsx("div",{className:"errors-container",children:c?e.jsxs("div",{className:"loading-state",children:[e.jsx(O,{className:"animate-spin",size:32}),e.jsx("p",{children:"Loading errors..."})]}):f.length===0?e.jsxs("div",{className:"empty-state",children:[e.jsx(_,{size:48}),e.jsx("h3",{children:"No errors found"}),e.jsx("p",{children:s.length===0?"No errors have been logged yet.":"No errors match the current filters."})]}):e.jsx("div",{className:"error-list",children:f.map((m,j)=>e.jsx(Ce,{error:m,isSelected:g===m,onSelect:()=>l(g===m?null:m),onReport:()=>D(m)},`${m.timestamp}-${j}`))})}),g&&e.jsx(Se,{error:g,onClose:()=>l(null)})]})},L=({title:s,value:i,unit:n,icon:h,trend:c})=>e.jsxs("div",{className:"stat-card",children:[e.jsxs("div",{className:"stat-header",children:[e.jsx("span",{className:"stat-icon",children:h}),c&&e.jsx("span",{className:"stat-trend",children:c})]}),e.jsxs("div",{className:"stat-content",children:[e.jsxs("div",{className:"stat-value",children:[i,n&&e.jsx("span",{className:"stat-unit",children:n})]}),e.jsx("div",{className:"stat-title",children:s})]})]}),Ce=({error:s,isSelected:i,onSelect:n,onReport:h})=>{const c=p=>new Date(p).toLocaleString();return e.jsxs("div",{className:`error-card ${i?"selected":""}`,children:[e.jsxs("div",{className:"error-card-header",onClick:n,children:[e.jsxs("div",{className:"error-info",children:[e.jsx("span",{className:`error-badge ${s.handled?"handled":"unhandled"}`,children:s.handled?"Handled":"Unhandled"}),e.jsx("span",{className:"error-code",children:s.code}),e.jsx("span",{className:"error-timestamp",children:c(s.timestamp)})]}),i?e.jsx(ce,{size:20}):e.jsx(de,{size:20})]}),e.jsx("div",{className:"error-message",children:s.message}),i&&e.jsxs("div",{className:"error-details",children:[s.stack&&e.jsxs("div",{className:"error-stack",children:[e.jsx("h4",{children:"Stack Trace:"}),e.jsx("pre",{children:s.stack})]}),s.context&&e.jsxs("div",{className:"error-context",children:[e.jsx("h4",{children:"Context:"}),e.jsx("pre",{children:JSON.stringify(s.context,null,2)})]}),e.jsx("div",{className:"error-actions",children:e.jsx("button",{onClick:h,className:"btn-primary",children:"Report to Sentry"})})]})]})},Se=({error:s,onClose:i})=>e.jsx("div",{className:"modal-overlay",onClick:i,children:e.jsxs("div",{className:"modal-content",onClick:n=>n.stopPropagation(),children:[e.jsxs("div",{className:"modal-header",children:[e.jsx("h2",{children:"Error Details"}),e.jsx("button",{onClick:i,className:"modal-close","aria-label":"Close",children:e.jsx(me,{size:24})})]}),e.jsxs("div",{className:"modal-body",children:[e.jsxs("div",{className:"detail-section",children:[e.jsx("h3",{children:"Error Code"}),e.jsx("code",{children:s.code})]}),e.jsxs("div",{className:"detail-section",children:[e.jsx("h3",{children:"Message"}),e.jsx("p",{children:s.message})]}),e.jsxs("div",{className:"detail-section",children:[e.jsx("h3",{children:"Timestamp"}),e.jsx("p",{children:new Date(s.timestamp).toLocaleString()})]}),s.stack&&e.jsxs("div",{className:"detail-section",children:[e.jsx("h3",{children:"Stack Trace"}),e.jsx("pre",{className:"stack-trace",children:s.stack})]}),s.context&&e.jsxs("div",{className:"detail-section",children:[e.jsx("h3",{children:"Context"}),e.jsx("pre",{className:"context-data",children:JSON.stringify(s.context,null,2)})]})]})]})}),ze=`
.error-monitoring-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-unit {
  font-size: 1rem;
  color: #6b7280;
  margin-left: 0.25rem;
}

.stat-title {
  color: #6b7280;
  font-size: 0.875rem;
}

.filters-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.filter-group input[type="text"],
.filter-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.errors-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  min-height: 400px;
}

.error-list {
  padding: 1rem;
}

.error-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
  cursor: pointer;
}

.error-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.error-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.error-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.error-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.error-badge.handled {
  background: #d1fae5;
  color: #065f46;
}

.error-badge.unhandled {
  background: #fee2e2;
  color: #991b1b;
}

.error-code {
  font-family: monospace;
  font-size: 0.875rem;
  color: #6b7280;
}

.error-timestamp {
  font-size: 0.875rem;
  color: #9ca3af;
}

.error-message {
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.error-stack,
.error-context {
  margin-bottom: 1rem;
}

.error-stack pre,
.error-context pre {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.detail-section code {
  background: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.stack-trace,
.context-data {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  font-family: monospace;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
`;if(typeof document<"u"){const s=document.createElement("style");s.textContent=ze,document.head.appendChild(s)}const Te=({agents:s,tasks:i,onNodeClick:n})=>{const h=t.useRef(null);t.useEffect(()=>{if(!h.current)return;h.current.d3Force("charge").strength(-120)},[]);const c=r=>{const o=h.current;if(!o)return;r.preventDefault();const d=r.deltaY,x=o.zoom()*(1+d*.001);o.zoom(x)},p=r=>{if(!h.current||!n)return;const o=h.current,{x:d,y:x}=o.screen2GraphCoords(window.innerWidth/2,window.innerHeight/2);o.centerAt(d,x,1e3),o.zoom(2,2e3),n(r)},g=(r,o)=>{const d=r.name,x=12;o.font=`${x}px Sans-Serif`;const b=[o.measureText(d).width+8,x+8];o.fillStyle="rgba(255, 255, 255, 0.8)",typeof r.x=="number"&&typeof r.y=="number"&&(o.fillRect(r.x-b[0]/2,r.y-b[1]/2,b[0],b[1]),o.textAlign="center",o.textBaseline="middle",o.fillStyle="#000",o.fillText(d,r.x,r.y),r.__bckgDimensions=b)},l=(r,o,d)=>{const x=r.__bckgDimensions;x&&typeof r.x=="number"&&typeof r.y=="number"&&(d.fillStyle=o,d.fillRect(r.x-x[0]/2,r.y-x[1]/2,x[0],x[1]))};return e.jsx("div",{className:"w-full h-[600px]",children:e.jsx(pe,{ref:h,graphData:{nodes:s,links:[]},nodeLabel:"name",nodeCanvasObject:g,nodePointerAreaPaint:l,onNodeClick:p,onWheel:c})})};function Ae({agentId:s}){const[i,n]=t.useState(50),[h,c]=t.useState(50),[p,g]=t.useState(50),[l,r]=t.useState(50),[o,d]=t.useState(50),x=[{name:"Openness",value:i,description:""},{name:"Conscientiousness",value:h,description:""},{name:"Extraversion",value:p,description:""},{name:"Agreeableness",value:l,description:""},{name:"Neuroticism",value:o,description:""}],v=()=>{const a={openness:i,conscientiousness:h,extraversion:p,agreeableness:l,neuroticism:o};N.send("updateAgentPersonality",{agentId:s,personality:a})},b=(a,u)=>{switch(a){case"Openness":n(u);break;case"Conscientiousness":c(u);break;case"Extraversion":g(u);break;case"Agreeableness":r(u);break;case"Neuroticism":d(u);break}};return e.jsxs(be,{className:"w-full max-w-md",children:[e.jsx(H,{children:e.jsx(X,{children:"Customize Agent Personality"})}),e.jsxs(F,{className:"space-y-4",children:[e.jsx("div",{className:"space-y-6",children:x.map(a=>e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx(ve,{children:a.name}),e.jsx("span",{className:"text-sm text-muted-foreground",children:a.value})]}),e.jsx(we,{defaultValue:[a.value],min:0,max:100,step:1,onValueChange:u=>b(a.name,u[0]),className:"w-full"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:a.description})]},a.name))}),e.jsx("button",{onClick:v,className:"w-full",children:"Save Personality"})]})]})}const Ee=[{id:"1",name:"Assistant",type:"general",status:"active"},{id:"2",name:"Code Expert",type:"specialist",status:"active"},{id:"3",name:"Data Analyst",type:"specialist",status:"active"}];function Re(){const[s]=t.useState(Ee),[i,n]=t.useState(null),[h,c]=t.useState(null);return{agents:s,selectedAgent:i,conversationId:h,selectAgent:l=>{n(l)},clearConversation:()=>{c(null)}}}const Le=({onSelect:s,selectedAgent:i})=>{const{agents:n,loading:h,error:c,fetchAgents:p}=Re();t.useEffect(()=>{if(c){const l=setTimeout(()=>{p()},5e3);return()=>clearTimeout(l)}},[c,p]);const g=l=>{switch(l){case"active":return"success";case"inactive":return"secondary";case"error":return"destructive";default:return"default"}};return h?e.jsxs(k.Root,{className:"h-[400px]",children:[e.jsx(k.Viewport,{className:"h-full w-full",children:e.jsx("div",{className:"space-y-2 p-2",children:[...Array(5)].map((l,r)=>e.jsxs(w,{className:"cursor-pointer",children:[e.jsx(H,{className:"p-4",children:e.jsx(M,{className:"h-4 w-24"})}),e.jsxs(F,{className:"p-4 pt-0",children:[e.jsx(M,{className:"h-4 w-full mb-2"}),e.jsx(M,{className:"h-4 w-3/4"})]})]},r))})}),e.jsx(k.Scrollbar,{orientation:"vertical",children:e.jsx(k.Thumb,{})})]}):c?e.jsx(fe,{variant:"destructive",children:e.jsx(je,{children:"Failed to load agents. Retrying..."})}):e.jsxs(k.Root,{className:"h-[400px]",children:[e.jsx(k.Viewport,{className:"h-full w-full",children:e.jsx("div",{className:"space-y-2 p-2",children:n.map(l=>e.jsxs(w,{className:`cursor-pointer transition-colors ${i?.id===l.id?"bg-primary/10":"hover:bg-accent"}`,onClick:()=>s(l),children:[e.jsx(H,{className:"p-4",children:e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(U,{variant:g(l.status),children:l.status||"unknown"}),e.jsx(X,{className:"text-sm font-medium",children:l.name})]})}),e.jsxs(F,{className:"p-4 pt-0",children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:l.description||`${l.type} agent`}),e.jsx("div",{className:"mt-2 flex flex-wrap gap-1",children:l.capabilities?l.capabilities.map(r=>e.jsx(U,{variant:"outline",children:r},r)):e.jsx(U,{variant:"outline",children:l.type})})]})]},l.id))})}),e.jsx(k.Scrollbar,{orientation:"vertical",children:e.jsx(k.Thumb,{})})]})},B=()=>{const[s,i]=t.useState([]),[n,h]=t.useState(null),[c,p]=t.useState([]),[g,l]=t.useState([]),[r,o]=t.useState(!0),[d,x]=t.useState(null);if(t.useEffect(()=>{const a=y=>{i(y)},u=y=>{p(y)},f=y=>{l(y),o(!1)},S=y=>{x(y.message),o(!1)};return N.on("agentsUpdate",a),N.on("tasksUpdate",u),N.on("collaborationMetricsUpdate",f),N.on("error",S),N.send("getAgents",{}),N.send("getTasks",{}),N.send("getCollaborationMetrics",{}),()=>{N.off("agentsUpdate",a),N.off("tasksUpdate",u),N.off("collaborationMetricsUpdate",f),N.off("error",S)}},[]),r)return e.jsx("div",{className:"container mx-auto p-4",children:e.jsxs(w,{className:"w-full max-w-3xl",children:[e.jsx(CardHeader,{children:e.jsx(CardTitle,{children:"Agent Collaboration Dashboard"})}),e.jsx(CardContent,{className:"flex justify-center items-center h-[400px]",children:e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"})})]})});if(d)return e.jsx("div",{className:"container mx-auto p-4",children:e.jsxs(w,{className:"w-full max-w-3xl",children:[e.jsx(CardHeader,{children:e.jsx(CardTitle,{children:"Agent Collaboration Dashboard"})}),e.jsx(CardContent,{className:"flex justify-center items-center h-[400px] text-red-500",children:d})]})});const v=a=>{const u=s.find(f=>f.id===a.id);u&&h(u)},b=a=>{h(a)};return e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"grid gap-4",children:e.jsxs(ye,{defaultValue:"network",className:"w-full",children:[e.jsxs(Ne,{className:"grid w-full grid-cols-4",children:[e.jsx(A,{value:"network",children:"Network View"}),e.jsx(A,{value:"agents",children:"Agent Management"}),e.jsx(A,{value:"tasks",children:"Task Overview"}),e.jsx(A,{value:"collaboration",children:"Collaboration Metrics"})]}),e.jsx(E,{value:"network",className:"mt-4",children:e.jsxs(w,{children:[e.jsx(CardHeader,{children:e.jsx(CardTitle,{children:"Agent Collaboration Network"})}),e.jsx(CardContent,{children:e.jsx(Te,{agents:s,tasks:c,onNodeClick:v})})]})}),e.jsx(E,{value:"agents",className:"mt-4",children:e.jsxs(w,{children:[e.jsx(CardHeader,{children:e.jsx(CardTitle,{children:"Agent Management"})}),e.jsx(CardContent,{children:e.jsxs("div",{className:"grid gap-4",children:[e.jsx(Le,{agents:s,selectedAgent:n,onSelect:b}),n&&e.jsx(Ae,{agentId:n.id})]})})]})}),e.jsx(E,{value:"tasks",className:"mt-4",children:e.jsxs(w,{children:[e.jsx(CardHeader,{children:e.jsx(CardTitle,{children:"Task Overview"})}),e.jsx(CardContent,{children:e.jsx("div",{className:"space-y-4",children:c.map(a=>{const u=s.find(f=>f.id===a.assignedTo);return e.jsx(w,{children:e.jsx(CardContent,{className:"p-4",children:e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium",children:a.title}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Assigned to: ",u?.name]})]}),e.jsx("span",{className:"px-2 py-1 rounded-full text-xs capitalize",style:{backgroundColor:a.status==="completed"?"#4ade80":a.status==="in_progress"?"#fbbf24":"#e5e7eb",color:a.status==="completed"?"#166534":a.status==="in_progress"?"#92400e":"#374151"},children:a.status.replace("_"," ")})]})})},a.id)})})})]})}),e.jsx(E,{value:"collaboration",className:"mt-4",children:e.jsxs(w,{children:[e.jsx(CardHeader,{children:e.jsx(CardTitle,{children:"Collaboration Metrics"})}),e.jsx(CardContent,{children:e.jsxs(V,{width:800,height:400,data:g,children:[e.jsx(W,{strokeDasharray:"3 3"}),e.jsx(q,{dataKey:"timestamp"}),e.jsx(G,{}),e.jsx(K,{}),e.jsx(Z,{}),e.jsx(J,{type:"monotone",dataKey:"value",stroke:"#8884d8",name:"Collaboration Score"})]})})]})})]})})})},Ke=()=>{const[s,i]=t.useState("overview");return e.jsxs("div",{className:"flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900",children:[e.jsxs("div",{className:"flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700",children:[e.jsxs("h1",{className:"text-2xl font-bold flex items-center",children:[e.jsx(he,{className:"w-6 h-6 mr-2 text-blue-500"}),"TNF Command Center"]}),e.jsxs("div",{className:"flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1",children:[e.jsx("button",{className:`px-4 py-2 rounded-md font-medium text-sm transition-colors ${s==="overview"?"bg-white dark:bg-gray-700 shadow":"text-gray-500 hover:text-gray-900"}`,onClick:()=>i("overview"),children:"Overview"}),e.jsxs("button",{className:`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center ${s==="collaboration"?"bg-white dark:bg-gray-700 shadow":"text-gray-500 hover:text-gray-900"}`,onClick:()=>i("collaboration"),children:[e.jsx(ue,{className:"w-4 h-4 mr-2"}),"Collaboration"]}),e.jsxs("button",{className:`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center ${s==="performance"?"bg-white dark:bg-gray-700 shadow":"text-gray-500 hover:text-gray-900"}`,onClick:()=>i("performance"),children:[e.jsx(xe,{className:"w-4 h-4 mr-2"}),"Performance"]}),e.jsxs("button",{className:`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center ${s==="errors"?"bg-white dark:bg-gray-700 shadow":"text-gray-500 hover:text-gray-900"}`,onClick:()=>i("errors"),children:[e.jsx(ge,{className:"w-4 h-4 mr-2"}),"Errors"]})]})]}),e.jsxs("div",{className:"flex-1 overflow-auto p-4",children:[s==="overview"&&e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-2 gap-4",children:[e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px]",children:e.jsx(B,{})}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px]",children:e.jsx(P,{})})]}),s==="collaboration"&&e.jsx(B,{}),s==="performance"&&e.jsx(P,{}),s==="errors"&&e.jsx(ke,{})]})]})};export{Ke as CommandCenterDashboard};
