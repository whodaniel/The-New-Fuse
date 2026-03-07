"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = void 0;
var react_1 = require("react");
var Footer = function (_a) {
    var _b = _a.showCopyright, showCopyright = _b === void 0 ? true : _b, _c = _a.links, links = _c === void 0 ? [] : _c;
    var currentYear = new Date().getFullYear();
    return (<footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left section */}
          {showCopyright && (<div className="text-sm text-gray-500">
              © {currentYear} The New Fuse. All rights reserved.
            </div>)}

          {/* Right section */}
          {links.length > 0 && (<nav className="flex space-x-4">
              {links.map(function (link) { return (<a key={link.href} href={link.href} className="text-sm text-gray-500 hover:text-gray-900">
                  {link.label}
                </a>); })}
            </nav>)}
        </div>
      </div>
    </footer>);
};
exports.Footer = Footer;
export {};
