// src/server.ts
import { FastMCP, UserError } from 'fastmcp';
import { z } from 'zod';
import { google, docs_v1 } from 'googleapis';
import { authorize } from './auth.js';
import { OAuth2Client } from 'google-auth-library';

// --- Helper function for hex color validation (basic) ---
const hexColorRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const validateHexColor = (color: string) => hexColorRegex.test(color);

// --- Helper function for Hex to RGB conversion ---
/**
 * Converts a hex color string to a Google Docs API RgbColor object.
 * @param hex - The hex color string (e.g., "#FF0000", "#F00", "FF0000").
 * @returns A Google Docs API RgbColor object or null if invalid.
 */
function hexToRgbColor(hex: string): docs_v1.Schema$RgbColor | null {
  if (!hex) return null;
  let hexClean = hex.startsWith('#') ? hex.slice(1) : hex;

  // Expand shorthand form (e.g. "F00") to full form (e.g. "FF0000")
  if (hexClean.length === 3) {
    hexClean = hexClean[0] + hexClean[0] + hexClean[1] + hexClean[1] + hexClean[2] + hexClean[2];
  }

  if (hexClean.length !== 6) {
    return null; // Invalid length
  }

  const bigint = parseInt(hexClean, 16);
  if (isNaN(bigint)) {
      return null; // Invalid hex characters
  }

  // Extract RGB values and normalize to 0.0 - 1.0 range
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  return { red: r, green: g, blue: b };
}

// --- Zod Schema for the formatText tool ---
// const FormatTextParameters = z.object({
//   documentId: z.string().describe('The ID of the Google Document.'),
//   startIndex: z.number().int().min(1).describe('The starting index of the text range (inclusive, starts from 1).'),
//   endIndex: z.number().int().min(1).describe('The ending index of the text range (inclusive).'),
//   // Optional Formatting Parameters (SHARED)
//   bold: z.boolean().optional().describe('Apply bold formatting.'),
//   italic: z.boolean().optional().describe('Apply italic formatting.'),
//   underline: z.boolean().optional().describe('Apply underline formatting.'),
//   strikethrough: z.boolean().optional().describe('Apply strikethrough formatting.'),
//   fontSize: z.number().min(1).optional().describe('Set font size (in points, e.g., 12).'),
//   fontFamily: z.string().optional().describe('Set font family (e.g., "Arial", "Times New Roman").'),
//   foregroundColor: z.string()
//     .refine(validateHexColor, { message: "Invalid hex color format (e.g., #FF0000 or #F00)" })
//     .optional()
//     .describe('Set text color using hex format (e.g., "#FF0000").'),
//   backgroundColor: z.string()
//     .refine(validateHexColor, { message: "Invalid hex color format (e.g., #00FF00 or #0F0)" })
//     .optional()
//     .describe('Set text background color using hex format (e.g., "#FFFF00").'),
//   linkUrl: z.string().url().optional().describe('Make the text a hyperlink pointing to this URL.')
// })
// .refine(data => data.endIndex >= data.startIndex, {
//   message: "endIndex must be greater than or equal to startIndex",
//   path: ["endIndex"],
// })
// .refine(data => Object.keys(data).some(key => !['documentId', 'startIndex', 'endIndex'].includes(key) && data[key as keyof typeof data] !== undefined), {
//     message: "At least one formatting option (bold, italic, fontSize, etc.) must be provided."
// });

// --- Define the TypeScript type based on the schema ---
// type FormatTextArgs = z.infer<typeof FormatTextParameters>;

// --- Zod Schema for the NEW formatMatchingText tool ---
const FormatMatchingTextParameters = z.object({
  documentId: z.string().describe('The ID of the Google Document.'),
  textToFind: z.string().min(1).describe('The exact text string to find and format.'),
  matchInstance: z.number().int().min(1).optional().default(1).describe('Which instance of the text to format (1st, 2nd, etc.). Defaults to 1.'),
  // Re-use optional Formatting Parameters (SHARED)
  bold: z.boolean().optional().describe('Apply bold formatting.'),
  italic: z.boolean().optional().describe('Apply italic formatting.'),
  underline: z.boolean().optional().describe('Apply underline formatting.'),
  strikethrough: z.boolean().optional().describe('Apply strikethrough formatting.'),
  fontSize: z.number().min(1).optional().describe('Set font size (in points, e.g., 12).'),
  fontFamily: z.string().optional().describe('Set font family (e.g., "Arial", "Times New Roman").'),
  foregroundColor: z.string()
    .refine(validateHexColor, { message: "Invalid hex color format (e.g., #FF0000 or #F00)" })
    .optional()
    .describe('Set text color using hex format (e.g., "#FF0000").'),
  backgroundColor: z.string()
    .refine(validateHexColor, { message: "Invalid hex color format (e.g., #00FF00 or #0F0)" })
    .optional()
    .describe('Set text background color using hex format (e.g., "#FFFF00").'),
  linkUrl: z.string().url().optional().describe('Make the text a hyperlink pointing to this URL.')
})
.refine(data => Object.keys(data).some(key => !['documentId', 'textToFind', 'matchInstance'].includes(key) && data[key as keyof typeof data] !== undefined), {
    message: "At least one formatting option (bold, italic, fontSize, etc.) must be provided."
});

// --- Define the TypeScript type based on the new schema ---
type FormatMatchingTextArgs = z.infer<typeof FormatMatchingTextParameters>;

// --- Helper function to build TextStyle and fields mask (reusable) ---
function buildTextStyleAndFields(args: Omit<FormatMatchingTextArgs, 'documentId' | 'textToFind' | 'matchInstance'>): { textStyle: docs_v1.Schema$TextStyle, fields: string[] } {
    const textStyle: docs_v1.Schema$TextStyle = {};
    const fieldsToUpdate: string[] = [];

    if (args.bold !== undefined) { textStyle.bold = args.bold; fieldsToUpdate.push('bold'); }
    if (args.italic !== undefined) { textStyle.italic = args.italic; fieldsToUpdate.push('italic'); }
    if (args.underline !== undefined) { textStyle.underline = args.underline; fieldsToUpdate.push('underline'); }
    if (args.strikethrough !== undefined) { textStyle.strikethrough = args.strikethrough; fieldsToUpdate.push('strikethrough'); }
    if (args.fontSize !== undefined) {
        textStyle.fontSize = { magnitude: args.fontSize, unit: 'PT' };
        fieldsToUpdate.push('fontSize');
    }
    if (args.fontFamily !== undefined) {
        textStyle.weightedFontFamily = { fontFamily: args.fontFamily };
        fieldsToUpdate.push('weightedFontFamily');
    }
    if (args.foregroundColor !== undefined) {
        const rgbColor = hexToRgbColor(args.foregroundColor);
        if (!rgbColor) throw new UserError(`Invalid foreground hex color format: ${args.foregroundColor}`);
        textStyle.foregroundColor = { color: { rgbColor: rgbColor } };
        fieldsToUpdate.push('foregroundColor');
    }
    if (args.backgroundColor !== undefined) {
        const rgbColor = hexToRgbColor(args.backgroundColor);
        if (!rgbColor) throw new UserError(`Invalid background hex color format: ${args.backgroundColor}`);
        textStyle.backgroundColor = { color: { rgbColor: rgbColor } };
        fieldsToUpdate.push('backgroundColor');
    }
    if (args.linkUrl !== undefined) {
        textStyle.link = { url: args.linkUrl };
        fieldsToUpdate.push('link');
    }

    if (fieldsToUpdate.length === 0) {
        // This should ideally be caught by Zod refine, but defensive check
        throw new UserError("No formatting options were specified.");
    }

    return { textStyle, fields: fieldsToUpdate };
}

let authClient: OAuth2Client | null = null;
let googleDocs: docs_v1.Docs | null = null;

async function initializeGoogleClient() {
  if (googleDocs) return { authClient, googleDocs };
  if (authClient === null && googleDocs === null) {
    try {
      console.error("Attempting to authorize Google API client...");
      const client = await authorize();
      if (client) {
        authClient = client;
        googleDocs = google.docs({ version: 'v1', auth: authClient });
        console.error("Google API client authorized successfully.");
      } else {
        console.error("FATAL: Authorization returned null or undefined client.");
        authClient = null;
        googleDocs = null;
      }
    } catch (error) {
      console.error("FATAL: Failed to initialize Google API client:", error);
      authClient = null;
      googleDocs = null;
    }
  }
  return { authClient, googleDocs };
}

const server = new FastMCP({
  name: 'Google Docs MCP Server',
  version: '1.0.0',
});

// Tool: Read Google Doc
server.addTool({
  name: 'readGoogleDoc',
  description: 'Reads the content of a specific Google Document.',
  parameters: z.object({
    documentId: z.string().describe('The ID of the Google Document (from the URL).'),
  }),
  execute: async (args, { log }) => {
    const { googleDocs: docs } = await initializeGoogleClient();
    if (!docs) throw new UserError("Google Docs client not initialized.");

    log.info(`Reading Google Doc: ${args.documentId}`);
    try {
      const res = await docs.documents.get({
        documentId: args.documentId,
        fields: 'body(content)',
      });
      log.info(`Fetched doc: ${args.documentId}`);

      let textContent = '';
      res.data.body?.content?.forEach(element => {
        element.paragraph?.elements?.forEach(pe => {
          textContent += pe.textRun?.content || '';
        });
      });

      if (!textContent.trim()) return "Document found, but appears empty.";

      const maxLength = 2000;
      const truncatedContent = textContent.length > maxLength ? textContent.substring(0, maxLength) + '... [truncated]' : textContent;
      return `Content:\n---\n${truncatedContent}`;
    } catch (error: any) {
      log.error(`Error reading doc ${args.documentId}: ${error.message}`);
       if (error.code === 404) throw new UserError(`Doc not found (ID: ${args.documentId}).`);
       if (error.code === 403) throw new UserError(`Permission denied for doc (ID: ${args.documentId}).`);
       throw new UserError(`Failed to read doc: ${error.message}`);
    }
  },
});

// Tool: Append to Google Doc
server.addTool({
  name: 'appendToGoogleDoc',
  description: 'Appends text to the end of a specific Google Document.',
  parameters: z.object({
    documentId: z.string().describe('The ID of the Google Document.'),
    textToAppend: z.string().describe('The text to add.'),
  }),
  execute: async (args, { log }) => {
    const { googleDocs: docs } = await initializeGoogleClient();
     if (!docs) throw new UserError("Google Docs client not initialized.");

    log.info(`Appending to Google Doc: ${args.documentId}`);
    try {
      const docInfo = await docs.documents.get({ documentId: args.documentId, fields: 'body(content)' });
      let endIndex = 1;
      if (docInfo.data.body?.content) {
        const lastElement = docInfo.data.body.content[docInfo.data.body.content.length - 1];
        if (lastElement?.endIndex) endIndex = lastElement.endIndex - 1;
      }
      const textToInsert = (endIndex > 1 && !args.textToAppend.startsWith('\n') ? '\n' : '') + args.textToAppend;

      await docs.documents.batchUpdate({
        documentId: args.documentId,
        requestBody: { requests: [{ insertText: { location: { index: endIndex }, text: textToInsert } }] },
      });

      log.info(`Successfully appended to doc: ${args.documentId}`);
      return `Successfully appended text to document ${args.documentId}.`;
    } catch (error: any) {
      log.error(`Error editing doc ${args.documentId}: ${error.message}`);
      if (error.code === 404) throw new UserError(`Doc not found (ID: ${args.documentId}).`);
      if (error.code === 403) throw new UserError(`Permission denied for doc (ID: ${args.documentId}).`);
      throw new UserError(`Failed to edit doc: ${error.message}`);
    }
  },
});

// --- Add the formatMatchingText tool ---
server.addTool({
    name: 'formatMatchingText',
    description: 'Finds specific text within a Google Document and applies character formatting (bold, italics, color, etc.) to the specified instance.',
    parameters: FormatMatchingTextParameters, // Use the new Zod schema
    execute: async (args: FormatMatchingTextArgs, { log }) => {
        const { googleDocs: docs } = await initializeGoogleClient();
        if (!docs) {
          throw new UserError("Google Docs client is not initialized. Authentication might have failed.");
        }

        log.info(`Attempting to find text "${args.textToFind}" (instance ${args.matchInstance}) in doc: ${args.documentId} and format it.`);

        // 1. Get the document content to find the text range
        let docContent: docs_v1.Schema$Document;
        try {
            const res = await docs.documents.get({
                documentId: args.documentId,
                // Request fields needed to reconstruct text and find indices
                fields: 'body(content(paragraph(elements(startIndex,endIndex,textRun(content)))))',
            });
            docContent = res.data;
            if (!docContent.body?.content) {
                throw new UserError(`Document body or content is empty or inaccessible (ID: ${args.documentId}).`);
            }
            log.info(`Fetched doc content for searching: ${args.documentId}`);
        } catch (error: any) {
            log.error(`Error retrieving doc ${args.documentId} for search: ${error.message}`);
            if (error.code === 404) throw new UserError(`Doc not found (ID: ${args.documentId}).`);
            if (error.code === 403) throw new UserError(`Permission denied for doc (ID: ${args.documentId}).`);
            throw new UserError(`Failed to retrieve doc for searching: ${error.message}`);
        }

        // 2. Find the Nth instance of the text and its range
        let fullText = '';
        const textSegments: { text: string, start: number, end: number }[] = [];
        docContent.body.content.forEach(element => {
            element.paragraph?.elements?.forEach(pe => {
                if (pe.textRun?.content && pe.startIndex && pe.endIndex) {
                    // Handle potential line breaks within content
                    const content = pe.textRun.content;
                    fullText += content;
                    textSegments.push({
                        text: content,
                        start: pe.startIndex,
                        end: pe.endIndex
                    });
                }
            });
        });

        let startIndex = -1;
        let endIndex = -1;
        let foundCount = 0;
        let searchStartIndex = 0;

        while (foundCount < args.matchInstance) {
            const currentIndex = fullText.indexOf(args.textToFind, searchStartIndex);
            if (currentIndex === -1) {
                // Text not found anymore
                break;
            }
            foundCount++;
            if (foundCount === args.matchInstance) {
                // Found the start of the Nth match in the *reconstructed* string.
                // Map this back to the API's startIndex/endIndex.
                const targetStartInFullText = currentIndex;
                const targetEndInFullText = currentIndex + args.textToFind.length;
                let currentPosInFullText = 0;

                for (const seg of textSegments) {
                    const segStartInFullText = currentPosInFullText;
                    // Length of segment text might differ from index range if it contains newlines etc.
                    const segTextLength = seg.text.length;
                    const segEndInFullText = segStartInFullText + segTextLength;

                     // Check if the target *starts* within this segment's text span
                    if (startIndex === -1 && targetStartInFullText >= segStartInFullText && targetStartInFullText < segEndInFullText) {
                        // Calculate the API start index relative to the segment's start index
                        startIndex = seg.start + (targetStartInFullText - segStartInFullText);
                    }

                    // Check if the target *ends* within this segment's text span
                     if (targetEndInFullText > segStartInFullText && targetEndInFullText <= segEndInFullText) {
                        // Calculate the API end index relative to the segment's start index
                        endIndex = seg.start + (targetEndInFullText - segStartInFullText);
                        break; // Found the end, we have the full range
                    }

                    currentPosInFullText = segEndInFullText;
                }

                if (startIndex === -1 || endIndex === -1) {
                     log.warn(`Could not accurately map indices for match ${foundCount} of "${args.textToFind}". Start found at ${targetStartInFullText}, End at ${targetEndInFullText}. Resetting.`);
                     // Reset if we couldn't map indices correctly for this match
                     startIndex = -1;
                     endIndex = -1;
                     // Don't break the outer loop, let it try searching again
                }
            }
            // Continue searching after the start of the current match to find subsequent occurrences
            searchStartIndex = currentIndex + 1;
        }


        if (startIndex === -1 || endIndex === -1) {
          throw new UserError(`Could not find instance ${args.matchInstance} of the text "${args.textToFind}" in document ${args.documentId}. Found ${foundCount} total instance(s).`);
        }

        log.info(`Found text "${args.textToFind}" (instance ${args.matchInstance}) at mapped range: ${startIndex}-${endIndex}`);

        // 3. Build the TextStyle object and fields mask
        const { textStyle, fields } = buildTextStyleAndFields(args);


        // 4. Build the UpdateTextStyleRequest
        const updateTextStyleRequest: docs_v1.Schema$UpdateTextStyleRequest = {
            range: {
                // API uses segmentId, but omitting it defaults to the document BODY
                startIndex: startIndex, // Use the calculated start index
                endIndex: endIndex,     // Use the calculated end index
            },
            textStyle: textStyle,
            fields: fields.join(','), // Crucial: Tells API which fields to update
        };

        // 5. Send the batchUpdate request
        try {
            await docs.documents.batchUpdate({
                documentId: args.documentId,
                requestBody: {
                    requests: [{ updateTextStyle: updateTextStyleRequest }],
                },
            });
            log.info(`Successfully formatted text in doc: ${args.documentId}, range: ${startIndex}-${endIndex}`);
            return `Successfully applied formatting to instance ${args.matchInstance} of "${args.textToFind}".`;
        } catch (error: any) {
            log.error(`Error formatting text in doc ${args.documentId}: ${error.message}`);
            // Consider more specific error handling based on API response if needed
            throw new UserError(`Failed to apply formatting: ${error.message}`);
        }
    },
});

// Tool: Format Text (existing, keep for index-based formatting if needed)
// server.addTool({
//   name: 'formatText',
//   description: 'Applies character formatting (bold, italics, font size, color, link, etc.) to a specific text range in a Google Document using start/end indices.',
//   parameters: FormatTextParameters, // Use the original Zod schema
//   execute: async (args: FormatTextArgs, { log }) => {
//     const { googleDocs: docs } = await initializeGoogleClient();
//     if (!docs) {
//       throw new UserError("Google Docs client is not initialized. Authentication might have failed.");
//     }
//
//     log.info(`Attempting to format text in doc: ${args.documentId}, range: ${args.startIndex}-${args.endIndex}`);
//
//     // 1. Build the TextStyle object and fields mask
//     const { textStyle, fields } = buildTextStyleAndFields(args);
//
//     // 2. Build the UpdateTextStyleRequest
//     const updateTextStyleRequest: docs_v1.Schema$UpdateTextStyleRequest = {
//       range: {
//         startIndex: args.startIndex,
//         endIndex: args.endIndex,
//       },
//       textStyle: textStyle,
//       fields: fields.join(','),
//     };
//
//     // 3. Send the batchUpdate request
//     try {
//       await docs.documents.batchUpdate({
//         documentId: args.documentId,
//         requestBody: {
//           requests: [{ updateTextStyle: updateTextStyleRequest }],
//         },
//       });
//       log.info(`Successfully formatted text in doc: ${args.documentId}, range: ${args.startIndex}-${args.endIndex}`);
//       return `Successfully applied formatting to range ${args.startIndex}-${args.endIndex}.`;
//     } catch (error: any) {
//       log.error(`Error formatting text in doc ${args.documentId}: ${error.message}`);
//        if (error.code === 404) throw new UserError(`Doc not found (ID: ${args.documentId}).`);
//        if (error.code === 403) throw new UserError(`Permission denied for doc (ID: ${args.documentId}).`);
//       throw new UserError(`Failed to format text: ${error.message}`);
//     }
//   },
// });

// Start the Server (Modified to avoid server.config issue)
async function startServer() {
  await initializeGoogleClient(); // Authorize before starting listeners
  console.error("Starting MCP server...");
  try {
      const configToUse = {
        // Choose one transport:
         transportType: "stdio" as const,
        //  transportType: "sse" as const,
        //  sse: {                       // <-- COMMENT OUT or DELETE SSE config
        //    endpoint: "/sse" as const,
        //    port: 8080,
        //  },
      };

      server.start(configToUse); // Start the server with stdio config

      // Adjust logging (optional, but good practice)
      console.error(`MCP Server running using ${configToUse.transportType}.`);
      if (configToUse.transportType === 'stdio') {
          console.error("Awaiting MCP client connection via stdio...");
      }
      // Removed SSE-specific logging

  } catch(startError) {
      console.error("Error occurred during server.start():", startError);
      throw startError; // Re-throw to be caught by the outer catch
  }
}

// Call the modified startServer function
startServer().catch(err => {
    console.error("Server failed to start:", err);
    process.exit(1);
});