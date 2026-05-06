document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('current-chars');
    const sendBtn = document.getElementById('send-btn');
    const resultsContent = document.getElementById('results-content');
    const modelSelect = document.getElementById('model-select');
    const labelsContainer = document.getElementById('labels-container');

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

    // Update character count
    textInput.addEventListener('input', () => {
        const length = textInput.value.length;
        charCount.textContent = length.toLocaleString();
        
        // Add subtle animation when typing
        charCount.style.transform = 'scale(1.1)';
        setTimeout(() => {
            charCount.style.transform = 'scale(1)';
        }, 100);
    });

    // Handle Send button click
    sendBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        const model = modelSelect.value;

        if (!text) {
            alert('Please enter some text to classify.');
            textInput.focus();
            return;
        }

        // UI Loading State
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="loading-dots">Analyzing</span>';
        resultsContent.innerHTML = `
            <div class="loading-state" style="text-align: center; color: var(--text-muted);">
                <p>Running ${model} analysis...</p>
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
            displayResults(data.label, data.score, data.language, data.message);
        } catch (error) {
            console.error(error);
            resultsContent.innerHTML = `<p style="color: #ef4444;">Error analyzing text. Is the backend running at ${API_URL}?</p>`;
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
    });

    function displayResults(topic, confidence, language, message) {
        if (language === 'other') {
            resultsContent.innerHTML = `
                <div class="result-item" style="animation: fadeIn 0.3s ease-out forwards;">
                    <div style="padding: 1rem; background: hsl(var(--destructive) / 0.1); border-radius: 0.5rem; border: 1px solid hsl(var(--destructive) / 0.2);">
                        <h4 style="color: hsl(var(--destructive)); font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">Unsupported Language</h4>
                        <p style="font-size: 0.875rem; color: hsl(var(--destructive) / 0.8);">${message}</p>
                    </div>
                </div>
            `;
            return;
        }

        // Convert to percentage if it's less than 1
        let confPercent = confidence;
        if (confidence <= 1.0) {
            confPercent = confidence * 100;
        }
        
        resultsContent.innerHTML = `
            <div class="result-item" style="animation: fadeIn 0.3s ease-out forwards;">
                <div class="result-header">
                    <span style="font-weight: 500; font-size: 0.875rem;">Predicted Topic</span>
                    <span class="topic-badge">${topic}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -0.5rem; margin-bottom: 0.5rem;">
                    <span style="font-weight: 500; font-size: 0.875rem;">Detected Language</span>
                    <span class="topic-badge" style="background-color: hsl(var(--accent)); color: hsl(var(--accent-foreground)); border: 1px solid hsl(var(--border));">${language || 'unknown'}</span>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.75rem; color: hsl(var(--muted-foreground));">
                        <span>Confidence</span>
                        <span>${confPercent.toFixed(1)}%</span>
                    </div>
                    <div class="confidence-bar-container">
                        <div class="confidence-bar" style="width: ${confPercent}%"></div>
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: hsl(var(--muted-foreground)); margin-top: 0.5rem;">
                    Analysis completed using ${modelSelect.options[modelSelect.selectedIndex].text}.
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
