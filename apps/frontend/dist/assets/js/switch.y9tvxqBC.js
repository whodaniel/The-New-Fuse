import{j as t}from"./react-vendor.ZgPL6Mwk.js";function l({checked:r=!1,onCheckedChange:o,disabled:n=!1,className:s="",id:e}){const a=()=>{n||o?.(!r)};return t.jsx("button",{id:e,type:"button",role:"switch","aria-checked":r,disabled:n,onClick:a,className:`
        relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${r?"bg-blue-600":"bg-gray-200"}
        ${n?"opacity-50 cursor-not-allowed":"cursor-pointer"}
        ${s}
      `,children:t.jsx("span",{className:`
          inline-block h-4 w-4 transform rounded-full bg-transparent transition-transform
          ${r?"translate-x-6":"translate-x-1"}
        `})})}export{l as S};
