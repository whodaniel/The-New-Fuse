"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewport = exports.metadata = void 0;
exports.default = RootLayout;
require("./globals.css");
import google_1 from 'next/font/google';
import LifeSaverToken_1 from '../components/ui/LifeSaverToken.js';
const inter = (0, google_1.Inter)({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});
exports.metadata = {
    title: 'LiveSaverz - Create, Customize, and Stack Apps',
    description: 'Create and customize apps, then stack them together to build powerful new applications with built-in revenue sharing and token rewards.',
    keywords: ['app creator', 'app stacker', 'revenue sharing', 'app development', 'customization', 'tokens'],
    authors: [{ name: 'LiveSaverz Team' }],
};
exports.viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#4444FF',
};
function RootLayout({ children, }) {
    const handleTokenTransfer = (index) => {
        
    };
    return (<html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen bg-gray-50`}>
        <main className="min-h-screen pb-16"> 
          {children}
        </main>
        <LifeSaverToken_1.LifeSaverTokenContainer tokens={5} onTransfer={handleTokenTransfer}/>
      </body>
    </html>);
}
export {};
//# sourceMappingURL=layout.js.map