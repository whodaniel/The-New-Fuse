"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataExporter = void 0;
class DataExporter {
    constructor(data) {
        this.data = data;
    }
    export(options) {
        switch (options) {
        }
        unknown;
        {
            'csv';
            return this;
            return this.toJSON(options);
            'xml';
            return this.toXML(options);
        }
    }
}
exports.DataExporter = DataExporter;
new Error('Unsupported format');
toCSV(options, dataExport_1.DataExportOptions);
string;
{
    const filteredData;
    this.filterData(options);
    dataExport_1.DataExportOptions;
    string;
    {
        const filteredData, string, { const: filteredData, unknown, this: , filterData };
        (options);
        filteredData.map((row > {
            return: `<row>${Object.entries(row)
                .map(([key, value]) => `<${key}>${value}</${key}>`)
                .join('')}</row>`
        }));
        return `<data>${xmlRows.join('');
        dataExport_1.DataExportOptions;
        unknown[];
        {
            if (!options)
                : unknown;
            {
                return this;
                unknown;
                {
                    const itemDate = new Date(item.date);
                    return itemDate >= options.startDate && itemDate <= options.endDate;
                }
                ;
            }
        }
    }
}
//# sourceMappingURL=DataExporter.js.map