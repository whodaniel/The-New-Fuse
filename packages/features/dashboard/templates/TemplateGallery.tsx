"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateGallery = void 0;
var react_1 = require("react");
var Button_1 = require("../../../core/components/ui/Button");
var TemplateGallery = function (_a) {
    var templates = _a.templates, onSelect = _a.onSelect, _b = _a.className, className = _b === void 0 ? '' : _b;
    var categories = Array.from(new Set(templates.map(function (template) { return template.category; })));
    return (<div className={"space-y-8 ".concat(className)}>
      {categories.map(function (category) { return (<div key={category}>
          <h2 className="text-lg font-medium text-gray-900 mb-4 capitalize">
            {category} Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
                .filter(function (template) { return template.category === category; })
                .map(function (template) { return (<div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {template.thumbnail && (<div className="aspect-video bg-gray-100">
                      <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover"/>
                    </div>)}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {template.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {template.description}
                        </p>
                      </div>
                      {template.author.avatar && (<img src={template.author.avatar} alt={template.author.name} className="w-8 h-8 rounded-full"/>)}
                    </div>
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map(function (tag) { return (<span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tag}
                          </span>); })}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        By {template.author.name}
                      </div>
                      <Button_1.Button variant="outline" size="sm" onClick={function () { return onSelect(template); }}>
                        Use Template
                      </Button_1.Button>
                    </div>
                  </div>
                </div>); })}
          </div>
        </div>); })}
    </div>);
};
exports.TemplateGallery = TemplateGallery;
export {};
