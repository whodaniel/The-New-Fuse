import{j as i,R as o}from"./react-vendor.ZgPL6Mwk.js";const r=o.createContext(void 0),c=({value:e,onValueChange:s=()=>{},children:n,className:t=""})=>i.jsx(r.Provider,{value:{value:e,onValueChange:s},children:i.jsx("div",{className:`${t}`,children:n})}),l=({children:e,className:s=""})=>i.jsx("div",{className:`
        inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-muted-foreground
        ${s}
      `,children:e}),b=({value:e,children:s,className:n=""})=>{const t=o.useContext(r);if(!t)throw new Error("TabsTrigger must be used within a Tabs component");const a=t.value===e;return i.jsx("button",{className:`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5
        text-sm font-medium ring-offset-white transition-all focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${a?"bg-transparent text-gray-950 shadow-none":"text-muted-foreground hover:text-gray-900"}
        ${n}
      `,onClick:()=>t.onValueChange(e),children:s})},f=({value:e,children:s,className:n=""})=>{const t=o.useContext(r);if(!t)throw new Error("TabsContent must be used within a Tabs component");return t.value!==e?null:i.jsx("div",{className:`
        mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${n}
      `,children:s})};export{c as T,l as a,b,f as c};
