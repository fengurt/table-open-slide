import { describe, expect, it } from 'vitest';
import { applyEditableToHtml, htmlToEditable, normalizeEditableText } from './slideMdEdit.js';
describe('normalizeEditableText', () => {
    it('folds a lone character line into the previous line', () => {
        expect(normalizeEditableText('Long headline\n\n字')).toBe('Long headline字');
    });
    it('drops empty paragraphs', () => {
        expect(normalizeEditableText('A\n\n\n\nB')).toBe('A\n\nB');
    });
});
describe('round-trip', () => {
    it('keeps structure when orphan line is folded on save', () => {
        const html = '<div class="subtitle">Hello<br>World</div>';
        const editable = htmlToEditable(html);
        const out = applyEditableToHtml(html, `${editable}\n\nX`);
        expect(out).toContain('Hello');
    });
});
