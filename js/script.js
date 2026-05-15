document.addEventListener('DOMContentLoaded', () => {
    // Main browser entrypoint: wires UI controls to the local FastAPI backend.
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('current-chars');
    const sendBtn = document.getElementById('send-btn');
    const resultsContent = document.getElementById('results-content');
    const modelSelect = document.getElementById('model-select');
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownOptions = document.getElementById('dropdown-options');
    const selectedModelText = document.getElementById('selected-model-text');
    const options = document.querySelectorAll('.option');
    const greetingTitle = document.getElementById('greeting-title');
    const labelsContainer = document.getElementById('labels-container');
    const themeBtns = document.querySelectorAll('.theme-btn[data-theme]');
    const htmlElement = document.documentElement;
    const MIN_WORDS = 4;
    const API_URL = window.API_URL || 'http://127.0.0.1:8000';
    let isSubmitting = false;

    const resultsView = window.createResultsView({
        resultsContent,
        selectedModelText
    });

    const viewer = window.createViewerController({
        modelSelect,
        viewToolsBtn: document.getElementById('view-tools-btn'),
        viewCodeBtn: document.getElementById('view-code-btn'),
        viewDatasetBtn: document.getElementById('view-dataset-btn'),
        codeViewer: document.getElementById('code-viewer'),
        codeViewerTitle: document.getElementById('code-viewer-title'),
        codeViewerContent: document.getElementById('code-viewer-content'),
        datasetViewerContent: document.getElementById('dataset-viewer-content'),
        closeCodeBtn: document.getElementById('close-code-btn'),
        modalDatasetSwitchBtn: document.getElementById('modal-dataset-switch-btn'),
        toolsCodeTabs: document.getElementById('tools-code-tabs'),
        codeSnippets: window.CODE_SNIPPETS || {},
        toolSnippets: window.TOOL_SNIPPETS || {},
        datasetPreviews: window.DATASET_PREVIEWS || {}
    });

    // Keep the custom dropdown and hidden form value in sync for API requests.
    dropdownTrigger.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownOptions.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdownOptions.classList.remove('show');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.getAttribute('data-value');
            modelSelect.value = value;
            selectedModelText.textContent = option.textContent;

            options.forEach(currentOption => currentOption.classList.remove('active'));
            option.classList.add('active');
            dropdownOptions.classList.remove('show');

            updateGreetingTitle(value);
            viewer.resetForModelChange();
        });
    });

    // Startup work: restore UI state, warm the label list, then bind input events.
    initializeTheme();
    fetchLabels();
    setInterval(fetchLabels, 2000);
    updateInputState();

    textInput.addEventListener('input', updateInputState);
    textInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return;

        event.preventDefault();
        submitAnalysis();
    });
    sendBtn.addEventListener('click', submitAnalysis);

    function initializeTheme() {
        let savedTheme = localStorage.getItem('app-theme') || 'dark';
        if (savedTheme !== 'light' && savedTheme !== 'dark') savedTheme = 'dark';
        setTheme(savedTheme);

        themeBtns.forEach(button => {
            button.addEventListener('click', () => {
                setTheme(button.getAttribute('data-theme'));
            });
        });
    }

    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);

        themeBtns.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-theme') === theme);
        });
    }

    function updateGreetingTitle(modelValue) {
        if (!greetingTitle) return;

        const nextTitle = modelValue === 'language'
            ? 'Low Resource Language<br>Language detector'
            : 'Low Resource Language<br>Topic Detector';

        if (greetingTitle.innerHTML === nextTitle) return;

        greetingTitle.classList.add('updating');
        setTimeout(() => {
            greetingTitle.innerHTML = nextTitle;
            greetingTitle.classList.remove('updating');
        }, 150);
    }

    async function fetchLabels() {
        if (!labelsContainer) return;

        try {
            // Polling keeps displayed labels aligned with backend config changes.
            const response = await fetch(`${API_URL}/labels`);
            if (!response.ok) return;

            const data = await response.json();
            labelsContainer.innerHTML = '';
            data.labels.forEach(label => {
                const span = document.createElement('span');
                span.className = 'topic-badge';
                span.textContent = label;
                labelsContainer.appendChild(span);
            });
        } catch (error) {
            console.error('Error fetching labels:', error);
            if (labelsContainer.children.length === 1 && labelsContainer.children[0].textContent === 'Loading labels...') {
                labelsContainer.innerHTML = '<span style="font-size: 0.875rem; color: #ef4444;">Ensure backend is running</span>';
            }
        }
    }

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

        isSubmitting = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        resultsContent.innerHTML = `
            <div class="loading-state">
                <p class="loading-dots">Analyzing with ${model}</p>
            </div>
        `;

        try {
            // The backend uses one endpoint for topic models and language-only mode.
            const response = await fetch(`${API_URL}/classify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, model })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.type === 'language_detection') {
                resultsView.displayLanguageDetectionResult(data.language, data.score);
                return;
            }

            resultsView.displayResults(data.labels || data.label, data.scores || data.score, data.language, data.message);
        } catch (error) {
            console.error(error);
            const message = error.message || `Error analyzing text. Is the backend running at ${API_URL}?`;
            resultsContent.innerHTML = `<p class="error-message">${window.AppUtils.escapeHtml(message)}</p>`;
        } finally {
            isSubmitting = false;
            updateInputState();
            sendBtn.style.opacity = '1';
        }
    }
});
