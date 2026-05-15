window.createResultsView = function createResultsView({ resultsContent, selectedModelText }) {
    const { escapeHtml, formatLanguageName } = window.AppUtils;

    function normalizeScore(score) {
        const confidence = typeof score === 'number' ? score : 0;
        return confidence <= 1.0 ? confidence * 100 : confidence;
    }

    function clampPercent(percent) {
        return Math.min(Math.max(percent, 0), 100);
    }

    function languageClassSuffix(language) {
        return String(language || 'unknown').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }

    function createConfidenceBlock(confidencePercent) {
        const displayValue = confidencePercent.toFixed(1);

        return `
            <div class="confidence-block">
                <div class="metric-row">
                    <span class="metric-label">Confidence</span>
                    <span class="metric-value">${displayValue}%</span>
                </div>
                <div class="confidence-bar-container" aria-label="Confidence ${displayValue}%">
                    <div class="confidence-bar" style="width: ${clampPercent(confidencePercent)}%"></div>
                </div>
            </div>
        `;
    }

    function createLanguageBadges(language) {
        const langList = Array.isArray(language) ? language : [language];
        const languageHtml = langList
            .filter(Boolean)
            .map(lang => {
                const safeLang = languageClassSuffix(lang);
                return `<span class="topic-badge badge-${escapeHtml(safeLang)}">${escapeHtml(formatLanguageName(lang))}</span>`;
            })
            .join('');

        return languageHtml || '<span class="topic-badge">Unknown</span>';
    }

    function displayLanguageDetectionResult(language, score) {
        const safeLanguage = language || 'unknown';
        const languageName = formatLanguageName(safeLanguage);
        const confidencePercent = normalizeScore(score);
        const badgeClassName = languageClassSuffix(safeLanguage);

        resultsContent.innerHTML = `
            <div class="result-item result-card-enter">
                <div class="result-summary">
                    <div>
                        <p class="result-kicker">Detected Language</p>
                        <h3 class="result-title">${escapeHtml(languageName)}</h3>
                    </div>
                    <span class="topic-badge badge-${escapeHtml(badgeClassName)}">${escapeHtml(languageName)}</span>
                </div>

                ${createConfidenceBlock(confidencePercent)}

                <p class="result-footnote">Analysis completed using Logistic Regression.</p>
            </div>
        `;
    }

    function displayResults(labels, scores, language, message) {
        if (language === 'other' || (Array.isArray(language) && language[0] === 'other')) {
            resultsContent.innerHTML = `
                <div class="result-item result-card-enter">
                    <div class="unsupported-card">
                        <h4>Unsupported Language</h4>
                        <p>${escapeHtml(message || 'Language not supported for topic modeling.')}</p>
                    </div>
                </div>
            `;
            return;
        }

        const labelsList = Array.isArray(labels) ? labels : [labels];
        const scoresList = Array.isArray(scores) ? scores : [scores];
        const topicsHtml = labelsList.map((label, index) => {
            const confidencePercent = normalizeScore(scoresList[index]);
            const resultLabel = labelsList.length > 1 ? `Predicted Topic ${index + 1}` : 'Predicted Topic';
            const safeLabel = escapeHtml(label || 'Unknown');

            return `
                <div class="topic-result">
                    <div class="result-header">
                        <div>
                            <p class="result-kicker">${resultLabel}</p>
                            <h3 class="result-title">${safeLabel}</h3>
                        </div>
                        <span class="topic-badge">${safeLabel}</span>
                    </div>
                    ${createConfidenceBlock(confidencePercent)}
                </div>
            `;
        }).join('');

        resultsContent.innerHTML = `
            <div class="result-item result-card-enter">
                <div class="topic-results-list">
                    ${topicsHtml}
                </div>

                <div class="result-meta">
                    <span class="metric-label">Detected Language</span>
                    <div class="language-badges">
                        ${createLanguageBadges(language)}
                    </div>
                </div>

                <p class="result-footnote">Analysis completed using ${escapeHtml(selectedModelText.textContent)}.</p>
            </div>
        `;
    }

    return {
        displayLanguageDetectionResult,
        displayResults
    };
};
