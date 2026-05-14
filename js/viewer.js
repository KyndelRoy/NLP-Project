window.createViewerController = function createViewerController({
    modelSelect,
    viewToolsBtn,
    viewCodeBtn,
    viewDatasetBtn,
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
    const datasetCache = {};
    const toolCodeCache = {};
    const codeFileCache = {};
    let activeViewerMode = 'code';
    let activeDatasetKey = null;
    let activeToolKey = Object.keys(toolSnippets)[0] || null;
    let activeCodeTabKey = null;

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

    closeCodeBtn.addEventListener('click', closeViewer);

    modalDatasetSwitchBtn.addEventListener('click', () => {
        updateDatasetViewer(modalDatasetSwitchBtn.getAttribute('data-dataset-key'));
    });

    toolsCodeTabs.addEventListener('click', (event) => {
        const tab = event.target.closest('[data-tool-key], [data-code-tab-key]');
        if (!tab) return;

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
        if (activeViewerMode === 'dataset') {
            await updateDatasetViewer();
            return;
        }

        if (activeViewerMode === 'tools') {
            await updateToolsViewer();
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
                    <p class="dataset-meta"><strong>Source:</strong> ${escapeHtml(selectedDataset.source)}</p>
                    <p>Unable to load this CSV. Serve the app through a local web server instead of opening it directly as a file.</p>
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

    function renderDatasetInfo(dataset) {
        const source = escapeHtml(dataset.source || 'No local source');
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
                <p class="dataset-meta"><strong>Source:</strong> ${source}</p>
                ${labelsHtml}
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
                    <strong>Data Information:</strong>
                    <span>Total rows: 50,000</span>
                    <span>English: 10,000</span>
                    <span>Tagalog: 10,000</span>
                    <span>Cebuano: 10,000</span>
                    <span>Other: 20,000</span>
                </div>
            `;
        }

        if (datasetKey === 'original' || datasetKey === 'lda' || datasetKey.startsWith('bertopic_')) {
            return `
                <div class="dataset-context">
                    <strong>Dataset Information:</strong>
                    <span>${Number(dataset.totalRows || 0).toLocaleString()} rows</span>
                    <span>English: 10,000</span>
                    <span>Tagalog: 10,000</span>
                    <span>Cebuano: 9,999</span>
                    <span>Other: 20,000</span>
                </div>
            `;
        }

        return '';
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
        document.body.classList.add('modal-open');
        updateActiveViewer();
    }

    function closeViewer() {
        codeViewer.hidden = true;
        viewToolsBtn.classList.remove('active');
        viewCodeBtn.classList.remove('active');
        viewDatasetBtn.classList.remove('active');
        toolsCodeTabs.hidden = true;
        document.body.classList.remove('modal-open');
    }

    function resetForModelChange() {
        activeDatasetKey = null;
        activeCodeTabKey = null;
        updateActiveViewer();
    }

    updateActiveViewer();

    return {
        resetForModelChange,
        updateActiveViewer
    };
};
