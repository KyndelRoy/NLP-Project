window.createResultsView = function createResultsView({ resultsContent, selectedModelText }) {
    const { escapeHtml, formatLanguageName } = window.AppUtils;

    function normalizeScore(score) {
        const confidence = typeof score === 'number' ? score : 0;
        return confidence <= 1.0 ? confidence * 100 : confidence;
    }

    function languageClassSuffix(language) {
        return String(language || 'unknown').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }

    function getConfidenceStatus(confidencePercent) {
        if (confidencePercent >= 75) {
            return {
                className: 'confidence-good',
                label: 'High confidence',
                symbol: '✓'
            };
        }

        if (confidencePercent > 50) {
            return {
                className: 'confidence-caution',
                label: 'Moderate confidence',
                symbol: '!'
            };
        }

        return {
            className: 'confidence-low',
            label: 'Low confidence',
            symbol: '!'
        };
    }

    function createConfidenceBadge(confidencePercent) {
        const displayValue = confidencePercent.toFixed(1);
        const status = getConfidenceStatus(confidencePercent);

        return `
            <div class="confidence-badge ${status.className}" aria-label="${status.label}: ${displayValue}%">
                <span class="confidence-icon" aria-hidden="true">${status.symbol}</span>
                <span class="confidence-percent">${displayValue}%</span>
                <span class="confidence-label">${status.label}</span>
            </div>
        `;
    }

    function getRelevantTopics(labels, scores) {
        const labelsList = Array.isArray(labels) ? labels : [labels];
        const scoresList = Array.isArray(scores) ? scores : [scores];
        const uniqueTopics = [];
        const seen = new Set();

        labelsList.forEach((label, index) => {
            const normalizedLabel = String(label || 'Unknown').trim();
            const key = normalizedLabel.toLowerCase();
            if (seen.has(key)) return;

            seen.add(key);
            uniqueTopics.push({
                label: normalizedLabel,
                confidence: normalizeScore(scoresList[index])
            });
        });

        uniqueTopics.sort((a, b) => b.confidence - a.confidence);
        if (uniqueTopics.length <= 1) return uniqueTopics;

        const selectedTopics = [uniqueTopics[0]];
        const topConfidence = uniqueTopics[0].confidence;

        for (const topic of uniqueTopics.slice(1)) {
            if (selectedTopics.length >= 3) break;

            const gapFromTop = topConfidence - topic.confidence;
            const gapFromPrevious = selectedTopics[selectedTopics.length - 1].confidence - topic.confidence;
            const isCompetitive = gapFromTop <= 18 || (topConfidence < 60 && gapFromPrevious <= 12);

            if (topic.confidence >= 25 && isCompetitive) {
                selectedTopics.push(topic);
            }
        }

        return selectedTopics;
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
        const modelName = 'Logistic Regression';

        resultsContent.innerHTML = `
            <div class="result-item result-card-enter">
                <div class="result-summary">
                    <div>
                        <p class="result-kicker">Detected Language</p>
                        <h3 class="result-title">${escapeHtml(languageName)}</h3>
                    </div>
                    ${createConfidenceBadge(confidencePercent)}
                </div>

                <div class="result-meta">
                    <span class="metric-label">Model used</span>
                    <span class="model-used">${escapeHtml(modelName)}</span>
                </div>
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

        const topics = getRelevantTopics(labels, scores);
        const topicModelName = selectedModelText.textContent;
        const topicsHtml = topics.map((topic, index) => {
            const resultLabel = topics.length > 1 ? `Predicted Topic ${index + 1}` : 'Predicted Topic';
            const safeLabel = escapeHtml(topic.label);

            return `
                <div class="topic-result">
                    <div class="result-header">
                        <div>
                            <p class="result-kicker">${resultLabel}</p>
                            <h3 class="result-title">${safeLabel}</h3>
                        </div>
                        ${createConfidenceBadge(topic.confidence)}
                    </div>
                </div>
            `;
        }).join('');

        resultsContent.innerHTML = `
            <div class="result-item result-card-enter">
                <div class="topic-results-list">
                    ${topicsHtml}
                </div>

                <div class="result-meta">
                    <div>
                        <span class="metric-label">Detected Language</span>
                        <p class="result-source">Model used: Logistic Regression</p>
                    </div>
                    <div class="language-badges">
                        ${createLanguageBadges(language)}
                    </div>
                </div>

                <div class="result-meta compact-meta">
                    <span class="metric-label">Topic Model used</span>
                    <span class="model-used">${escapeHtml(topicModelName)}</span>
                </div>
            </div>
        `;
    }

    return {
        displayLanguageDetectionResult,
        displayResults
    };
};
