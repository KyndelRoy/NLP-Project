document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('current-chars');
    const sendBtn = document.getElementById('send-btn');
    const resultsContent = document.getElementById('results-content');
    const modelSelect = document.getElementById('model-select');
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownOptions = document.getElementById('dropdown-options');
    const selectedModelText = document.getElementById('selected-model-text');
    const options = document.querySelectorAll('.option');
    const viewCodeBtn = document.getElementById('view-code-btn');
    const viewDatasetBtn = document.getElementById('view-dataset-btn');
    const codeViewer = document.getElementById('code-viewer');
    const codeViewerTitle = document.getElementById('code-viewer-title');
    const codeViewerContent = document.getElementById('code-viewer-content');
    const datasetViewerContent = document.getElementById('dataset-viewer-content');
    const closeCodeBtn = document.getElementById('close-code-btn');
    const modalDatasetSwitchBtn = document.getElementById('modal-dataset-switch-btn');
    const codeSnippets = window.CODE_SNIPPETS || {};
    const datasetPreviews = window.DATASET_PREVIEWS || {};
    const datasetCache = {};
    const DATASET_PREVIEW_LIMIT = 50;
    let activeViewerMode = 'code';
    let activeDatasetKey = null;

    // Custom Dropdown Logic
    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownOptions.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdownOptions.classList.remove('show');
    });

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-value');
            const text = opt.textContent;

            // Update hidden input and UI
            modelSelect.value = val;
            selectedModelText.textContent = text;

            // Update active state
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            dropdownOptions.classList.remove('show');
            activeDatasetKey = null;
            updateActiveViewer();
        });
    });

    const labelsContainer = document.getElementById('labels-container');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const htmlElement = document.documentElement;
    const MIN_WORDS = 4;
    let isSubmitting = false;

    // Theme Switcher Logic
    let savedTheme = localStorage.getItem('app-theme') || 'dark';
    if (savedTheme !== 'light' && savedTheme !== 'dark') savedTheme = 'dark';
    setTheme(savedTheme);

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });

    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);

        // Update active class
        themeBtns.forEach(btn => {
            if (btn.getAttribute('data-theme') === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    const API_URL = 'http://127.0.0.1:8000';

    // Fetch labels periodically
    async function fetchLabels() {
        if (!labelsContainer) return;
        try {
            const response = await fetch(`${API_URL}/labels`);
            if (response.ok) {
                const data = await response.json();
                const labels = data.labels;
                labelsContainer.innerHTML = '';
                labels.forEach(label => {
                    const span = document.createElement('span');
                    span.className = 'topic-badge';
                    span.textContent = label;
                    labelsContainer.appendChild(span);
                });
            }
        } catch (error) {
            console.error('Error fetching labels:', error);
            if (labelsContainer.children.length === 1 && labelsContainer.children[0].textContent === 'Loading labels...') {
                labelsContainer.innerHTML = '<span style="font-size: 0.875rem; color: #ef4444;">Ensure backend is running</span>';
            }
        }
    }

    // Initial fetch and then poll every 2 seconds
    fetchLabels();
    setInterval(fetchLabels, 2000);

    function getWordCount() {
        const text = textInput.value.trim();
        return text ? text.split(/\s+/).length : 0;
    }

    function updateInputState() {
        const length = textInput.value.trim().length;
        charCount.textContent = length.toLocaleString();

        sendBtn.disabled = isSubmitting || getWordCount() < MIN_WORDS;

        charCount.style.transform = 'scale(1.1)';
        setTimeout(() => {
            charCount.style.transform = 'scale(1)';
        }, 100);
    }

    async function submitAnalysis() {
        if (isSubmitting) return;

        const text = textInput.value.trim();
        const model = modelSelect.value;

        if (getWordCount() < MIN_WORDS) {
            alert('Please enter at least 4 words to classify.');
            textInput.focus();
            return;
        }

        // UI Loading State
        isSubmitting = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = "0.5";
        resultsContent.innerHTML = `
            <div class="loading-state" style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">
                <p class="loading-dots">Analyzing with ${model}</p>
            </div>
        `;

        // Actual API call
        try {
            const response = await fetch(`${API_URL}/classify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model: model
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.type === 'language_detection') {
                displayLanguageDetectionResult(data.language, data.score);
                return;
            }

            displayResults(data.labels || data.label, data.scores || data.score, data.language, data.message);
        } catch (error) {
            console.error(error);
            resultsContent.innerHTML = `<p style="color: #ef4444;">${error.message || `Error analyzing text. Is the backend running at ${API_URL}?`}</p>`;
        } finally {
            isSubmitting = false;
            updateInputState();
            sendBtn.style.opacity = "1";
        }
    }

    // Update character count and button state
    textInput.addEventListener('input', updateInputState);

    textInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return;

        event.preventDefault();
        submitAnalysis();
    });

    // Handle Send button click
    sendBtn.addEventListener('click', submitAnalysis);

    viewCodeBtn.addEventListener('click', () => {
        if (codeViewer.hidden || activeViewerMode !== 'code') {
            openViewer('code');
        } else {
            closeViewer();
        }
    });

    viewDatasetBtn.addEventListener('click', () => {
        if (codeViewer.hidden || activeViewerMode !== 'dataset') {
            openViewer('dataset');
        } else {
            closeViewer();
        }
    });

    closeCodeBtn.addEventListener('click', closeViewer);

    modalDatasetSwitchBtn.addEventListener('click', () => {
        updateDatasetViewer(modalDatasetSwitchBtn.getAttribute('data-dataset-key'));
    });

    codeViewer.addEventListener('click', (event) => {
        if (event.target.hasAttribute('data-close-code')) {
            closeViewer();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !codeViewer.hidden) {
            closeViewer();
        }
    });

    updateInputState();
    updateActiveViewer();

    async function updateActiveViewer() {
        if (activeViewerMode === 'dataset') {
            await updateDatasetViewer();
            return;
        }

        updateCodeViewer();
    }

    function updateCodeViewer() {
        const selectedSnippet = codeSnippets[modelSelect.value] || codeSnippets.bart;
        if (!selectedSnippet) return;

        codeViewerContent.parentElement.hidden = false;
        datasetViewerContent.hidden = true;
        modalDatasetSwitchBtn.hidden = true;
        codeViewerTitle.textContent = selectedSnippet.title;
        codeViewerContent.innerHTML = highlightSnippet(selectedSnippet.code);
    }

    async function updateDatasetViewer(datasetKey = activeDatasetKey || modelSelect.value) {
        activeDatasetKey = datasetKey;
        const selectedDataset = datasetPreviews[datasetKey] || datasetPreviews.bart;
        if (!selectedDataset) return;

        codeViewerContent.parentElement.hidden = true;
        datasetViewerContent.hidden = false;
        updateHeaderDatasetSwitch(selectedDataset);
        codeViewerTitle.textContent = selectedDataset.title;
        datasetViewerContent.innerHTML = '<div class="dataset-loading">Loading dataset preview...</div>';

        if (!selectedDataset.source || !selectedDataset.source.endsWith('.csv')) {
            datasetViewerContent.innerHTML = renderDatasetInfo(selectedDataset);
            return;
        }

        try {
            const parsedDataset = await loadDatasetPreview(datasetKey, selectedDataset);
            datasetViewerContent.innerHTML = renderDatasetPreview(parsedDataset, selectedDataset);
        } catch (error) {
            console.error(error);
            datasetViewerContent.innerHTML = `
                <div class="dataset-empty-state">
                    <p class="dataset-meta"><strong>Source:</strong> ${escapeHtml(selectedDataset.source)}</p>
                    <p>Unable to load this CSV. Serve the app through a local web server instead of opening it directly as a file.</p>
                </div>
            `;
        }
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function highlightSnippet(code) {
        return code
            .split('\n')
            .map(line => {
                const escapedLine = escapeHtml(line);
                if (line.trim().startsWith('#')) {
                    return `<span class="code-comment">${escapedLine}</span>`;
                }
                return escapedLine;
            })
            .join('\n');
    }

    function updateHeaderDatasetSwitch(dataset) {
        if (dataset.alternateDatasetKey && (activeDatasetKey === 'language' || activeDatasetKey === 'original')) {
            modalDatasetSwitchBtn.hidden = false;
            modalDatasetSwitchBtn.textContent = dataset.alternateButtonLabel || 'View Related Dataset';
            modalDatasetSwitchBtn.setAttribute('data-dataset-key', dataset.alternateDatasetKey);
            return;
        }

        modalDatasetSwitchBtn.hidden = true;
        modalDatasetSwitchBtn.removeAttribute('data-dataset-key');
    }

    async function loadDatasetPreview(datasetKey, metadata) {
        if (datasetCache[datasetKey]) {
            return datasetCache[datasetKey];
        }

        const response = await fetch(metadata.source);
        if (!response.ok) {
            throw new Error(`Unable to load ${metadata.source}`);
        }

        const csvText = await response.text();
        const parsedRows = parseCsv(csvText);
        const columns = parsedRows[0] || [];
        const dataRows = parsedRows.slice(1);
        const previewRows = dataRows.slice(0, DATASET_PREVIEW_LIMIT).map(row => {
            const rowObject = {};
            columns.forEach((column, index) => {
                rowObject[column] = row[index] || '';
            });
            return rowObject;
        });

        datasetCache[datasetKey] = {
            columns,
            rows: previewRows,
            totalRows: dataRows.length
        };

        return datasetCache[datasetKey];
    }

    function parseCsv(csvText) {
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
    }

    function renderDatasetInfo(dataset) {
        const source = escapeHtml(dataset.source || 'No local source');

        return `
            <div class="dataset-empty-state">
                <p class="dataset-meta"><strong>Source:</strong> ${source}</p>
            </div>
        `;
    }

    function renderDatasetPreview(dataset, metadata) {
        const hasRows = Array.isArray(dataset.rows) && dataset.rows.length > 0;
        const source = escapeHtml(metadata.source || 'No local source');
        const contextHtml = getDatasetContextHtml(activeDatasetKey, dataset);

        if (!hasRows) {
            return `
                <div class="dataset-empty-state">
                    <p class="dataset-meta"><strong>Source:</strong> ${source}</p>
                </div>
            `;
        }

        const columns = dataset.columns || Object.keys(dataset.rows[0]);
        const headerHtml = columns
            .map(column => `<th>${escapeHtml(column)}</th>`)
            .join('');
        const rowsHtml = dataset.rows
            .map(row => `
                <tr>
                    ${columns.map(column => `<td>${escapeHtml(row[column] || '')}</td>`).join('')}
                </tr>
            `)
            .join('');

        return `
            <div class="dataset-summary">
                <span><strong>Source:</strong> ${source}</span>
            </div>
            ${contextHtml}
            <div class="dataset-table-wrap">
                <table class="dataset-table">
                    <thead>
                        <tr>${headerHtml}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    function getDatasetContextHtml(datasetKey, dataset) {
        if (datasetKey === 'language') {
            return `
                <div class="dataset-context">
                    <strong>Language distribution:</strong>
                    <span>English: 10,000</span>
                    <span>Tagalog: 10,000</span>
                    <span>Cebuano: 9,999</span>
                    <span>Other: 20,000</span>
                </div>
            `;
        }

        if (datasetKey === 'original' || datasetKey === 'specialized' || datasetKey === 'fast') {
            return `
                <div class="dataset-context">
                    <strong>Dataset shape:</strong>
                    <span>${Number(dataset.totalRows || 0).toLocaleString()} rows</span>
                    <span>Columns: tagalog, english, cebuano</span>
                </div>
            `;
        }

        return '';
    }

    function openViewer(mode) {
        activeViewerMode = mode;
        if (mode === 'dataset') activeDatasetKey = modelSelect.value;
        codeViewer.hidden = false;
        viewCodeBtn.classList.toggle('active', mode === 'code');
        viewDatasetBtn.classList.toggle('active', mode === 'dataset');
        document.body.classList.add('modal-open');
        updateActiveViewer();
    }

    function closeViewer() {
        codeViewer.hidden = true;
        viewCodeBtn.classList.remove('active');
        viewDatasetBtn.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    function formatLanguageName(language) {
        if (!language) return 'Unknown';
        return language.charAt(0).toUpperCase() + language.slice(1);
    }

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

        // Ensure labels and scores are arrays for uniform processing
        if (!Array.isArray(labels)) {
            labels = [labels];
            scores = [scores];
        }

        let topicsHtml = '';
        for (let i = 0; i < labels.length; i++) {
            let confPercent = scores[i] <= 1.0 ? scores[i] * 100 : scores[i];
            topicsHtml += `
                <div style="margin-bottom: 1.5rem;">
                    <div class="result-header">
                        <span style="font-weight: 500; font-size: 0.875rem; color: var(--text-secondary);">Predicted Topic ${labels.length > 1 ? i + 1 : ''}</span>
                        <span class="topic-badge">${labels[i]}</span>
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
        }

        // Handle multiple languages
        let langList = Array.isArray(language) ? language : [language];
        let languageHtml = '';

        langList.forEach(lang => {
            if (!lang) return;
            const displayLang = formatLanguageName(lang);
            languageHtml += `<span class="topic-badge badge-${lang.toLowerCase()}">${displayLang}</span>`;
        });

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
});

// Add fade-in animation keyframe dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
