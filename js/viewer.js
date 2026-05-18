window.createViewerController = function createViewerController({
    modelSelect,
    viewToolsBtn,
    viewCodeBtn,
    viewDatasetBtn,
    viewEvaluationBtn,
    codeViewer,
    codeViewerTitle,
    codeViewerContent,
    datasetViewerContent,
    closeCodeBtn,
    modalDatasetSwitchBtn,
    toolsCodeTabs,
    codeSnippets,
    toolSnippets,
    datasetPreviews
}) {
    const { escapeHtml, highlightSnippet, parseCsv } = window.AppUtils;
    const DATASET_PREVIEW_LIMIT = 50;
    const EVALUATION_REPORT_SOURCE = 'evaluation/results/evaluation_report.json';
    // Fetch caches prevent repeated file reads while users switch tabs/modes.
    const datasetCache = {};
    const toolCodeCache = {};
    const codeFileCache = {};
    const topicCsvCache = {};
    let evaluationReportCache = null;
    let activeViewerMode = 'code';
    let activeDatasetKey = null;
    let activeToolKey = Object.keys(toolSnippets)[0] || null;
    let activeCodeTabKey = null;
    let activeEvaluationTab = 'overview';

    // The modal modes share one shell: code, dataset, evaluation, and tools.
    viewToolsBtn.addEventListener('click', () => {
        if (codeViewer.hidden || activeViewerMode !== 'tools') {
            openViewer('tools');
        } else {
            closeViewer();
        }
    });

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

    viewEvaluationBtn.addEventListener('click', () => {
        if (codeViewer.hidden || activeViewerMode !== 'evaluation') {
            openViewer('evaluation');
        } else {
            closeViewer();
        }
    });

    closeCodeBtn.addEventListener('click', closeViewer);

    modalDatasetSwitchBtn.addEventListener('click', () => {
        updateDatasetViewer(modalDatasetSwitchBtn.getAttribute('data-dataset-key'));
    });

    toolsCodeTabs.addEventListener('click', (event) => {
        const tab = event.target.closest('[data-tool-key], [data-code-tab-key], [data-evaluation-tab]');
        if (!tab) return;

        if (tab.hasAttribute('data-evaluation-tab')) {
            activeEvaluationTab = tab.getAttribute('data-evaluation-tab');
            updateEvaluationViewer();
            return;
        }

        if (tab.hasAttribute('data-tool-key')) {
            activeToolKey = tab.getAttribute('data-tool-key');
            updateToolsViewer();
            return;
        }

        activeCodeTabKey = tab.getAttribute('data-code-tab-key');
        updateCodeViewer();
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

    async function updateActiveViewer() {
        // Route each open-state refresh through the currently selected modal mode.
        if (activeViewerMode === 'dataset') {
            await updateDatasetViewer();
            return;
        }

        if (activeViewerMode === 'tools') {
            await updateToolsViewer();
            return;
        }

        if (activeViewerMode === 'evaluation') {
            await updateEvaluationViewer();
            return;
        }

        await updateCodeViewer();
    }

    async function updateCodeViewer() {
        const selectedSnippet = codeSnippets[modelSelect.value] || codeSnippets.bart;
        if (!selectedSnippet) return;

        codeViewerContent.parentElement.hidden = false;
        datasetViewerContent.hidden = true;
        modalDatasetSwitchBtn.hidden = true;

        if (Array.isArray(selectedSnippet.tabs) && selectedSnippet.tabs.length > 0) {
            await updateTabbedCodeViewer(selectedSnippet);
            return;
        }

        toolsCodeTabs.hidden = true;
        codeViewerTitle.textContent = selectedSnippet.title;
        codeViewerContent.innerHTML = highlightSnippet(selectedSnippet.code);
    }

    async function updateTabbedCodeViewer(snippetGroup) {
        // File-backed snippets show the current source code when served locally.
        if (!snippetGroup.tabs.some(tab => tab.key === activeCodeTabKey)) {
            activeCodeTabKey = snippetGroup.tabs[0].key;
        }

        const selectedTab = snippetGroup.tabs.find(tab => tab.key === activeCodeTabKey);
        toolsCodeTabs.hidden = false;
        codeViewerTitle.textContent = selectedTab.title;
        renderCodeTabs(snippetGroup.tabs);
        codeViewerContent.textContent = 'Loading code...';

        try {
            const code = await loadCodeFile(selectedTab.source);
            codeViewerContent.innerHTML = highlightSnippet(code);
        } catch (error) {
            console.error(error);
            codeViewerTitle.textContent = snippetGroup.title;
            codeViewerContent.innerHTML = highlightSnippet(snippetGroup.code);
        }
    }

    async function updateToolsViewer() {
        if (!toolSnippets[activeToolKey]) {
            activeToolKey = Object.keys(toolSnippets)[0] || null;
        }

        const selectedSnippet = toolSnippets[activeToolKey];
        if (!selectedSnippet) return;

        codeViewerContent.parentElement.hidden = false;
        datasetViewerContent.hidden = true;
        toolsCodeTabs.hidden = false;
        modalDatasetSwitchBtn.hidden = true;
        codeViewerTitle.textContent = selectedSnippet.title;
        renderToolsTabs();

        try {
            const code = await loadToolCode(activeToolKey, selectedSnippet);
            codeViewerContent.innerHTML = highlightSnippet(code);
        } catch (error) {
            console.error(error);
            codeViewerContent.textContent = `Unable to load ${selectedSnippet.source}. Serve the app through a local web server instead of opening it directly as a file.`;
        }
    }

    async function updateDatasetViewer(datasetKey = activeDatasetKey || modelSelect.value) {
        activeDatasetKey = datasetKey;
        const selectedDataset = datasetPreviews[datasetKey] || datasetPreviews.bart;
        if (!selectedDataset) return;

        codeViewerContent.parentElement.hidden = true;
        datasetViewerContent.hidden = false;
        toolsCodeTabs.hidden = true;
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
                    ${renderDatasetSources(selectedDataset)}
                    <p>Unable to load this CSV. Serve the app through a local web server instead of opening it directly as a file.</p>
                </div>
            `;
        }
    }

    async function updateEvaluationViewer() {
        codeViewerContent.parentElement.hidden = true;
        datasetViewerContent.hidden = false;
        modalDatasetSwitchBtn.hidden = true;

        const modelKey = modelSelect.value;
        datasetViewerContent.innerHTML = '<div class="dataset-loading">Loading evaluation report...</div>';

        try {
            const report = await loadEvaluationReport();
            const modelReport = report.models?.[modelKey];
            const title = modelReport?.title || selectedModelLabel();
            codeViewerTitle.textContent = `${title} Results & Evaluation`;

            if (modelReport?.topics_csv) {
                if (activeEvaluationTab !== 'overview' && activeEvaluationTab !== 'topics') {
                    activeEvaluationTab = 'overview';
                }
                renderEvaluationTabs();
            } else {
                activeEvaluationTab = 'overview';
                toolsCodeTabs.hidden = true;
            }

            if (activeEvaluationTab === 'topics' && modelReport?.topics_csv) {
                const topicRows = await loadTopicRows(modelReport.topics_csv);
                datasetViewerContent.innerHTML = renderCollectedTopics(modelReport, topicRows);
                return;
            }

            datasetViewerContent.innerHTML = renderEvaluationOverview(report, modelKey, modelReport);
        } catch (error) {
            console.error(error);
            toolsCodeTabs.hidden = true;
            codeViewerTitle.textContent = 'Results & Evaluation';
            datasetViewerContent.innerHTML = `
                <div class="dataset-empty-state">
                    <p>Unable to load ${escapeHtml(EVALUATION_REPORT_SOURCE)}.</p>
                    <p>Run <code>venv/bin/python evaluation/run_evaluation.py</code>, then serve the app through a local web server.</p>
                </div>
            `;
        }
    }

    function updateHeaderDatasetSwitch(dataset) {
        toolsCodeTabs.hidden = true;

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

        // CSV previews load only the first rows to keep the modal responsive.
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
            totalRows: dataRows.length,
            counts: getDatasetCounts(columns, dataRows)
        };

        return datasetCache[datasetKey];
    }

    function getDatasetCounts(columns, rows) {
        const counts = {};

        columns.forEach((column, index) => {
            counts[column] = {};
            rows.forEach(row => {
                const value = (row[index] || '').trim();
                if (!value) return;
                counts[column][value] = (counts[column][value] || 0) + 1;
            });
        });

        return counts;
    }

    function renderDatasetInfo(dataset) {
        const labelsHtml = Array.isArray(dataset.candidateLabels)
            ? `
                <div class="dataset-labels">
                    <strong>Candidate Labels:</strong>
                    <span>${dataset.candidateLabels.map(escapeHtml).join(', ')}</span>
                </div>
            `
            : '';

        return `
            <div class="dataset-empty-state">
                ${renderDatasetSources(dataset)}
                ${labelsHtml}
            </div>
        `;
    }

    function renderDatasetPreview(dataset, metadata) {
        const hasRows = Array.isArray(dataset.rows) && dataset.rows.length > 0;
        const contextHtml = getDatasetContextHtml(activeDatasetKey, dataset);

        if (!hasRows) {
            return `
                <div class="dataset-empty-state">
                    ${renderDatasetSources(metadata)}
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
                ${renderDatasetSources(metadata)}
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

    function renderDatasetSources(metadata) {
        const localSource = escapeHtml(metadata.source || 'No local source');
        const externalSource = metadata.externalSource
            ? `
                <span>
                    <strong>Original source:</strong>
                    <a href="${escapeHtml(metadata.externalSource)}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(metadata.externalSource)}
                    </a>
                </span>
            `
            : '';

        return `
            <span><strong>Local source:</strong> ${localSource}</span>
            ${externalSource}
        `;
    }

    function getDatasetContextHtml(datasetKey, dataset) {
        const totalRows = Number(dataset.totalRows || 0).toLocaleString();
        const languageLabels = {
            english: 'English',
            tagalog: 'Tagalog',
            cebuano: 'Cebuano',
            other: 'Other',
            tl: 'Tagalog',
            en: 'English',
            ceb: 'Cebuano',
        };

        const chips = [];
        const appendCounts = (counts, labels = {}) => {
            Object.entries(counts || {}).forEach(([key, value]) => {
                const label = labels[key] || key;
                chips.push(`<span>${escapeHtml(label)}: ${Number(value).toLocaleString()}</span>`);
            });
        };

        chips.push(`<span>${totalRows} rows</span>`);

        if (datasetKey === 'lda') {
            appendCounts(dataset.counts?.label);
            appendCounts(dataset.counts?.language, languageLabels);
        } else if (datasetKey === 'language') {
            appendCounts(dataset.counts?.language, languageLabels);
        } else if (datasetKey === 'original' || datasetKey.startsWith('bertopic_')) {
            const columnCounts = {};
            ['english', 'tagalog', 'cebuano', 'other'].forEach(column => {
                if (dataset.counts?.[column]) {
                    columnCounts[column] = Object.values(dataset.counts[column])
                        .reduce((sum, count) => sum + count, 0);
                }
            });
            appendCounts(columnCounts, languageLabels);
        }

        if (chips.length > 1) {
            return `
                <div class="dataset-context">
                    <strong>Dataset Information:</strong>
                    ${chips.join('')}
                </div>
            `;
        }

        return '';
    }

    async function loadEvaluationReport() {
        if (evaluationReportCache) {
            return evaluationReportCache;
        }

        const response = await fetch(EVALUATION_REPORT_SOURCE);
        if (!response.ok) {
            throw new Error(`Unable to load ${EVALUATION_REPORT_SOURCE}`);
        }

        evaluationReportCache = await response.json();
        return evaluationReportCache;
    }

    async function loadTopicRows(source) {
        if (topicCsvCache[source]) {
            return topicCsvCache[source];
        }

        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`Unable to load ${source}`);
        }

        const rows = parseCsv(await response.text());
        const columns = rows[0] || [];
        topicCsvCache[source] = rows.slice(1).map(row => {
            const rowObject = {};
            columns.forEach((column, index) => {
                rowObject[column] = row[index] || '';
            });
            return rowObject;
        });
        return topicCsvCache[source];
    }

    function renderEvaluationTabs() {
        toolsCodeTabs.hidden = false;
        toolsCodeTabs.innerHTML = `
            <button class="tool-code-tab${activeEvaluationTab === 'overview' ? ' active' : ''}" type="button" data-evaluation-tab="overview">
                Overview
            </button>
            <button class="tool-code-tab${activeEvaluationTab === 'topics' ? ' active' : ''}" type="button" data-evaluation-tab="topics">
                See Collected Topics
            </button>
        `;
    }

    function selectedModelLabel() {
        const selectedOption = Array.from(document.querySelectorAll('.option'))
            .find(option => option.getAttribute('data-value') === modelSelect.value);
        return selectedOption ? selectedOption.textContent : modelSelect.value;
    }

    function renderEvaluationOverview(report, modelKey, modelReport) {
        if (!modelReport) {
            return `
                <div class="dataset-empty-state">
                    <p>No saved evaluation section was found for ${escapeHtml(modelKey)}.</p>
                    <p>Report source: ${escapeHtml(report.report_path || EVALUATION_REPORT_SOURCE)}</p>
                </div>
            `;
        }

        const sourceRows = [
            ['Report', report.report_path || EVALUATION_REPORT_SOURCE],
            ['Summary CSV', report.summary_csv || 'evaluation/results/evaluation_summary.csv'],
            ['Sample Set', modelReport.sample_set || report.sample_sets?.[modelKey] || 'N/A'],
            ['Topics CSV', modelReport.topics_csv || 'N/A'],
            ['Model Dir', modelReport.model_dir || 'N/A'],
        ].filter(([, value]) => value && value !== 'N/A');

        const errorHtml = modelReport.error
            ? `<div class="unsupported-card"><h4>Evaluation Notice</h4><p>${escapeHtml(modelReport.error)}</p></div>`
            : '';

        return `
            <div class="evaluation-report">
                <div class="dataset-summary">
                    <span><strong>Evaluation type:</strong> ${escapeHtml(modelReport.evaluation_type || 'N/A')}</span>
                    <span><strong>Status:</strong> ${escapeHtml(modelReport.status || 'unknown')}</span>
                    <span><strong>Generated:</strong> ${escapeHtml(report.generated_at || 'N/A')}</span>
                </div>
                ${errorHtml}
                ${renderMetricCards(modelReport.metrics || {})}
                ${renderSourceList(sourceRows)}
                ${renderPerLabelMetrics(modelReport.metrics?.per_label)}
                ${renderConfusionMatrix(modelReport.metrics?.confusion_matrix)}
                ${renderSampleResults(modelReport.samples || [])}
            </div>
        `;
    }

    function renderSourceList(rows) {
        if (!rows.length) return '';
        return `
            <div class="evaluation-section">
                <h4>Sources</h4>
                <div class="dataset-context">
                    ${rows.map(([label, value]) => `<span>${escapeHtml(label)}: ${escapeHtml(value)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    function renderMetricCards(metrics) {
        const metricRows = Object.entries(metrics)
            .filter(([, value]) => value === null || typeof value !== 'object')
            .map(([key, value]) => `
                <div class="evaluation-metric">
                    <span>${escapeHtml(formatMetricName(key))}</span>
                    <strong>${escapeHtml(formatMetricValue(key, value))}</strong>
                </div>
            `)
            .join('');

        if (!metricRows) return '';
        return `<div class="evaluation-metrics">${metricRows}</div>`;
    }

    function renderPerLabelMetrics(perLabel) {
        if (!perLabel || !Object.keys(perLabel).length) return '';

        const rowsHtml = Object.entries(perLabel)
            .map(([label, values]) => `
                <tr>
                    <td>${escapeHtml(label)}</td>
                    <td>${escapeHtml(values.support ?? '')}</td>
                    <td>${escapeHtml(formatPercent(values.precision))}</td>
                    <td>${escapeHtml(formatPercent(values.recall))}</td>
                    <td>${escapeHtml(formatPercent(values.f1))}</td>
                </tr>
            `)
            .join('');

        return `
            <div class="evaluation-section">
                <h4>Per-Label Metrics</h4>
                <div class="dataset-table-wrap">
                    <table class="dataset-table evaluation-table">
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Support</th>
                                <th>Precision</th>
                                <th>Recall</th>
                                <th>F1</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderConfusionMatrix(matrix) {
        if (!matrix || !Object.keys(matrix).length) return '';

        const labels = Object.keys(matrix);
        const headerHtml = labels.map(label => `<th>${escapeHtml(label)}</th>`).join('');
        const rowsHtml = labels
            .map(expected => `
                <tr>
                    <th>${escapeHtml(expected)}</th>
                    ${labels.map(predicted => `<td>${escapeHtml(matrix[expected]?.[predicted] ?? 0)}</td>`).join('')}
                </tr>
            `)
            .join('');

        return `
            <div class="evaluation-section">
                <h4>Confusion Matrix</h4>
                <div class="dataset-table-wrap">
                    <table class="dataset-table evaluation-table">
                        <thead>
                            <tr>
                                <th>Expected \\ Predicted</th>
                                ${headerHtml}
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderSampleResults(samples) {
        if (!samples.length) return '';

        const preferredColumns = [
            'sample_id',
            'expected_label',
            'predicted_label',
            'expected_language',
            'predicted_language',
            'expected_keyword',
            'topic_id',
            'topic_name',
            'score',
            'matched',
            'keyword_matched',
            'is_outlier',
            'text',
        ];
        const columns = preferredColumns.filter(column => samples.some(sample => sample[column] !== undefined));
        const headerHtml = columns.map(column => `<th>${escapeHtml(formatMetricName(column))}</th>`).join('');
        const rowsHtml = samples
            .map(sample => `
                <tr>
                    ${columns.map(column => `<td>${escapeHtml(formatCellValue(sample[column]))}</td>`).join('')}
                </tr>
            `)
            .join('');

        return `
            <div class="evaluation-section">
                <h4>Sample Results</h4>
                <div class="dataset-table-wrap">
                    <table class="dataset-table evaluation-table">
                        <thead><tr>${headerHtml}</tr></thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderCollectedTopics(modelReport, topicRows) {
        const rowsHtml = topicRows
            .map(row => `
                <tr>
                    <td>${escapeHtml(row.topic_id)}</td>
                    <td>${escapeHtml(row.is_outlier === 'True' ? 'Yes' : 'No')}</td>
                    <td>${escapeHtml(row.name)}</td>
                    <td>${escapeHtml(row.document_count)}</td>
                    <td>${escapeHtml(row.top_terms)}</td>
                </tr>
            `)
            .join('');

        return `
            <div class="dataset-summary">
                <span><strong>Local source:</strong> ${escapeHtml(modelReport.topics_csv)}</span>
                <span><strong>Total collected topics:</strong> ${topicRows.length.toLocaleString()}</span>
            </div>
            <div class="dataset-table-wrap">
                <table class="dataset-table evaluation-table">
                    <thead>
                        <tr>
                            <th>Topic ID</th>
                            <th>Outlier</th>
                            <th>Name</th>
                            <th>Documents</th>
                            <th>Top Terms</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    function formatMetricName(key) {
        return String(key)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    function formatMetricValue(key, value) {
        if (typeof value !== 'number') return formatCellValue(value);
        if (key.includes('coherence')) return value.toFixed(4);
        if (key.includes('accuracy') || key.includes('rate') || key.includes('precision') || key.includes('recall') || key.includes('f1') || key.includes('diversity')) {
            return formatPercent(value);
        }
        return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(4);
    }

    function formatPercent(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '';
        return `${(numeric * 100).toFixed(1)}%`;
    }

    function formatCellValue(value) {
        if (value === undefined || value === null) return '';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(4);
        }
        return String(value);
    }

    function renderToolsTabs() {
        toolsCodeTabs.innerHTML = Object.entries(toolSnippets)
            .map(([key, snippet]) => `
                <button class="tool-code-tab${key === activeToolKey ? ' active' : ''}" type="button" data-tool-key="${key}">
                    ${escapeHtml(snippet.label)}
                </button>
            `)
            .join('');
    }

    function renderCodeTabs(tabs) {
        toolsCodeTabs.innerHTML = tabs
            .map(tab => `
                <button class="tool-code-tab${tab.key === activeCodeTabKey ? ' active' : ''}" type="button" data-code-tab-key="${tab.key}">
                    ${escapeHtml(tab.label)}
                </button>
            `)
            .join('');
    }

    async function loadCodeFile(source) {
        if (codeFileCache[source]) {
            return codeFileCache[source];
        }

        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`Unable to load ${source}`);
        }

        codeFileCache[source] = await response.text();
        return codeFileCache[source];
    }

    async function loadToolCode(toolKey, metadata) {
        if (toolCodeCache[toolKey]) {
            return toolCodeCache[toolKey];
        }

        const response = await fetch(metadata.source);
        if (!response.ok) {
            throw new Error(`Unable to load ${metadata.source}`);
        }

        toolCodeCache[toolKey] = await response.text();
        return toolCodeCache[toolKey];
    }

    function openViewer(mode) {
        activeViewerMode = mode;
        if (mode === 'dataset') activeDatasetKey = modelSelect.value;
        codeViewer.hidden = false;
        viewToolsBtn.classList.toggle('active', mode === 'tools');
        viewCodeBtn.classList.toggle('active', mode === 'code');
        viewDatasetBtn.classList.toggle('active', mode === 'dataset');
        viewEvaluationBtn.classList.toggle('active', mode === 'evaluation');
        document.body.classList.add('modal-open');
        updateActiveViewer();
    }

    function closeViewer() {
        codeViewer.hidden = true;
        viewToolsBtn.classList.remove('active');
        viewCodeBtn.classList.remove('active');
        viewDatasetBtn.classList.remove('active');
        viewEvaluationBtn.classList.remove('active');
        toolsCodeTabs.hidden = true;
        document.body.classList.remove('modal-open');
    }

    function resetForModelChange() {
        // Switching models should reopen code/dataset tabs at that model's default.
        activeDatasetKey = null;
        activeCodeTabKey = null;
        activeEvaluationTab = 'overview';
        updateActiveViewer();
    }

    updateActiveViewer();

    return {
        resetForModelChange,
        updateActiveViewer
    };
};
