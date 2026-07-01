/**
 * Structured MCP / agent responses with artifact paths and next steps.
 */

/**
 * @param {Record<string, unknown>} result
 */
export function extractArtifacts(result) {
  /** @type {Record<string, unknown>} */
  const artifacts = {};
  if (result.docxRel) artifacts.docx = result.docxRel;
  if (result.pdfRel) artifacts.pdf = result.pdfRel;
  if (result.preview?.previewRel) artifacts.previewDir = result.preview.previewRel;
  if (result.preview?.pages) {
    artifacts.previewPages = result.preview.pages.map((p) => p.rel ?? p.name);
  }
  if (result.markdown && typeof result.markdown === 'string') {
    artifacts.markdownChars = result.markdown.length;
  }
  return artifacts;
}

/**
 * @param {Record<string, unknown>} result
 * @param {{ workflow: string, nextSteps?: string[] }} meta
 */
export function wrapAgentResult(result, { workflow, nextSteps = [] }) {
  const ok = result.ok !== false;
  const steps =
    nextSteps.length > 0
      ? nextSteps
      : ok
        ? [
            'Open artifacts.docx in Word for final edits',
            'Review artifacts.previewPages PNGs for CJK/tables',
            'In Word: Update Field if TOC page numbers empty',
          ]
        : ['Fix error and retry', 'Check DOCX_MASTER_AI_API_KEY for format steps'];

  return {
    ...result,
    agent: {
      workflow,
      ok,
      nextSteps: steps,
      artifacts: extractArtifacts(result),
      gui: 'http://localhost:3333/docx',
    },
  };
}
