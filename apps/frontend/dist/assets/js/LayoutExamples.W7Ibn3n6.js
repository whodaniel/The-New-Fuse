import{r as s,j as e}from"./react-vendor.ZgPL6Mwk.js";import{F as h,c as b,d as C,e as F,f as l,g as R,h as $,i as u,j as f,k as v,l as L,m as M}from"./ui-libs.O6ACVZ0H.js";const A=()=>{const[n,y]=s.useState("all"),[r,d]=s.useState(null),[i,c]=s.useState("grid"),[N,o]=s.useState(!1),[w,m]=s.useState(!1),k=[{id:"all",name:"All Layouts",icon:h},{id:"dashboard",name:"Dashboard",icon:C},{id:"forms",name:"Forms",icon:F},{id:"navigation",name:"Navigation",icon:b},{id:"content",name:"Content",icon:l},{id:"data",name:"Data Display",icon:R},{id:"admin",name:"Admin",icon:$}],x=[{id:"dashboard-grid",name:"Dashboard Grid Layout",description:"A responsive grid layout perfect for dashboards with cards and widgets",category:"dashboard",preview:"/previews/dashboard-grid.png",code:`<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-transparent dark:bg-transparent rounded-md p-4 shadow-none">
    <h3 className="text-lg font-semibold mb-4">Widget 1</h3>
    <p className="text-muted-foreground dark:text-gray-300">Content goes here</p>
  </div>
  <div className="bg-transparent dark:bg-transparent rounded-md p-4 shadow-none">
    <h3 className="text-lg font-semibold mb-4">Widget 2</h3>
    <p className="text-muted-foreground dark:text-gray-300">Content goes here</p>
  </div>
  <div className="bg-transparent dark:bg-transparent rounded-md p-4 shadow-none">
    <h3 className="text-lg font-semibold mb-4">Widget 3</h3>
    <p className="text-muted-foreground dark:text-gray-300">Content goes here</p>
  </div>
</div>`,tags:["grid","responsive","cards"],complexity:"beginner",responsive:!0,darkMode:!0},{id:"sidebar-layout",name:"Sidebar Navigation Layout",description:"Classic sidebar navigation with collapsible menu and main content area",category:"navigation",preview:"/previews/sidebar-layout.png",code:`<div className="flex h-screen bg-gray-100 dark:bg-gray-900">
  <div className="w-64 bg-transparent dark:bg-transparent shadow-none">
    <div className="p-4">
      <h2 className="text-xl font-bold">Navigation</h2>
    </div>
    <nav className="mt-4">
      <a href="#" className="block px-4 py-2 text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700">
        Dashboard
      </a>
      <a href="#" className="block px-4 py-2 text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700">
        Settings
      </a>
    </nav>
  </div>
  <div className="flex-1 p-4">
    <h1 className="text-2xl font-bold mb-4">Main Content</h1>
    <p>Your main content goes here</p>
  </div>
</div>`,tags:["sidebar","navigation","responsive"],complexity:"intermediate",responsive:!0,darkMode:!0},{id:"form-layout",name:"Multi-Step Form Layout",description:"A clean form layout with steps indicator and validation states",category:"forms",preview:"/previews/form-layout.png",code:`<div className="max-w-2xl mx-auto bg-transparent dark:bg-transparent rounded-md shadow-none p-4">
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          1
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Personal Info</span>
      </div>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 text-muted-foreground dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
          2
        </div>
        <span className="ml-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">Contact</span>
      </div>
    </div>
  </div>
  <form className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-2">
        Full Name
      </label>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
      />
    </div>
  </form>
</div>`,tags:["form","steps","validation"],complexity:"intermediate",responsive:!0,darkMode:!0},{id:"data-table",name:"Advanced Data Table",description:"Feature-rich data table with sorting, filtering, and pagination",category:"data",preview:"/previews/data-table.png",code:`<div className="bg-transparent dark:bg-transparent rounded-md shadow-none overflow-hidden">
  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Table</h3>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
        />
        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
          Filter
        </button>
      </div>
    </div>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-transparent dark:bg-gray-700">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
            Name
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
            Status
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
        <tr>
          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            John Doe
          </td>
          <td className="px-3 py-2 whitespace-nowrap">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </td>
          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
            <button className="text-blue-600 hover:text-blue-900">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,tags:["table","data","sorting","pagination"],complexity:"advanced",responsive:!0,darkMode:!0},{id:"card-grid",name:"Responsive Card Grid",description:"Flexible card grid that adapts to different screen sizes",category:"content",preview:"/previews/card-grid.png",code:`<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <div className="bg-transparent dark:bg-transparent rounded-md shadow-none overflow-hidden hover:shadow-md transition-shadow">
    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Card Title
      </h3>
      <p className="text-muted-foreground dark:text-gray-300 text-sm mb-4">
        Card description goes here
      </p>
      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Action
      </button>
    </div>
  </div>
</div>`,tags:["cards","grid","responsive"],complexity:"beginner",responsive:!0,darkMode:!0},{id:"admin-panel",name:"Admin Panel Layout",description:"Complete admin panel with header, sidebar, and content sections",category:"admin",preview:"/previews/admin-panel.png",code:`<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
  <header className="bg-transparent dark:bg-transparent shadow-none border-b border-gray-200 dark:border-gray-700">
    <div className="px-3 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
  <div className="flex">
    <aside className="w-64 bg-transparent dark:bg-transparent shadow-none min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-3 py-2 text-foreground dark:text-gray-300 rounded-md hover:bg-muted/30 dark:hover:bg-gray-700">
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="block px-3 py-2 text-foreground dark:text-gray-300 rounded-md hover:bg-muted/30 dark:hover:bg-gray-700">
              Users
            </a>
          </li>
        </ul>
      </nav>
    </aside>
    <main className="flex-1 p-4">
      <div className="bg-transparent dark:bg-transparent rounded-md shadow-none p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Main Content
        </h2>
        <p className="text-muted-foreground dark:text-gray-300">
          Your admin content goes here
        </p>
      </div>
    </main>
  </div>
</div>`,tags:["admin","header","sidebar","layout"],complexity:"advanced",responsive:!0,darkMode:!0}],g=n==="all"?x:x.filter(a=>a.category===n),j=a=>{navigator.clipboard.writeText(a),m(!0),setTimeout(()=>m(!1),2e3)},p=a=>{switch(a){case"beginner":return"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";case"intermediate":return"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";case"advanced":return"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";default:return"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"}};return e.jsx("div",{className:"min-h-screen bg-transparent dark:bg-gray-900",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-3 lg:px-8 py-8",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900 dark:text-white mb-4",children:"Layout Examples"}),e.jsx("p",{className:"text-muted-foreground dark:text-gray-300 mb-6",children:"Explore different layout patterns and components for your applications"}),e.jsx("div",{className:"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",children:e.jsx("div",{className:"flex items-center space-x-4",children:e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("button",{onClick:()=>c("grid"),className:`p-2 rounded-md transition-colors ${i==="grid"?"bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300":"text-muted-foreground hover:text-foreground dark:hover:text-gray-300"}`,title:"Grid view",children:e.jsx(h,{className:"w-5 h-5"})}),e.jsx("button",{onClick:()=>c("list"),className:`p-2 rounded-md transition-colors ${i==="list"?"bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300":"text-muted-foreground hover:text-foreground dark:hover:text-gray-300"}`,title:"List view",children:e.jsx(b,{className:"w-5 h-5"})})]})})})]}),e.jsxs("div",{className:"flex flex-col lg:flex-row gap-4",children:[e.jsx("div",{className:"lg:w-64 flex-shrink-0",children:e.jsxs("div",{className:"bg-transparent dark:bg-transparent rounded-md shadow-none p-4",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white mb-4",children:"Categories"}),e.jsx("nav",{className:"space-y-2",children:k.map(a=>e.jsxs("button",{onClick:()=>y(a.id),className:`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${n===a.id?"bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300":"text-foreground dark:text-gray-300 hover:bg-muted/30 dark:hover:bg-gray-700"}`,children:[e.jsx(a.icon,{className:"w-5 h-5"}),e.jsx("span",{children:a.name})]},a.id))})]})}),e.jsx("div",{className:"flex-1",children:i==="grid"?e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:g.map(a=>e.jsxs("div",{className:"bg-transparent dark:bg-transparent rounded-md shadow-none overflow-hidden hover:shadow-md transition-shadow cursor-pointer",onClick:()=>d(a),children:[e.jsx("div",{className:"h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center",children:e.jsx(l,{className:"w-12 h-12 text-gray-400"})}),e.jsxs("div",{className:"p-4",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:a.name}),e.jsx("span",{className:`px-2 py-1 text-xs font-medium rounded-full ${p(a.complexity)}`,children:a.complexity})]}),e.jsx("p",{className:"text-muted-foreground dark:text-gray-300 text-sm mb-3",children:a.description}),e.jsxs("div",{className:"flex flex-wrap gap-1 mb-3",children:[a.tags.slice(0,3).map(t=>e.jsx("span",{className:"px-2 py-1 bg-gray-100 dark:bg-gray-700 text-foreground dark:text-gray-300 text-xs rounded-full",children:t},t)),a.tags.length>3&&e.jsxs("span",{className:"px-2 py-1 bg-gray-100 dark:bg-gray-700 text-foreground dark:text-gray-300 text-xs rounded-full",children:["+",a.tags.length-3]})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[a.responsive&&e.jsx("span",{className:"text-green-600 dark:text-green-400",title:"Responsive",children:e.jsx(u,{className:"w-4 h-4"})}),a.darkMode&&e.jsx("span",{className:"text-purple-600 dark:text-purple-400",title:"Dark mode support",children:e.jsx(f,{className:"w-4 h-4"})})]}),e.jsxs("button",{onClick:t=>{t.stopPropagation(),d(a),o(!0)},className:"flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm",children:[e.jsx(v,{className:"w-4 h-4"}),e.jsx("span",{children:"View Code"})]})]})]})]},a.id))}):e.jsx("div",{className:"space-y-4",children:g.map(a=>e.jsx("div",{className:"bg-transparent dark:bg-transparent rounded-md shadow-none p-4 hover:shadow-md transition-shadow cursor-pointer",onClick:()=>d(a),children:e.jsxs("div",{className:"flex items-start space-x-4",children:[e.jsx("div",{className:"w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0",children:e.jsx(l,{className:"w-6 h-6 text-gray-400"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:a.name}),e.jsx("span",{className:`px-2 py-1 text-xs font-medium rounded-full ${p(a.complexity)}`,children:a.complexity})]}),e.jsx("p",{className:"text-muted-foreground dark:text-gray-300 mb-3",children:a.description}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("div",{className:"flex flex-wrap gap-1",children:a.tags.map(t=>e.jsx("span",{className:"px-2 py-1 bg-gray-100 dark:bg-gray-700 text-foreground dark:text-gray-300 text-xs rounded-full",children:t},t))}),e.jsxs("div",{className:"flex items-center space-x-4",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[a.responsive&&e.jsx("span",{className:"text-green-600 dark:text-green-400",title:"Responsive",children:e.jsx(u,{className:"w-4 h-4"})}),a.darkMode&&e.jsx("span",{className:"text-purple-600 dark:text-purple-400",title:"Dark mode support",children:e.jsx(f,{className:"w-4 h-4"})})]}),e.jsxs("button",{onClick:t=>{t.stopPropagation(),d(a),o(!0)},className:"flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm",children:[e.jsx(v,{className:"w-4 h-4"}),e.jsx("span",{children:"View Code"})]})]})]})]})]})},a.id))})})]}),r&&N&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",children:e.jsxs("div",{className:"bg-transparent dark:bg-transparent rounded-md shadow-none max-w-4xl w-full max-h-[90vh] overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:r.name}),e.jsx("p",{className:"text-muted-foreground dark:text-gray-300 text-sm",children:r.description})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("button",{onClick:()=>j(r.code),className:"flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors",children:w?e.jsxs(e.Fragment,{children:[e.jsx(L,{className:"w-4 h-4"}),e.jsx("span",{children:"Copied!"})]}):e.jsxs(e.Fragment,{children:[e.jsx(M,{className:"w-4 h-4"}),e.jsx("span",{children:"Copy"})]})}),e.jsx("button",{onClick:()=>o(!1),className:"p-2 text-muted-foreground hover:text-foreground dark:hover:text-gray-300",title:"Close",children:e.jsx("svg",{className:"w-5 h-5",fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",clipRule:"evenodd"})})})]})]}),e.jsx("div",{className:"p-4 overflow-auto max-h-[calc(90vh-120px)]",children:e.jsx("pre",{className:"bg-gray-100 dark:bg-gray-900 rounded-md p-4 overflow-x-auto",children:e.jsx("code",{className:"text-sm text-gray-800 dark:text-gray-200",children:r.code})})})]})})]})})};export{A as default};
