// Shared browser helpers used by the result renderer and modal viewers.
window.AppUtils = {
    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    highlightSnippet(code) {
        return String(code)
            .split('\n')
            .map(line => {
                const escapedLine = window.AppUtils.escapeHtml(line);
                if (line.trim().startsWith('#')) {
                    return `<span class="code-comment">${escapedLine}</span>`;
                }
                return escapedLine;
            })
            .join('\n');
    },

    parseCsv(csvText) {
        // Small CSV parser for preview tables; handles quoted commas/newlines.
        const rows = [];
        let row = [];
        let value = '';
        let insideQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"' && insideQuotes && nextChar === '"') {
                value += '"';
                i++;
            } else if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                row.push(value);
                value = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n') i++;
                row.push(value);
                if (row.some(cell => cell !== '')) rows.push(row);
                row = [];
                value = '';
            } else {
                value += char;
            }
        }

        if (value || row.length) {
            row.push(value);
            if (row.some(cell => cell !== '')) rows.push(row);
        }

        return rows;
    },

    formatLanguageName(language) {
        if (!language) return 'Unknown';
        return language.charAt(0).toUpperCase() + language.slice(1);
    }
};
