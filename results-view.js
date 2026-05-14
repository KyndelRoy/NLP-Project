window.createResultsView = function createResultsView({ resultsContent, selectedModelText }) {
    const { formatLanguageName } = window.AppUtils;

    function displayLanguageDetectionResult(language, score) {
        const safeLanguage = language || 'unknown';
        const confidence = typeof score === 'number' ? score : 0;
        const confidencePercent = confidence <= 1.0 ? confidence * 100 : confidence;

        resultsContent.innerHTML = `
            <div class="result-item" style="animation: fadeInUp 0.4s ease-out;">
                <div class="result-header">
                    <span style="font-weight: 500; font-size: 0.875rem; color: var(--text-secondary);">Detected Language</span>
                    <span class="topic-badge badge-${safeLanguage.toLowerCase()}">${formatLanguageName(safeLanguage)}</span>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-secondary);">
                        <span>Confidence</span>
                        <span>${confidencePercent.toFixed(1)}%</span>
                    </div>
                    <div class="confidence-bar-container">
                        <div class="confidence-bar" style="width: ${Math.min(confidencePercent, 100)}%"></div>
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1rem;">
                    Analysis completed using Logistic Regression.
                </p>
            </div>
        `;
    }

    function displayResults(labels, scores, language, message) {
        if (language === 'other' || (Array.isArray(language) && language[0] === 'other')) {
            resultsContent.innerHTML = `
                <div class="result-item" style="animation: fadeInUp 0.4s ease-out;">
                    <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
                        <h4 style="color: #ef4444; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">Unsupported Language</h4>
                        <p style="font-size: 0.875rem; color: rgba(239, 68, 68, 0.8);">${message}</p>
                    </div>
                </div>
            `;
            return;
        }

        const labelsList = Array.isArray(labels) ? labels : [labels];
        const scoresList = Array.isArray(scores) ? scores : [scores];
        const topicsHtml = labelsList.map((label, index) => {
            const confPercent = scoresList[index] <= 1.0 ? scoresList[index] * 100 : scoresList[index];
            return `
                <div style="margin-bottom: 1.5rem;">
                    <div class="result-header">
                        <span style="font-weight: 500; font-size: 0.875rem; color: var(--text-secondary);">Predicted Topic ${labelsList.length > 1 ? index + 1 : ''}</span>
                        <span class="topic-badge">${label}</span>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-secondary);">
                            <span>Confidence</span>
                            <span>${confPercent.toFixed(1)}%</span>
                        </div>
                        <div class="confidence-bar-container">
                            <div class="confidence-bar" style="width: ${confPercent}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const langList = Array.isArray(language) ? language : [language];
        const languageHtml = langList
            .filter(Boolean)
            .map(lang => `<span class="topic-badge badge-${lang.toLowerCase()}">${formatLanguageName(lang)}</span>`)
            .join('');

        resultsContent.innerHTML = `
            <div class="result-item" style="animation: fadeInUp 0.4s ease-out;">
                ${topicsHtml}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <span style="font-weight: 500; font-size: 0.875rem; color: var(--text-secondary);">Detected Language</span>
                    <div style="display: flex; gap: 0.5rem;">
                        ${languageHtml || '<span class="topic-badge">Unknown</span>'}
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1rem;">
                    Analysis completed using ${selectedModelText.textContent}.
                </p>
            </div>
        `;
    }

    return {
        displayLanguageDetectionResult,
        displayResults
    };
};
