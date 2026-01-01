// Research Bot Configuration
const VENICE_API_KEY = 'fWrlL_QiOHTLuInUxhWEOf2wCeBGED-w3yd1OPohJ-';
const BASE_URL = 'https://api.venice.ai';
const API_URL = `${BASE_URL}/api/v1`;

// Available models configuration
const DEFAULT_MODELS = [
    { id: 'venice-uncensored', name: 'Venice Uncensored 1.1', isAvailable: false },
    { id: 'zai-org-glm-4.6', name: 'GLM 4.6', isAvailable: false },
    { id: 'qwen3-4b', name: 'Venice Small (Qwen 3 4B)', isAvailable: false },
    { id: 'mistral-31-24b', name: 'Venice Medium (Mistral 3.1 24B)', isAvailable: false },
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', isAvailable: false },
    { id: 'deepseek-r1-671b', name: 'DeepSeek R1 671B', isAvailable: false },
    { id: 'qwen-2.5-vl', name: 'Qwen 2.5 VL 72B', isAvailable: false },
    { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', isAvailable: false },
    { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', isAvailable: false }
];

// Global variables to store extracted data
let extractedTopics = [];
let extractedSpeakers = [];
let pdfText = '';
let therapeuticAreas = [];
let availableModels = [];
let isApiKeyValid = true;  // Set to true since we have a hardcoded key

// Research Bot Functions
let selectedTopic = null;
let chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const apiKeyInput = document.getElementById('apiKeyInput');
    const uploadForm = document.getElementById('uploadForm');
    const modelSelect = document.getElementById('modelSelect');
    const validateApiKeyBtn = document.getElementById('validateApiKey');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('pdfFile');
    const selectedFileName = document.getElementById('selectedFileName');

    // Set the API key in the input field
    if (apiKeyInput) {
        apiKeyInput.value = VENICE_API_KEY;
    }

    console.log('Initializing with API key:', VENICE_API_KEY);

    // Fetch models immediately since we have the key
    fetchAvailableModels().then(models => {
        console.log(`Loaded ${models.length} models from API`);

        // Populate model select dropdown if it exists
        if (modelSelect) {
            modelSelect.innerHTML = '';
            models.slice(0, 5).forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name || model.id;
                modelSelect.appendChild(option);
            });

            // Add a default option if no models were found
            if (models.length === 0) {
                const option = document.createElement('option');
                option.value = 'mixtral-8x7b';
                option.textContent = 'Mixtral 8x7B (Default)';
                modelSelect.appendChild(option);
            }
        }
    }).catch(error => {
        console.error('Error loading models:', error);

        // Add default option if there was an error
        if (modelSelect) {
            modelSelect.innerHTML = '<option value="mixtral-8x7b">Mixtral 8x7B (Default)</option>';
        }
    });

    // Enable the form since we have a valid key
    const submitButton = uploadForm?.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = false;
    if (modelSelect) modelSelect.disabled = false;

    // Set up event listeners for navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });

            // Show selected section
            const sectionId = item.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    // Set up event listeners
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }

    if (validateApiKeyBtn) {
        validateApiKeyBtn.addEventListener('click', async () => {
            const result = await handleApiKeyValidation();
            if (result) {
                // Save API key to localStorage
                localStorage.setItem('venice_api_key', VENICE_API_KEY);
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
                modal.hide();
            }
        });
    }

    if (toggleApiKeyBtn) {
        toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    }

    // Add speaker search functionality
    const speakerSearchInput = document.getElementById('speakerSearchInput');
    if (speakerSearchInput) {
        speakerSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const speakersList = document.getElementById('speakersList');
            const speakers = speakersList.getElementsByTagName('li');

            Array.from(speakers).forEach(speaker => {
                if (speaker.textContent.toLowerCase().includes(searchTerm)) {
                    speaker.style.display = '';
                } else {
                    speaker.style.display = 'none';
                }
            });
        });
    }

    // Add CSS classes for content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    // File upload handling
    if (dropZone && fileInput && selectedFileName) {
        // Set up drag and drop functionality
        setupDragAndDrop(dropZone, fileInput, selectedFileName);
    }

    // Initialize Research Bot
    initializeResearchBot();
});

function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleBtn = document.getElementById('toggleApiKey');

    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
            </svg>
        `;
    } else {
        apiKeyInput.type = 'password';
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
            </svg>
        `;
    }
}

async function handleApiKeyValidation() {
    // Get the API key from the input field
    const apiKeyInput = document.getElementById('apiKeyInput');
    const VENICE_API_KEY = apiKeyInput.value.trim();

    // Show status
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    apiKeyStatus.classList.remove('d-none', 'alert-success', 'alert-danger');
    apiKeyStatus.classList.add('alert-info');
    apiKeyStatus.textContent = 'Validating API key...';

    // Disable the validate button while validating
    const validateBtn = document.getElementById('validateApiKey');
    validateBtn.disabled = true;

    try {
        // Validate the API key
        const isValid = await validateApiKey();

        if (isValid) {
            // Save API key to localStorage
            localStorage.setItem('venice_api_key', VENICE_API_KEY);

            // If API key is valid, update status and fetch models
            apiKeyStatus.classList.remove('alert-info', 'alert-danger');
            apiKeyStatus.classList.add('alert-success');
            apiKeyStatus.textContent = 'API key is valid! Loading models...';

            // Enable the form
            document.querySelector('#uploadForm button[type="submit"]').disabled = false;
            document.getElementById('modelSelect').disabled = false;

            // Fetch available models
            await fetchAvailableModels();

            apiKeyStatus.textContent = 'API key is valid! Models loaded successfully.';

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (modal) {
                modal.hide();
            }

            return true;
        } else {
            // If API key is invalid, update status
            apiKeyStatus.classList.remove('alert-info', 'alert-success');
            apiKeyStatus.classList.add('alert-danger');
            apiKeyStatus.textContent = 'Invalid API key. Please check your API key and try again.';

            // Disable the form
            document.querySelector('#uploadForm button[type="submit"]').disabled = true;

            // Update model select
            const modelSelect = document.getElementById('modelSelect');
            modelSelect.innerHTML = '<option value="error" selected>Error: Invalid API Key</option>';
            modelSelect.disabled = true;

            return false;
        }
    } catch (error) {
        console.error('Error validating API key:', error);

        // Update status
        apiKeyStatus.classList.remove('alert-info', 'alert-success');
        apiKeyStatus.classList.add('alert-danger');
        apiKeyStatus.textContent = 'Error validating API key: ' + error.message;
        return false;
    } finally {
        // Re-enable the validate button
        validateBtn.disabled = false;
    }
}

async function validateApiKey() {
    try {
        const response = await fetch(`${API_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${VENICE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return true;
    } catch (error) {
        console.error('Error validating API key:', error);
        return false;
    }
}

async function fetchAvailableModels() {
    try {
        const response = await fetch(`${API_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${VENICE_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Models API response:', data);

        // Extract models from the response
        let models = [];

        if (data.data && Array.isArray(data.data)) {
            // Format from the swagger spec
            models = data.data.map(model => ({
                id: model.id,
                name: model.id,
                type: model.type
            }));
        } else if (data.models && Array.isArray(data.models)) {
            // Alternative format
            models = data.models;
        }

        // Filter for text models only
        const textModels = models.filter(model =>
            model.type === 'text' || !model.type
        );

        console.log(`Found ${textModels.length} text models`);
        return textModels;
    } catch (error) {
        console.error('Error fetching models:', error);
        throw new Error('Failed to fetch models: ' + error.message);
    }
}

async function handleFileUpload(event) {
    event.preventDefault();

    // Determine active tab
    const activeTab = document.querySelector('.nav-link.active[data-bs-toggle="tab"]');
    const activeTabId = activeTab ? activeTab.id : 'pdf-tab';

    const uploadStatus = document.querySelector('.upload-status');
    const progressContainer = document.getElementById('uploadProgress');
    const modelSelect = document.getElementById('modelSelect');
    const selectedModel = modelSelect?.value || 'mixtral-8x7b';

    // Initialize progress tracking
    if (progressContainer) {
        progressContainer.innerHTML = `
            <div class="progress-container">
                <div class="progress-circle-container">
                    <div class="progress-circle">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="progress-ring__circle" stroke="currentColor" stroke-width="4" fill="transparent" r="52" cx="60" cy="60"/>
                        </svg>
                        <div class="progress-text">0%</div>
                    </div>
                    <div class="progress-status">Starting...</div>
                </div>
                <div class="current-file mt-3">
                    <i class="bi bi-gear-wide-connected me-2"></i>
                    Processing Request
                </div>
            </div>
        `;
        progressContainer.style.display = 'block';
        progressContainer.classList.remove('d-none');
    }

    const circle = progressContainer?.querySelector('.progress-ring__circle');
    const radius = circle ? circle.r.baseVal.value : 52;
    const circumference = radius * 2 * Math.PI;

    if (circle) {
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference;
    }

    function setProgress(percent, status) {
        if (!progressContainer) return;
        const offset = circumference - (percent / 100 * circumference);
        if (circle) circle.style.strokeDashoffset = offset;
        progressContainer.querySelector('.progress-text').textContent = `${Math.round(percent)}%`;
        progressContainer.querySelector('.progress-status').textContent = status;
    }

    try {
        let extractedText = '';
        let analysisResults = null;
        let summary = '';

        if (activeTabId === 'website-tab') {
            const urlInput = document.getElementById('websiteUrl');
            const url = urlInput.value.trim();
            if (!url) throw new Error('Please enter a valid URL');

            setProgress(30, 'Analyzing website...');
            // For website, we ask Venice to research the URL
            analysisResults = await analyzeWebsiteContent(url, selectedModel);
            extractedText = `Website Analysis of ${url}`; // Placeholder

        } else if (activeTabId === 'screenshot-tab') {
            const fileInput = document.getElementById('screenshotFile');
            const file = fileInput.files[0];
            if (!file) throw new Error('Please select an image file');

            setProgress(30, 'Analyzing screenshot...');
            const base64Image = await fileToBase64(file);
            analysisResults = await analyzeScreenshotContent(base64Image, selectedModel);
            extractedText = "Screenshot Analysis"; // Placeholder

        } else {
            // PDF Handling
            const fileInput = document.getElementById('pdfFile');
            const file = fileInput.files[0];
            if (!file) throw new Error('Please select a PDF file');

            setProgress(25, 'Extracting text...');
            extractedText = await extractTextFromPDF(file);

            if (!extractedText || extractedText.trim().length === 0) {
                throw new Error('No text extracted from PDF. It might be image-based.');
            }

            setProgress(50, 'Analyzing content...');
            analysisResults = await analyzePDFContent(extractedText, selectedModel);
        }

        // Store global text for other functions
        pdfText = extractedText;

        setProgress(75, 'Generating summary...');
        if (!summary && activeTabId === 'pdf-tab') {
             summary = await generateAgendaSummary(extractedText, selectedModel);
        } else {
             // For website/screenshot, the analysis might already include summary or we generate one from results
             summary = await generateSummaryFromResults(analysisResults, selectedModel);
        }

        setProgress(100, 'Complete!');
        processResults(analysisResults, summary);

        // Switch to summary section
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('[data-section="summary-section"]').classList.add('active');
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById('summary-section').style.display = 'block';

        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('d-none');
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
        document.querySelector('#uploadForm').appendChild(errorDiv);

        if (progressContainer) {
            setProgress(100, 'Error!');
            if (circle) circle.style.stroke = 'var(--danger-color)';
            setTimeout(() => progressContainer.classList.add('d-none'), 2000);
        }
    }
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function analyzeWebsiteContent(url, model) {
    // Construct a prompt to extract agenda info from the URL using Venice's web search/scraping capability
    const prompt = `Analyze the conference agenda found at this URL: ${url}.
    Extract the following information and format it exactly as shown:

### Key Highlights
- [Brief, impactful statements about the most important aspects]

### Topics
- Topic: [topic name]
- Weight: [number 1-10]
- Description: [brief description]
- Related: [comma-separated list of related topics]

### Therapeutic Areas
- Name: [therapeutic area name]
- Description: [description]
- Key Sessions: [relevant sessions]
- Featured Speakers: [key speakers]

### Key Themes
- Theme: [theme name]
- Description: [description]
- Related Sessions: [relevant session names]

### Speakers
- Name: [name]
- Role: [role]
- Affiliation: [organization]
- Topics: [topics]
`;

    const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            venice_parameters: {
                enable_web_search: "auto",
                enable_web_scraping: true
            }
        })
    });

    if (!response.ok) throw new Error('Website analysis failed');
    const data = await response.json();
    return parseAnalysisResponse(data.choices[0].message.content);
}

async function analyzeScreenshotContent(base64Image, model) {
    // Ensure we use a vision capable model
    const visionModel = 'qwen-2.5-vl'; // Force vision model or check capabilities

    const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
            model: visionModel,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this conference agenda image. Extract Key Highlights, Topics (with weight 1-10), Therapeutic Areas, Key Themes, and Speakers. Format with Markdown headers like ### Topics, ### Speakers, etc." },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) throw new Error('Screenshot analysis failed');
    const data = await response.json();
    return parseAnalysisResponse(data.choices[0].message.content);
}

function parseAnalysisResponse(content) {
    // Reuse the parsing logic from analyzePDFContent but separate it out
    const sections = content.split('###').filter(Boolean);
    const result = {
        highlights: [],
        topics: [],
        speakers: [],
        therapeuticAreas: [],
        themes: []
    };

    sections.forEach(section => {
        const [title, ...lines] = section.trim().split('\n');
        const cleanLines = lines.filter(line => line.trim() && line.trim().startsWith('-'));

        switch (title.trim()) {
            case 'Key Highlights':
                result.highlights = cleanLines.map(line => line.replace('- ', '').trim());
                break;
            case 'Topics':
                let currentTopic = {};
                cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Topic') {
                        if (Object.keys(currentTopic).length > 0) result.topics.push({...currentTopic});
                        currentTopic = {};
                    }
                    if (key) currentTopic[key.toLowerCase()] = value;
                });
                if (Object.keys(currentTopic).length > 0) result.topics.push(currentTopic);
                break;
            case 'Speakers': // Handle Speakers explicitly if present in main analysis
                 let currentSpeaker = {};
                 cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Name') {
                        if (Object.keys(currentSpeaker).length > 0) result.speakers.push({...currentSpeaker});
                        currentSpeaker = {};
                    }
                    if (key) currentSpeaker[key.toLowerCase()] = value;
                 });
                 if (Object.keys(currentSpeaker).length > 0) result.speakers.push(currentSpeaker);
                 break;
            // ... (Add other cases or reuse existing logic if refactored)
            case 'Therapeutic Areas':
                let currentArea = {};
                cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Name') {
                        if (Object.keys(currentArea).length > 0) result.therapeuticAreas.push({...currentArea});
                        currentArea = {};
                    }
                    if (key === 'Featured Speakers' || key === 'Key Sessions') {
                        currentArea[key.toLowerCase()] = value.split(',').map(item => item.trim());
                    } else {
                        currentArea[key.toLowerCase()] = value;
                    }
                });
                if (Object.keys(currentArea).length > 0) result.therapeuticAreas.push(currentArea);
                break;
            case 'Key Themes':
                cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Theme') {
                        result.themes.push({ name: value, description: '', relatedSessions: [] });
                    } else if (key === 'Description' && result.themes.length > 0) {
                        result.themes[result.themes.length - 1].description = value;
                    } else if (key === 'Related Sessions' && result.themes.length > 0) {
                        result.themes[result.themes.length - 1].relatedSessions = value.split(',').map(s => s.trim());
                    }
                });
                break;
        }
    });
    return result;
}

async function generateSummaryFromResults(results, model) {
    // Generate a summary text from the structured results if raw text isn't available
    const summaryPrompt = `Generate a conference summary based on these highlights: ${JSON.stringify(results.highlights)} and themes: ${JSON.stringify(results.themes)}`;

    const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: summaryPrompt }]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function(event) {
            const typedArray = new Uint8Array(event.target.result);

            try {
                // Using PDF.js to extract text
                const pdf = await pdfjsLib.getDocument({data: typedArray}).promise;
                let text = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map(item => item.str);
                    text += strings.join(' ') + '\n';
                }

                resolve(text);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function generateAgendaSummary(text, model) {
    // Truncate text if it's too long (Venice API has limits)
    const maxTextLength = 15000; // Reasonable limit for API request
    const truncatedText = text.length > maxTextLength
        ? text.substring(0, maxTextLength) + "... [text truncated due to length]"
        : text;

    // Prepare the request to Venice.ai API for summarization
    const messages = [
        {
            role: "system",
            content: "You are an expert at summarizing conference agendas. Provide a concise, well-structured summary of the key aspects of the conference agenda, including main themes, schedule highlights, and overall focus of the event."
        },
        {
            role: "user",
            content: `Please summarize this conference agenda: ${truncatedText}`
        }
    ];

    const requestBody = {
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000 // Using max_tokens instead of max_completion_tokens for better compatibility
    };

    try {
        console.log("Making summary API request to Venice.ai...");

        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Summary API Error Response:", errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Summary API Response received successfully");
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Error generating summary:', error);
        return "Unable to generate summary. Please try again.";
    }
}

async function analyzePDFContent(text, model) {
    console.log('Making API request to Venice.ai...');

    // First, use a specialized model for speaker extraction
    const speakerResults = await extractSpeakersAndPanelists(text);

    try {
        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: model || 'mixtral-8x7b',
                messages: [
                    {
                        role: "system",
                        content: `You are an expert at analyzing conference agendas. Extract and analyze the following information from the provided text. Format your response exactly as shown:

### Key Highlights
- [Brief, impactful statements about the most important aspects of the conference]
- [Focus on unique features, breakthrough presentations, or notable speakers]
- [Include any special sessions or networking opportunities]

### Topics
- Topic: [topic name]
- Weight: [number 1-10]
- Description: [brief description]
- Related: [comma-separated list of related topics]

### Therapeutic Areas
- Name: [therapeutic area name]
- Description: [detailed description of the therapeutic area focus]
- Key Sessions: [relevant sessions in this area]
- Featured Speakers: [key speakers in this area]

### Key Themes
- Theme: [theme name]
- Description: [brief description]
- Related Sessions: [relevant session names]`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the markdown response into structured data
        const sections = content.split('###').filter(Boolean);
        const result = {
            highlights: [],
            topics: [],
            speakers: speakerResults.speakers,
            therapeuticAreas: [],
            themes: []
        };

        sections.forEach(section => {
            const [title, ...lines] = section.trim().split('\n');
            const cleanLines = lines.filter(line => line.trim() && line.trim().startsWith('-'));

            switch (title.trim()) {
                case 'Key Highlights':
                    result.highlights = cleanLines.map(line =>
                        line.replace('- ', '').trim()
                    );
                    break;

                case 'Topics':
                    let currentTopic = {};
                    cleanLines.forEach(line => {
                        const [key, value] = line.replace('- ', '').split(': ');
                        if (key === 'Topic') {
                            if (Object.keys(currentTopic).length > 0) {
                                result.topics.push({...currentTopic});
                            }
                            currentTopic = {};
                        }
                        if (key === 'Related') {
                            currentTopic[key.toLowerCase()] = value.split(',').map(t => t.trim());
                        } else if (key === 'Weight') {
                            currentTopic[key.toLowerCase()] = parseInt(value) || 5;
                        } else {
                            currentTopic[key.toLowerCase()] = value;
                        }
                    });
                    if (Object.keys(currentTopic).length > 0) {
                        result.topics.push(currentTopic);
                    }
                    break;

                case 'Therapeutic Areas':
                    let currentArea = {};
                    cleanLines.forEach(line => {
                        const [key, value] = line.replace('- ', '').split(': ');
                        if (key === 'Name') {
                            if (Object.keys(currentArea).length > 0) {
                                result.therapeuticAreas.push({...currentArea});
                            }
                            currentArea = {};
                        }
                        if (key === 'Featured Speakers' || key === 'Key Sessions') {
                            currentArea[key.toLowerCase()] = value.split(',').map(item => item.trim());
                        } else {
                            currentArea[key.toLowerCase()] = value;
                        }
                    });
                    if (Object.keys(currentArea).length > 0) {
                        result.therapeuticAreas.push(currentArea);
                    }
                    break;

                case 'Key Themes':
                    cleanLines.forEach(line => {
                        const [key, value] = line.replace('- ', '').split(': ');
                        if (key === 'Theme') {
                            result.themes.push({
                                name: value,
                                description: '',
                                relatedSessions: []
                            });
                        } else if (key === 'Description' && result.themes.length > 0) {
                            result.themes[result.themes.length - 1].description = value;
                        } else if (key === 'Related Sessions' && result.themes.length > 0) {
                            result.themes[result.themes.length - 1].relatedSessions =
                                value.split(',').map(s => s.trim());
                        }
                    });
                    break;
            }
        });

        return result;

    } catch (error) {
        console.log('Error calling Venice.ai API:', error);
        throw error;
    }
}

// New function to extract speakers and panelists using a specialized model
async function extractSpeakersAndPanelists(text) {
    try {
        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b',  // Using Venice's Llama model
                messages: [
                    {
                        role: "system",
                        content: `Extract all speakers, moderators, panelists, and presenters from the conference agenda. Format as follows:

### Speaker Entry
- Name: [full name with credentials]
- Role: [role in conference]
- Type: [presentation type]
- Affiliation: [organization]
- Session: [session/talk title]
- Topics: [main topics/areas of expertise]
- Time: [presentation time/date if available]

For each speaker, use "Not specified" if information is unavailable.`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            console.error('Speaker extraction API error:', await response.text());
            return { speakers: [] };
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the speaker entries
        const speakerEntries = content.split('### Speaker Entry').filter(Boolean);
        const speakers = [];

        speakerEntries.forEach(entry => {
            const lines = entry.trim().split('\n');
            let speaker = {};

            lines.forEach(line => {
                if (line.startsWith('- ')) {
                    const [key, ...valueParts] = line.substring(2).split(': ');
                    const value = valueParts.join(': ').trim();
                    speaker[key.toLowerCase()] = value;
                }
            });

            if (Object.keys(speaker).length > 0) {
                if (speaker.topics) {
                    speaker.topics = speaker.topics.split(',').map(t => t.trim());
                }
                speakers.push(speaker);
            }
        });

        return { speakers };

    } catch (error) {
        console.error('Error extracting speakers:', error);
        return { speakers: [] };
    }
}

function processResults(results, summary) {
    // Format the summary with highlights
    const formattedSummary = summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</div><div class="summary-section">')
        .replace(/\n/g, '<br>')
        .replace(/(Conference Overview|Main Themes|Schedule Highlights|Key Topics):/g,
            '<span class="summary-highlight">$1:</span>');

    // Update the summary section with key highlights
    document.getElementById('agendaSummary').innerHTML = `
        <div class="agenda-summary">
            <div class="summary-content">
                <div class="summary-section">
                    <h3>Key Highlights</h3>
                    <ul class="highlights-list">
                        ${results.highlights.map(highlight =>
                            `<li>${highlight}</li>`
                        ).join('')}
                    </ul>
                </div>
                <div class="summary-section">
                    ${formattedSummary}
                </div>
            </div>
        </div>
    `;

    // Store the extracted data
    extractedTopics = results.topics || [];
    extractedSpeakers = results.speakers || [];
    therapeuticAreas = results.therapeuticAreas || [];

    // Update other sections
    updateConferenceStats(results);
    updateTopicsSection(results);
    updateSpeakersSection(results);
    updateMSLSection(results);
}

function updateConferenceStats(results) {
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-container';
    statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-icon">
                <i class="bi bi-people"></i>
            </div>
            <div class="stat-info">
                <h6>Speakers</h6>
                <div class="value" id="speakerCount">${results.speakers.length}</div>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-icon">
                <i class="bi bi-diagram-3"></i>
            </div>
            <div class="stat-info">
                <h6>Topics</h6>
                <div class="value" id="topicCount">${results.topics.length}</div>
            </div>
        </div>
    `;

    const overviewSection = document.getElementById('overview-section');
    if (overviewSection) {
        const existingStats = overviewSection.querySelector('.stats-container');
        if (existingStats) {
            existingStats.replaceWith(statsContainer);
        } else {
            overviewSection.appendChild(statsContainer);
        }
    }
}

function updateTopicsSection(results) {
    const topicsContainer = document.getElementById('topicGraph');
    if (!topicsContainer) return;

    topicsContainer.innerHTML = `
        <div class="topic-analysis-container">
            <div class="topic-relationships">
                ${results.topics.map(topic => `
                    <div class="topic-card">
                        <h5>${topic.topic}</h5>
                        <span class="topic-weight">Weight: ${topic.weight || 5}/10</span>
                        <p>${topic.description || ''}</p>
                        ${topic.related && topic.related.length > 0 ? `
                            <div class="related-topics">
                                ${topic.related.map(rel => `<span class="tag">${rel}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="topic-distribution-section">
            <h3>Topic Distribution</h3>
            <div class="topic-distribution">
                <canvas id="topicDistributionChart"></canvas>
            </div>
        </div>
        <div class="therapeutic-areas-section">
            <h3>Therapeutic Areas</h3>
            <div class="therapeutic-areas-grid">
                ${results.therapeuticAreas.map(area => `
                    <div class="therapeutic-area-card">
                        <h4>${area.name}</h4>
                        <p>${area.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Create topic distribution chart
    const ctx = document.getElementById('topicDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: results.topics.map(t => t.topic),
            datasets: [{
                data: results.topics.map(t => t.weight || 5),
                backgroundColor: generateColors(results.topics.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

function updateSpeakersSection(results) {
    const speakersList = document.getElementById('speakersList');
    const speakerRolesChart = document.getElementById('speakerRolesChart');
    const sessionTypesChart = document.getElementById('sessionTypesChart');

    if (!speakersList || !speakerRolesChart || !sessionTypesChart) {
        console.error('Required elements not found');
        return;
    }

    if (!results.speakers || !Array.isArray(results.speakers)) {
        speakersList.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No speakers found in the document
            </div>
        `;
        return;
    }

    // Group speakers by topics
    const speakersByTopic = {};
    results.speakers.forEach(speaker => {
        if (speaker.topics && speaker.topics.length > 0) {
            speaker.topics.forEach(topic => {
                if (!speakersByTopic[topic]) {
                    speakersByTopic[topic] = [];
                }
                speakersByTopic[topic].push(speaker);
            });
        } else {
            if (!speakersByTopic['Other']) {
                speakersByTopic['Other'] = [];
            }
            speakersByTopic['Other'].push(speaker);
        }
    });

    // Create HTML for speakers grouped by topic
    speakersList.innerHTML = Object.entries(speakersByTopic)
        .map(([topic, speakers]) => `
            <div class="topic-group">
                <h3 class="topic-group-title">${topic}</h3>
                <div class="speakers-grid">
                    ${speakers.map(speaker => `
                        <div class="speaker-item card" onclick="toggleSpeakerDetails(this)">
                            <div class="card-body">
                                <div class="speaker-info">
                                    <h5 class="card-title">${speaker.name || 'Unknown Speaker'}</h5>
                                    <h6 class="card-subtitle text-muted">
                                        ${speaker.role || 'Role not specified'} · ${speaker.affiliation || 'Unknown affiliation'}
                                    </h6>
                                    <div class="speaker-details" style="display: none;">
                                        ${speaker.session ? `
                                            <div class="session-info">
                                                <strong>Session:</strong> ${speaker.session}
                                            </div>
                                        ` : ''}
                                        ${speaker.type ? `
                                            <div class="presentation-type">
                                                <strong>Type:</strong> ${speaker.type}
                                            </div>
                                        ` : ''}
                                        ${speaker.time ? `
                                            <div class="presentation-time">
                                                <strong>Time:</strong> ${speaker.time}
                                            </div>
                                        ` : ''}
                                        ${speaker.topics && speaker.topics.length > 0 ? `
                                            <div class="speaker-topics">
                                                <strong>Expertise:</strong>
                                                <div class="tags-container">
                                                    ${speaker.topics.map(topic =>
                                                        `<span class="tag">${topic}</span>`
                                                    ).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                        <button class="btn btn-sm btn-primary mt-2 btn-research"
                                                onclick="event.stopPropagation(); lookupSpeaker('${speaker.name}')">
                                            Research Speaker
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    // Create speaker role distribution chart
    const roleCount = {};
    results.speakers.forEach(speaker => {
        const role = speaker.role || 'Unspecified Role';
        roleCount[role] = (roleCount[role] || 0) + 1;
    });

    new Chart(speakerRolesChart, {
        type: 'pie',
        data: {
            labels: Object.keys(roleCount),
            datasets: [{
                data: Object.values(roleCount),
                backgroundColor: generateColors(Object.keys(roleCount).length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 11
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Speaker Roles Distribution',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            }
        }
    });

    // Create session types distribution chart
    const typeCount = {};
    results.speakers.forEach(speaker => {
        const type = speaker.type || 'Unspecified Type';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    new Chart(sessionTypesChart, {
        type: 'bar',
        data: {
            labels: Object.keys(typeCount),
            datasets: [{
                label: 'Number of Sessions',
                data: Object.values(typeCount),
                backgroundColor: generateColors(Object.keys(typeCount).length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Session Types Distribution',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Add toggle function for speaker details
function toggleSpeakerDetails(element) {
    const details = element.querySelector('.speaker-details');
    const wasHidden = details.style.display === 'none';

    // Hide all other expanded items
    document.querySelectorAll('.speaker-details').forEach(detail => {
        detail.style.display = 'none';
    });
    document.querySelectorAll('.speaker-item').forEach(item => {
        item.classList.remove('expanded');
    });

    // Show/hide clicked item
    if (wasHidden) {
        details.style.display = 'block';
        element.classList.add('expanded');
    }
}

function updateMSLSection(results) {
    const mslPrep = document.getElementById('mslPreparation');
    const kolList = document.getElementById('kolList');
    const prioritySessions = document.getElementById('prioritySessions');

    // Generate MSL preparation recommendations
    generateMSLPreparation(pdfText, results.speakers).then(recommendations => {
        if (mslPrep) {
            mslPrep.innerHTML = `
                <div class="msl-recommendations">
                    ${recommendations}
                </div>
            `;
        }
    });

    if (!results.speakers || !Array.isArray(results.speakers)) {
        kolList.innerHTML = '<div class="alert alert-info">No speakers found to analyze</div>';
        return;
    }

    // Sort speakers by relevance
    const sortedSpeakers = [...results.speakers].sort((a, b) =>
        (b.topics?.length || 0) - (a.topics?.length || 0)
    );

    // Update KOL List
    kolList.innerHTML = sortedSpeakers.slice(0, 5).map(speaker => `
        <div class="prep-item">
            <strong>${speaker.name || 'Unknown'}</strong>
            <p class="mb-1">${speaker.role || 'Role not specified'} at ${speaker.affiliation || 'Unknown affiliation'}</p>
            <small class="text-muted">Expert in: ${speaker.topics?.join(', ') || 'Topics not specified'}</small>
        </div>
    `).join('');

    // Update Priority Sessions
    if (!results.topics || !Array.isArray(results.topics)) {
        prioritySessions.innerHTML = '<div class="alert alert-info">No topics found to analyze</div>';
        return;
    }

    const sortedTopics = [...results.topics].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    prioritySessions.innerHTML = sortedTopics.slice(0, 5).map(topic => `
        <div class="prep-item">
            <strong>${topic.topic || 'Unnamed Topic'}</strong>
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-primary">Priority: ${topic.weight || 'N/A'}/10</span>
            </div>
            <p class="mb-1">${topic.description || 'No description available'}</p>
            <small class="text-muted">Related topics: ${topic.related?.join(', ') || 'None specified'}</small>
        </div>
    `).join('');
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360) / count;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }
    return colors;
}

function createTopicGraph(topics) {
    // Clear existing graph
    d3.select("#topicGraph").selectAll("*").remove();

    // Set up the SVG container with responsive dimensions
    const container = d3.select("#topicGraph");
    const width = container.node().getBoundingClientRect().width;
    const height = 500;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create nodes and links arrays
    const nodes = topics.map(topic => ({
        id: topic.topic,
        weight: topic.weight
    }));

    const links = [];
    topics.forEach(topic => {
        if (topic.related) {
            topic.related.forEach(related => {
                links.push({
                    source: topic.topic,
                    target: related
                });
            });
        }
    });

    // Create a force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30));

    // Add links
    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1);

    // Add nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
        .attr("r", d => Math.max(5, Math.min(20, d.weight * 20)))
        .attr("fill", d => d3.interpolateBlues(d.weight))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

    // Add labels to nodes
    node.append("text")
        .text(d => d.id)
        .attr("x", 0)
        .attr("y", d => -Math.max(5, Math.min(20, d.weight * 20)) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .style("font-size", "12px");

    // Update positions on each tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

async function researchSpeakerWithWebSearch(speaker) {
    try {
        const response = await fetch(`${BASE_URL}/api/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b',
                messages: [
                    {
                        role: "user",
                        content: `Research ${speaker.name} who is ${speaker.role || 'a speaker'} at ${speaker.affiliation || 'their organization'}.
Topics of interest: ${speaker.topics ? speaker.topics.join(', ') : 'Not specified'}`
                    }
                ],
                venice_parameters: {
                    enable_web_search: "auto",
                    include_venice_system_prompt: true,
                    character_slug: "venice"
                },
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`Speaker research API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return {
            profile: data.choices[0].message.content,
            sources: data.tool_results?.web_search || []
        };

    } catch (error) {
        console.error('Error researching speaker:', error);
        throw error;
    }
}

async function generateMSLPreparation(text, speakers) {
    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b',
                messages: [
                    {
                        role: "system",
                        content: `Create a comprehensive MSL preparation guide that includes:

1. Key Opinion Leaders (KOLs)
- List top KOLs with their expertise areas
- Highlight their recent research focus
- Note their speaking sessions

2. Priority Sessions
- List must-attend sessions
- Explain their relevance to MSLs
- Note potential discussion topics

3. Preparation Recommendations
- Specific topics to research
- Key papers to review
- Questions to prepare

Format the response in HTML with proper bold tags (<b>) for emphasis.`
                    },
                    {
                        role: "user",
                        content: `Conference Agenda: ${text}\n\nExtracted Speakers: ${JSON.stringify(speakers, null, 2)}`
                    }
                ],
                venice_parameters: {
                    enable_web_search: "auto",
                    include_venice_system_prompt: true,
                    character_slug: "venice"
                },
                temperature: 0.3,
                max_tokens: 3000,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0,
                repetition_penalty: 1.2
            })
        });

        if (!response.ok) {
            throw new Error(`MSL preparation API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Error generating MSL preparation:', error);
        throw error;
    }
}

// Research Bot Functions
function initializeResearchBot() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    // Add initial message
    addMessage({
        type: 'system',
        content: 'Welcome! Loading available models...'
    });

    // Check model availability
    checkModelAvailability().then(success => {
        if (success) {
            addMessage({
                type: 'system',
                content: 'Models loaded successfully. You can now ask questions about the conference content.'
            });
        } else {
            addMessage({
                type: 'system',
                content: 'Note: Using default models due to API availability issues. Basic functionality is still available.'
            });
        }
    }).catch(error => {
        console.error('Error during initialization:', error);
        addMessage({
            type: 'system',
            content: 'Warning: There was an issue loading models. Using default configuration.'
        });
    });

    // Event listeners
    if (chatInput && sendButton) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });

        sendButton.addEventListener('click', handleUserMessage);
    }
}

// Venice API Chat Functions
function initializeVeniceApiChat() {
    const veniceInput = document.getElementById('veniceApiInput');
    const veniceSendBtn = document.getElementById('veniceApiSend');
    const veniceModelSelect = document.getElementById('veniceApiModel');

    // Check model availability for Venice API Chat
    checkModelAvailability().then(availableModels => {
        if (availableModels.length === 0) {
            addVeniceMessage({
                type: 'system',
                content: 'Warning: No models are currently available. Please try again later.'
            });
        }
    });

    if (veniceInput && veniceSendBtn) {
        veniceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleVeniceApiMessage();
            }
        });

        veniceSendBtn.addEventListener('click', handleVeniceApiMessage);
    }
}

async function handleVeniceApiMessage() {
    const veniceInput = document.getElementById('veniceApiInput');
    const message = veniceInput.value.trim();

    if (!message) return;

    // Add user message to Venice chat
    addVeniceMessage({
        type: 'user',
        content: message
    });

    // Clear input
    veniceInput.value = '';

    // Add loading message
    const loadingId = addVeniceMessage({
        type: 'loading',
        content: 'Processing...'
    });

    try {
        // Get selected model
        const modelSelect = document.getElementById('veniceApiModel');
        const selectedModel = modelSelect.value;

        // Call Venice API
        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                tools: [{
                    type: "web_search",
                    config: {
                        provider: "google",
                        num_results: 5
                    }
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Remove loading message
        removeVeniceMessage(loadingId);

        // Add bot response
        addVeniceMessage({
            type: 'bot',
            content: data.choices[0].message.content,
            sources: data.tool_results?.web_search || []
        });

    } catch (error) {
        console.error('Error in Venice API chat:', error);
        removeVeniceMessage(loadingId);
        addVeniceMessage({
            type: 'system',
            content: 'Sorry, there was an error processing your request. Please try again.'
        });
    }
}

function addVeniceMessage({ type, content, sources = null }) {
    const chatMessages = document.getElementById('veniceApiMessages');
    const messageId = Date.now();

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.id = `venice-message-${messageId}`;

    if (type === 'loading') {
        messageElement.innerHTML = `
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            ${content}
        `;
    } else {
        let messageContent = content;

        // Add sources if available
        if (sources && sources.length > 0) {
            messageContent += `
                <div class="sources mt-2">
                    <h6 class="mb-2">Sources:</h6>
                    ${sources.map(source => `
                        <a href="${source.link}" target="_blank" rel="noopener noreferrer" class="d-block mb-1">
                            ${source.title}
                        </a>
                    `).join('')}
                </div>
            `;
        }

        messageElement.innerHTML = messageContent;

        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageElement.appendChild(timestamp);
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageId;
}

function removeVeniceMessage(messageId) {
    const message = document.getElementById(`venice-message-${messageId}`);
    if (message) {
        message.remove();
    }
}

// Add a function to check model availability
async function checkModelAvailability() {
    try {
        // Fetch available models from the API
        const apiModels = await fetchAvailableModels();

        // Create a combined list of models
        const allModels = [...DEFAULT_MODELS];

        // Update availability status of default models
        allModels.forEach(model => {
            model.isAvailable = apiModels.some(apiModel => apiModel.id === model.id);
        });

        // Add any additional models from the API
        apiModels.forEach(apiModel => {
            if (!allModels.some(m => m.id === apiModel.id)) {
                allModels.push({
                    id: apiModel.id,
                    name: apiModel.name || apiModel.id,
                    isAvailable: true
                });
            }
        });

        // Update the model selects with all available models
        updateModelSelects(allModels);
        return true;
    } catch (error) {
        console.error('Error checking model availability:', error);
        // Fall back to default models if there's an error
        updateModelSelects(DEFAULT_MODELS);
        return false;
    }
}

function updateModelSelects(models) {
    const modelSelects = ['researchModel', 'veniceApiModel']
        .map(id => document.getElementById(id))
        .filter(Boolean);

    modelSelects.forEach(select => {
        if (!select) return;

        // Clear existing options
        select.innerHTML = '';

        // Add only available models
        const availableModels = models.filter(model => model.isAvailable);

        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            option.selected = model.id === 'mixtral-8x7b';
            select.appendChild(option);
        });

        // If no models are available, add a default option
        if (select.options.length === 0) {
            const option = document.createElement('option');
            option.value = 'mixtral-8x7b';
            option.textContent = 'Mixtral 8x7B (Default)';
            select.appendChild(option);
        }
    });
}

function addMessage({ type, content, sources }) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageId = Date.now();

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.id = `message-${messageId}`;

    if (type === 'loading') {
        messageElement.innerHTML = `
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            ${content}
        `;
    } else if (type === 'bot') {
        // Format the bot's response with proper HTML
        let formattedContent = content
            // Convert markdown-style formatting to HTML
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert line breaks to HTML
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Format lists
            .replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>')
            .replace(/<li>(.*?)<\/li>(?:\s*<li>)/g, '<ul><li>$1</li><li>')
            .replace(/<\/li>\s*(?!<li>)/g, '</li></ul>');

        // Wrap in paragraph tags if not already wrapped
        if (!formattedContent.startsWith('<p>')) {
            formattedContent = `<p>${formattedContent}</p>`;
        }

        // Add sources if available
        if (sources && sources.length > 0) {
            formattedContent += `
                <div class="sources mt-3">
                    <h6 class="mb-2">Sources:</h6>
                    <ul class="source-list">
                        ${sources.map(source => `
                            <li>
                                <a href="${source.url}" target="_blank" rel="noopener noreferrer">
                                    ${source.title}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        messageElement.innerHTML = formattedContent;
    } else {
        messageElement.innerHTML = content;
    }

    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    messageElement.appendChild(timestamp);

    // Store in chat history
    if (type !== 'system') {
        chatHistory.push({ type, content });
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageId;
}

function removeMessage(messageId) {
    const message = document.getElementById(`message-${messageId}`);
    if (message) {
        message.remove();
    }
}

// Add handleUserMessage function
async function handleUserMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage({
        type: 'user',
        content: message
    });

    // Clear input
    chatInput.value = '';

    // Add loading message
    const loadingId = addMessage({
        type: 'loading',
        content: 'Researching...'
    });

    try {
        // Get selected model
        const modelSelect = document.getElementById('researchModel');
        const selectedModel = modelSelect.value || 'mixtral-8x7b';

        console.log(`Making API request with model: ${selectedModel}`);

        // Call Venice API
        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    {
                        role: "system",
                        content: `You are a research assistant specializing in analyzing conference content.
                        Provide detailed, accurate responses about conference topics, speakers, and sessions.
                        Format your responses with clear structure:
                        - Use paragraphs to separate ideas
                        - Use bullet points for lists
                        - Bold important terms or concepts
                        - Keep your response well-organized and easy to read`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                venice_parameters: {
                    enable_web_search: "auto"
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();

        // Remove loading message
        removeMessage(loadingId);

        // Add bot response
        addMessage({
            type: 'bot',
            content: data.choices[0].message.content,
            sources: data.venice_parameters?.web_search_citations || []
        });

    } catch (error) {
        console.error('Error in research:', error);
        removeMessage(loadingId);
        addMessage({
            type: 'system',
            content: `Error: ${error.message}. Please try again.`
        });
    }
}

function prepareContext(message) {
    // Implement the logic to prepare a context based on the chat history and selected topic
    // This is a placeholder and should be replaced with the actual implementation
    return message;
}

// Setup drag and drop functionality for file uploads
function setupDragAndDrop(dropZone, fileInput, selectedFileName) {
    const uploadStatus = document.createElement('div');
    uploadStatus.className = 'upload-status mt-3';
    dropZone.parentNode.insertBefore(uploadStatus, dropZone.nextSibling);

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', handleFileInputChange, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('drag-over');
        dropZone.classList.add('border-primary');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
        dropZone.classList.remove('border-primary');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileInputChange(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];

            if (file.type === 'application/pdf') {
                fileInput.files = files;
                // Update file name display
                selectedFileName.innerHTML = `
                    <div class="selected-file">
                        <i class="bi bi-file-pdf me-2"></i>
                        <span>${file.name}</span>
                    </div>
                `;
                selectedFileName.style.color = 'var(--success-color)';
                dropZone.classList.remove('border-danger');
                dropZone.classList.add('border-success');
                uploadStatus.innerHTML = `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle me-2"></i>
                        PDF successfully loaded: ${file.name}
                    </div>
                `;
            } else {
                selectedFileName.innerHTML = `
                    <div class="selected-file">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <span>Please select a PDF file</span>
                    </div>
                `;
                selectedFileName.style.color = 'var(--danger-color)';
                dropZone.classList.remove('border-success');
                dropZone.classList.add('border-danger');
                uploadStatus.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error: Please select a PDF file
                    </div>
                `;
                fileInput.value = '';
            }
        }
    }
}

// Function to load example agendas
async function loadExampleAgenda(filename) {
    try {
        // Fetch the example PDF file
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`Failed to load example agenda: ${response.statusText}`);
        }

        // Convert the response to a blob
        const blob = await response.blob();

        // Create a File object from the blob
        const file = new File([blob], filename, { type: 'application/pdf' });

        // Update the file input and selected file name display
        const fileInput = document.getElementById('pdfFile');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Update the UI to show the selected file
        const selectedFileName = document.getElementById('selectedFileName');
        const dropZone = document.getElementById('dropZone');

        selectedFileName.innerHTML = `
            <div class="selected-file">
                <i class="bi bi-file-pdf me-2"></i>
                <span>${filename}</span>
            </div>
        `;
        selectedFileName.style.color = 'var(--success-color)';
        dropZone.classList.remove('border-danger');
        dropZone.classList.add('border-success');

        // Add success message
        const uploadStatus = document.querySelector('.upload-status');
        if (uploadStatus) {
            uploadStatus.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    Example agenda loaded successfully: ${filename}
                </div>
            `;
        }

        // Automatically submit the form to start analysis
        document.getElementById('uploadForm').dispatchEvent(new Event('submit'));

    } catch (error) {
        console.error('Error loading example agenda:', error);
        const uploadStatus = document.querySelector('.upload-status');
        if (uploadStatus) {
            uploadStatus.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error loading example agenda: ${error.message}
                </div>
            `;
        }
    }
}

// Function to initialize the Deep Insights mockup charts
function initializeDeepInsightsCharts() {
    // Ensure DOM is ready before creating charts
    setTimeout(() => {
        // Abstract Submission Chart - Using a simple bar chart instead of line chart
        const abstractSubmissionCtx = document.getElementById('abstractSubmissionChart');
        if (abstractSubmissionCtx) {
            new Chart(abstractSubmissionCtx, {
                type: 'bar',
                data: {
                    labels: ['Total Submissions', 'Accepted', 'Rejected', 'Pending'],
                    datasets: [{
                        label: 'Abstract Submissions',
                        data: [56, 37, 14, 5],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(40, 167, 69, 0.7)',
                            'rgba(220, 53, 69, 0.7)',
                            'rgba(255, 193, 7, 0.7)'
                        ],
                        borderColor: [
                            'rgb(54, 162, 235)',
                            'rgb(40, 167, 69)',
                            'rgb(220, 53, 69)',
                            'rgb(255, 193, 7)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Abstract Submission Summary'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Abstracts'
                            }
                        }
                    }
                }
            });
        }

        // Abstract Status Chart - Keep as is
        const abstractStatusCtx = document.getElementById('abstractStatusChart');
        if (abstractStatusCtx) {
            new Chart(abstractStatusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Accepted', 'Rejected', 'Pending'],
                    datasets: [{
                        data: [37, 14, 5],
                        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Subspecialty Chart - Keep as is
        const subspecialtyCtx = document.getElementById('subspecialtyChart');
        if (subspecialtyCtx) {
            new Chart(subspecialtyCtx, {
                type: 'bar',
                data: {
                    labels: ['Breast', 'Lung', 'GI', 'Hematology', 'GU', 'Melanoma', 'Head & Neck'],
                    datasets: [{
                        label: 'Number of Abstracts',
                        data: [25, 22, 18, 15, 12, 8, 6],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Abstracts by Oncology Subspecialty'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Abstracts'
                            }
                        }
                    }
                }
            });
        }
    }, 100);
}

// Function to initialize the Competitive Intelligence mockup charts
function initializeCompetitiveIntelCharts() {
    // Ensure DOM is ready before creating charts
    setTimeout(() => {
        // Company Representation Chart
        const companyRepCtx = document.getElementById('companyRepChart');
        if (companyRepCtx) {
            new Chart(companyRepCtx, {
                type: 'bar',
                data: {
                    labels: ['Roche/Genentech', 'Merck', 'AstraZeneca', 'BMS', 'Pfizer', 'Novartis', 'GSK', 'Other'],
                    datasets: [{
                        label: 'Number of Abstracts',
                        data: [24, 22, 19, 17, 14, 10, 8, 15],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#C9CBCF', '#8A8A8A'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Company Representation in GI Oncology Abstracts'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Abstracts'
                            }
                        }
                    }
                }
            });
        }

        // Cancer Type Chart
        const cancerTypeCtx = document.getElementById('cancerTypeChart');
        if (cancerTypeCtx) {
            new Chart(cancerTypeCtx, {
                type: 'bar',
                data: {
                    labels: ['Colorectal', 'Gastric/GEJ', 'Pancreatic', 'Hepatocellular', 'Esophageal', 'Biliary'],
                    datasets: [
                        {
                            label: 'Phase I',
                            data: [5, 4, 3, 4, 2, 3],
                            backgroundColor: '#FF6384',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Phase II',
                            data: [8, 6, 7, 5, 4, 2],
                            backgroundColor: '#36A2EB',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Phase III',
                            data: [6, 5, 4, 3, 3, 2],
                            backgroundColor: '#FFCE56',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Phase IV',
                            data: [2, 1, 1, 0, 1, 0],
                            backgroundColor: '#4BC0C0',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Real-World Evidence',
                            data: [3, 2, 2, 1, 1, 1],
                            backgroundColor: '#9966FF',
                            stack: 'Stack 0'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Study Phases by GI Cancer Type'
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Studies'
                            }
                        }
                    }
                }
            });
        }

        // Mechanism of Action Chart
        const moaCtx = document.getElementById('moaChart');
        if (moaCtx) {
            new Chart(moaCtx, {
                type: 'radar',
                data: {
                    labels: ['PD-1/PD-L1', 'VEGF/VEGFR', 'HER2', 'FGFR', 'PARP', 'CTLA-4', 'MET'],
                    datasets: [
                        {
                            label: 'Abstracts Targeting MOA',
                            data: [28, 22, 15, 12, 10, 8, 6],
                            fill: true,
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgb(54, 162, 235)',
                            pointBackgroundColor: 'rgb(54, 162, 235)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgb(54, 162, 235)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    elements: {
                        line: {
                            borderWidth: 3
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0
                        }
                    }
                }
            });
        }

        // Biomarker Chart
        const biomarkerCtx = document.getElementById('biomarkerChart');
        if (biomarkerCtx) {
            new Chart(biomarkerCtx, {
                type: 'pie',
                data: {
                    labels: ['MSI/dMMR', 'HER2', 'BRAF', 'KRAS/NRAS', 'FGFR', 'Other'],
                    datasets: [{
                        data: [25, 20, 15, 13, 10, 17],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#C9CBCF'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
    }, 100);
}

// Function to initialize the Post-Congress mockup charts
function initializePostCongressCharts() {
    // Ensure DOM is ready before creating charts
    setTimeout(() => {
        // New Data Releases Chart
        const newDataReleasesCtx = document.getElementById('newDataReleasesChart');
        if (newDataReleasesCtx) {
            new Chart(newDataReleasesCtx, {
                type: 'bar',
                data: {
                    labels: ['Merck', 'Roche/Genentech', 'AstraZeneca', 'BMS', 'Pfizer', 'Novartis', 'GSK'],
                    datasets: [{
                        label: 'Previously Unreleased Data Points',
                        data: [38, 35, 32, 28, 25, 20, 18],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        title: {
                            display: true,
                            text: 'New Data Released by Company'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Data Points'
                            }
                        }
                    }
                }
            });
        }

        // MSL Insights Chart - Simplified to basic horizontal bar chart
        const mslInsightsCtx = document.getElementById('mslInsightsChart');
        if (mslInsightsCtx) {
            new Chart(mslInsightsCtx, {
                type: 'bar',
                data: {
                    labels: [
                        'Treatment Approaches',
                        'Biomarkers',
                        'Adverse Events',
                        'Pipeline Interest',
                        'Competitive Data',
                        'Patient Management'
                    ],
                    datasets: [{
                        label: 'Number of Mentions',
                        data: [35, 28, 22, 18, 15, 12],
                        backgroundColor: '#4BC0C0',
                        borderColor: '#2fa4a4',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'MSL-Reported Topics of Interest'
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Frequency in MSL Reports'
                            }
                        }
                    }
                }
            });
        }
    }, 100);
}

// Function to initialize navigation
function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Initialize charts when navigating to their respective sections
            if (section === 'deep-insights-section') {
                initializeDeepInsightsCharts();
            } else if (section === 'competitive-intel-section') {
                initializeCompetitiveIntelCharts();
            } else if (section === 'post-congress-section') {
                initializePostCongressCharts();
            }
        });
    });
}

// Handle AI Features phase selector
function initializeAIFeaturesSection() {
    document.querySelectorAll('.ai-features-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            showTab(targetId);
        });
    });

    // Show default tab
    document.getElementById('medical-affairs-tab').classList.add('active');
    document.getElementById('medical-affairs-content').style.display = 'block';

    // Initialize the phase content
    initializeTabPhaseContent();
}

function showTab(tabId) {
    // Hide all content divs
    document.querySelectorAll('.tab-content').forEach(div => {
        div.style.display = 'none';
    });

    // Remove active class from all tab links
    document.querySelectorAll('.ai-features-nav-item').forEach(link => {
        link.classList.remove('active');
    });

    // Show the specific content div and add active class to the clicked tab link
    document.getElementById(tabId + '-content').style.display = 'block';
    document.getElementById(tabId + '-tab').classList.add('active');
}

function initializeTabPhaseContent() {
    // Add event listeners to all phase selector buttons in the AI Features section
    document.querySelectorAll('.phase-selector .btn').forEach(button => {
        button.addEventListener('click', function() {
            // Get the selected phase (pre, on, post)
            const phase = this.getAttribute('data-phase');

            // Get the parent tab content container
            const tabContent = this.closest('.tab-content');

            // Remove active class from all buttons in this tab
            tabContent.querySelectorAll('.phase-selector .btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to clicked button
            this.classList.add('active');

            // Hide all phase contents in this tab
            tabContent.querySelectorAll('.phase-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show the selected phase content
            const phaseContent = tabContent.querySelector(`.phase-content[data-phase="${phase}"]`);
            if (phaseContent) {
                phaseContent.style.display = 'block';
            }
        });
    });

    // Activate pre-congress phase by default for all tabs
    document.querySelectorAll('.tab-content').forEach(tabContent => {
        // Find the pre-congress button in this tab
        const preCongressButton = tabContent.querySelector('.phase-selector .btn[data-phase="pre"]');
        if (preCongressButton) {
            // Simulate a click on the pre-congress button
            preCongressButton.classList.add('active');

            // Show the pre-congress phase content
            const preCongressContent = tabContent.querySelector('.phase-content[data-phase="pre"]');
            if (preCongressContent) {
                preCongressContent.style.display = 'block';
            }
        }
    });
}

// Initialize the application when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the navigation
    initializeNavigation();

    // Check API key and model availability
    checkApiKeyAndInitialize();

    // Initialize Research Bot
    initializeResearchBot();

    // Initialize Venice API Chat
    initializeVeniceApiChat();

    // Initialize mockup charts for the new sections immediately
    setTimeout(() => {
        initializeDeepInsightsCharts();
        initializeCompetitiveIntelCharts();
        initializePostCongressCharts();
    }, 500);

    // Initialize AI Features section
    initializeAIFeaturesSection();
});

// Helper functions for handleFileUpload
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function analyzeWebsiteContent(url, model) {
    // Construct a prompt to extract agenda info from the URL using Venice's web search/scraping capability
    const prompt = `Analyze the conference agenda found at this URL: ${url}.
    Extract the following information and format it exactly as shown:

### Key Highlights
- [Brief, impactful statements about the most important aspects]

### Topics
- Topic: [topic name]
- Weight: [number 1-10]
- Description: [brief description]
- Related: [comma-separated list of related topics]

### Therapeutic Areas
- Name: [therapeutic area name]
- Description: [description]
- Key Sessions: [relevant sessions]
- Featured Speakers: [key speakers]

### Key Themes
- Theme: [theme name]
- Description: [description]
- Related Sessions: [relevant session names]

### Speakers
- Name: [name]
- Role: [role]
- Affiliation: [organization]
- Topics: [topics]
`;

    const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            venice_parameters: {
                enable_web_search: "auto",
                enable_web_scraping: true
            }
        })
    });

    if (!response.ok) throw new Error('Website analysis failed');
    const data = await response.json();
    return parseAnalysisResponse(data.choices[0].message.content);
}

async function analyzeScreenshotContent(base64Image, model) {
    // Ensure we use a vision capable model
    const visionModel = 'qwen-2.5-vl'; // Force vision model or check capabilities

    const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
            model: visionModel,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this conference agenda image. Extract Key Highlights, Topics (with weight 1-10), Therapeutic Areas, Key Themes, and Speakers. Format with Markdown headers like ### Topics, ### Speakers, etc." },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) throw new Error('Screenshot analysis failed');
    const data = await response.json();
    return parseAnalysisResponse(data.choices[0].message.content);
}

function parseAnalysisResponse(content) {
    // Reuse the parsing logic from analyzePDFContent but separate it out
    const sections = content.split('###').filter(Boolean);
    const result = {
        highlights: [],
        topics: [],
        speakers: [],
        therapeuticAreas: [],
        themes: []
    };

    sections.forEach(section => {
        const [title, ...lines] = section.trim().split('\n');
        const cleanLines = lines.filter(line => line.trim() && line.trim().startsWith('-'));

        switch (title.trim()) {
            case 'Key Highlights':
                result.highlights = cleanLines.map(line => line.replace('- ', '').trim());
                break;
            case 'Topics':
                let currentTopic = {};
                cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Topic') {
                        if (Object.keys(currentTopic).length > 0) result.topics.push({...currentTopic});
                        currentTopic = {};
                    }
                    if (key) currentTopic[key.toLowerCase()] = value;
                });
                if (Object.keys(currentTopic).length > 0) result.topics.push(currentTopic);
                break;
            case 'Speakers': // Handle Speakers explicitly if present in main analysis
                 let currentSpeaker = {};
                 cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Name') {
                        if (Object.keys(currentSpeaker).length > 0) result.speakers.push({...currentSpeaker});
                        currentSpeaker = {};
                    }
                    if (key) currentSpeaker[key.toLowerCase()] = value;
                 });
                 if (Object.keys(currentSpeaker).length > 0) result.speakers.push(currentSpeaker);
                 break;
            // ... (Add other cases or reuse existing logic if refactored)
            case 'Therapeutic Areas':
                let currentArea = {};
                cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Name') {
                        if (Object.keys(currentArea).length > 0) result.therapeuticAreas.push({...currentArea});
                        currentArea = {};
                    }
                    if (key === 'Featured Speakers' || key === 'Key Sessions') {
                        currentArea[key.toLowerCase()] = value.split(',').map(item => item.trim());
                    } else {
                        currentArea[key.toLowerCase()] = value;
                    }
                });
                if (Object.keys(currentArea).length > 0) result.therapeuticAreas.push(currentArea);
                break;
            case 'Key Themes':
                cleanLines.forEach(line => {
                    const [key, value] = line.replace('- ', '').split(': ');
                    if (key === 'Theme') {
                        result.themes.push({ name: value, description: '', relatedSessions: [] });
                    } else if (key === 'Description' && result.themes.length > 0) {
                        result.themes[result.themes.length - 1].description = value;
                    } else if (key === 'Related Sessions' && result.themes.length > 0) {
                        result.themes[result.themes.length - 1].relatedSessions = value.split(',').map(s => s.trim());
                    }
                });
                break;
        }
    });
    return result;
}

async function generateSummaryFromResults(results, model) {
    // Generate a summary text from the structured results if raw text isn't available
    const summaryPrompt = `Generate a conference summary based on these highlights: ${JSON.stringify(results.highlights)} and themes: ${JSON.stringify(results.themes)}`;

    const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: summaryPrompt }]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

// Redefined handleFileUpload to support tabs
async function handleFileUpload(event) {
    event.preventDefault();

    // Determine active tab
    const activeTab = document.querySelector('.nav-link.active[data-bs-toggle="tab"]');
    const activeTabId = activeTab ? activeTab.id : 'pdf-tab';

    const uploadStatus = document.querySelector('.upload-status');
    const progressContainer = document.getElementById('uploadProgress');
    const modelSelect = document.getElementById('modelSelect');
    const selectedModel = modelSelect?.value || 'mixtral-8x7b';

    // Initialize progress tracking
    if (progressContainer) {
        progressContainer.innerHTML = `
            <div class="progress-container">
                <div class="progress-circle-container">
                    <div class="progress-circle">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="progress-ring__circle" stroke="currentColor" stroke-width="4" fill="transparent" r="52" cx="60" cy="60"/>
                        </svg>
                        <div class="progress-text">0%</div>
                    </div>
                    <div class="progress-status">Starting...</div>
                </div>
                <div class="current-file mt-3">
                    <i class="bi bi-gear-wide-connected me-2"></i>
                    Processing Request
                </div>
            </div>
        `;
        progressContainer.style.display = 'block';
        progressContainer.classList.remove('d-none');
    }

    const circle = progressContainer?.querySelector('.progress-ring__circle');
    const radius = circle ? circle.r.baseVal.value : 52;
    const circumference = radius * 2 * Math.PI;

    if (circle) {
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference;
    }

    function setProgress(percent, status) {
        if (!progressContainer) return;
        const offset = circumference - (percent / 100 * circumference);
        if (circle) circle.style.strokeDashoffset = offset;
        progressContainer.querySelector('.progress-text').textContent = `${Math.round(percent)}%`;
        progressContainer.querySelector('.progress-status').textContent = status;
    }

    try {
        let extractedText = '';
        let analysisResults = null;
        let summary = '';

        if (activeTabId === 'website-tab') {
            const urlInput = document.getElementById('websiteUrl');
            const url = urlInput.value.trim();
            if (!url) throw new Error('Please enter a valid URL');

            setProgress(30, 'Analyzing website...');
            // For website, we ask Venice to research the URL
            analysisResults = await analyzeWebsiteContent(url, selectedModel);
            extractedText = `Website Analysis of ${url}`; // Placeholder

        } else if (activeTabId === 'screenshot-tab') {
            const fileInput = document.getElementById('screenshotFile');
            const file = fileInput.files[0];
            if (!file) throw new Error('Please select an image file');

            setProgress(30, 'Analyzing screenshot...');
            const base64Image = await fileToBase64(file);
            analysisResults = await analyzeScreenshotContent(base64Image, selectedModel);
            extractedText = "Screenshot Analysis"; // Placeholder

        } else {
            // PDF Handling
            const fileInput = document.getElementById('pdfFile');
            const file = fileInput.files[0];
            if (!file) throw new Error('Please select a PDF file');

            setProgress(25, 'Extracting text...');
            extractedText = await extractTextFromPDF(file);

            if (!extractedText || extractedText.trim().length === 0) {
                throw new Error('No text extracted from PDF. It might be image-based.');
            }

            setProgress(50, 'Analyzing content...');
            analysisResults = await analyzePDFContent(extractedText, selectedModel);
        }

        // Store global text for other functions
        pdfText = extractedText;

        setProgress(75, 'Generating summary...');
        if (!summary && activeTabId === 'pdf-tab') {
             summary = await generateAgendaSummary(extractedText, selectedModel);
        } else {
             // For website/screenshot, the analysis might already include summary or we generate one from results
             summary = await generateSummaryFromResults(analysisResults, selectedModel);
        }

        setProgress(100, 'Complete!');
        processResults(analysisResults, summary);

        // Switch to summary section
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('[data-section="summary-section"]').classList.add('active');
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById('summary-section').style.display = 'block';

        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('d-none');
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
        document.querySelector('#uploadForm').appendChild(errorDiv);

        if (progressContainer) {
            setProgress(100, 'Error!');
            if (circle) circle.style.stroke = 'var(--danger-color)';
            setTimeout(() => progressContainer.classList.add('d-none'), 2000);
        }
    }
}

// Add function for Medical Affairs Congress Plan
async function generateCongressPlan() {
    const contentDiv = document.getElementById('congressPlanContent');
    const model = document.getElementById('modelSelect')?.value || 'llama-3.3-70b';

    // Check if we have data to work with
    if (!extractedTopics.length && !extractedSpeakers.length && !pdfText) {
        contentDiv.innerHTML = '<div class="alert alert-warning">Please analyze an agenda first.</div>';
        return;
    }

    contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Generating Medical Affairs Congress Plan...</p></div>';

    try {
        const prompt = `Based on the conference agenda information below, create a comprehensive Medical Affairs Congress Plan.

        Information:
        - Key Topics: ${JSON.stringify(extractedTopics.slice(0, 10))}
        - Key Speakers: ${JSON.stringify(extractedSpeakers.slice(0, 10))}
        - Therapeutic Areas: ${JSON.stringify(therapeuticAreas)}

        Please generate a plan with the following sections in HTML format:
        1. **Executive Summary**: High-level overview of the congress value for Medical Affairs.
        2. **Key Scientific Themes**: The major scientific pillars to focus on.
        3. **KOL Engagement Plan**: Prioritized list of KOLs to engage and suggested topics.
        4. **Competitive Intelligence Objectives**: What to look for regarding competitors.
        5. **Session Prioritization**: "Must-attend" sessions for the Medical team.
        6. **Post-Congress Action Items**: Immediate steps to take after the event.

        Format as clear HTML with <h3> headers and lists.`;

        const response = await fetch(`${API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VENICE_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) throw new Error('Failed to generate plan');

        const data = await response.json();
        let planHtml = data.choices[0].message.content;

        // Basic Markdown to HTML conversion if needed (Venice often returns Markdown)
        planHtml = planHtml
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/\n- (.*?)/g, '<li>$1</li>')
            .replace(/<\/li>\n<li>/g, '</li><li>')
            .replace(/\n\n/g, '<br><br>');

        contentDiv.innerHTML = planHtml;

    } catch (error) {
        console.error("Error generating plan:", error);
        contentDiv.innerHTML = `<div class="alert alert-danger">Error generating plan: ${error.message}</div>`;
    }
}