---
name: multimodal-feature-extraction
description:
  A workflow for reverse-engineering software features by synthesizing static
  web scrapes, video transcripts, and programmatic screenshot captures. Use when
  tasked with analyzing existing or deprecated software (via marketing pages or
  video walkthroughs) to create comprehensive feature specifications or UI
  reference kits.
---

# Multimodal Feature Extraction

This skill provides a structured workflow for reverse-engineering software
features and UI states by patchworking together text, transcripts, and
programmatic video captures.

## Workflow Sequence

Follow these steps to build a complete "Feature Specification and UI Reference
Kit" from fragmented multimodal sources.

### Phase 1: Static Information Gathering

1.  **Identify Sources**: Locate the marketing page (e.g., StackSocial, archived
    site) and any video walkthroughs (e.g., YouTube).
2.  **Scrape Static Data**: Use a high-quality Markdown scraper (like Crawl4AI)
    to extract the text from the marketing page.
    - _Goal_: Extract feature lists, marketing copy, and URLs to static product
      images.
    - _Output_: Initial list of core functionalities.

### Phase 2: Dynamic Context Extraction

1.  **Navigate to Video**: Use the browser MCP to navigate to the video
    walkthrough url.
2.  **Extract Transcript**: Programmatically extract the video's transcript (via
    DOM evaluation or click interactions).
    - _Goal_: Map spoken feature descriptions to exact timestamps (e.g., "05:22:
      Here is how the nested To-Do list works").
3.  **Cross-Reference**: Compare the transcript timestamps against the static
    feature list to identify missing UI states or interactions.

### Phase 3: Programmatic Visual Capture

1.  **Seek and Settle**: For each critical timestamp identified in Phase 2, use
    a browser evaluation script to programmatically seek the video.
    ```javascript
    await page.evaluate('async () => {
      const video = document.querySelector("video");
      const seekTo = (time) => new Promise(resolve => {
        video.currentTime = time;
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          setTimeout(resolve, 1500); // Wait for UI to settle
        };
        video.addEventListener("seeked", onSeeked);
      });
      await seekTo(TARGET_SECONDS);
      return "Seeked to targeted time";
    }');
    ```
2.  **Capture States**: Once the video is paused and the UI is settled, use the
    browser tool to take a high-resolution screenshot of the viewport.
    - _Tip_: Ensure you capture interactive elements like dropdowns, hover
      states, or complex menus that static shots miss.
3.  **Repeat**: Loop through all necessary timestamps to build the "UI Reference
    Kit."

### Phase 4: Synthesis and Specification

1.  **Compile the Spec**: Combine the static features, transcript logic, and
    visual reference URLs into a single, cohesive Markdown specification
    document.
2.  **Highlight Interactions**: Explicitly describe the interaction patterns
    observed in the video (e.g., "Inline editing is used instead of modals").

## Best Practices

- **Always wait for UI settling**: Video streams need a moment to buffer
  high-resolution frames after seeking. Use at least a 1000-1500ms timeout after
  the `seeked` event fires before taking a screenshot.
- **Fallback to Transcript**: If visual OCR is not available, rely heavily on
  the transcript context surrounding a timestamp to describe what the screenshot
  represents in the final spec.
