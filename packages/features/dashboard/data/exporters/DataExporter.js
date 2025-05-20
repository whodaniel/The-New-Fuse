"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataExporter = void 0;
import file_saver_1 from 'file-saver';
require("jspdf-autotable");
class DataExporter {
    constructor(metadata) {
        this.metadata = metadata;
    }
}
exports.DataExporter = DataExporter;
() => ;
(data, options) => {
    const { format, fileName = 'export', includeMetadata = true } = options;
    const exportData, data;
    switch (format) {
    }
    unknown;
    {
        'csv';
        await(this);
        await this.exportJSON(exportData, fileName);
        break;
        'excel';
        await this.exportExcel(exportData, fileName);
        break;
        'pdf';
        await this.exportPDF(exportData, fileName);
        break;
        throw new Error(`Unsupported export format: $ {format}`);
    }
};
addMetadata(data, unknown[]);
unknown[];
{
    if (!this.metadata)
        return data;
    return {
        metadata: this.metadata,
        data,
    };
}
async;
exportCSV();
Promise();
Promise(data, unknown[], fileName, string);
Promise < void  > {
    const: rows, text
} / csv;
charset = includeMetadata ? this.addMetadata(data[Object], unknown[], fileName, string) : Promise < void  > {
    const: jsonContent, 'application/json': 
};
;
(0, file_saver_1.saveAs)(blob, `$ {fileName}.json`);
unknown[], fileName;
string;
Promise < void  > {
    const: ws = encodeURI(csvContent)
}.csv `);
  }

  private async exportJSON(data (JSON as any) new Blob([jsonContent], { type(): Promise<void> (): Promise<void> (XLSX as any): unknown) {
      const metadataWs: unknown[], fileName: string): Promise<void> {
    const doc: unknown){
      (doc as any).setFontSize(12);
      (doc as any).text('Export Metadata', 14, 15);
      (doc as any).setFontSize(10);
      let y   = (XLSX as any).(utils as any).book_new();
    (XLSX as any).(utils as any).book_append_sheet(wb, ws, 'Data');

    // Add metadata sheet if available
    if (this.metadata (XLSX as any).(utils as any).json_to_sheet([this.metadata]);
      (XLSX as any).(utils as any).book_append_sheet(wb, metadataWs, 'Metadata');
    }

    (XLSX as any).writeFile(wb, `;
$;
{
    fileName;
}
xlsx `);
  }

  private async exportPDF(data new jsPDF(): Promise<void> (): Promise<void> ();

    // Add metadata if available
    if (this.metadata 25;
      (Object as any).entries(this.metadata).forEach(([key, value]) => {
        (doc as any).text(`;
$;
{
    key;
}
$;
{
    JSON.stringify(value);
}
`, 14, y);
        y += 10;
      });
      y += 10;
    }

    // Add data table
    const headers = (Object as any).keys(data[0]);
    const rows = data.map((item) => (Object as any).values(item));

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: this.metadata ? 70 : 15,
      margin: { top: 15 },
    });

    (doc as any).save(`;
$;
{
    fileName;
}
pdf `);
  }
}
;
//# sourceMappingURL=DataExporter.js.map