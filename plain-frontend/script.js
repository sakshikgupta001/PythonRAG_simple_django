const API_BASE_URL = "http://127.0.0.1:8000";

const app = document.getElementById("app");

const routes = {
    home: `
        <div class="container">
            <section class="home-section">
                <h1>Welcome to <span class="neon-pink">TextAssist</span></h1>
                <p class="tagline">Upload your documents and converse with AI.</p>
                <div class="features">
                    <div class="feature-item">Upload Notes, PDF, Documents & Presentations</div>
                    <div class="feature-item">Ask Questions</div>
                    <div class="feature-item">Get AI Answers</div>
                </div>
            </section>
        </div>
    `,
    upload: `
        <div class="container">
            <section class="upload-section"> <!-- Added section wrapper for consistency -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Upload Documents</h2>
                        <p class="card-description">Upload your documents (PDF, DOCX, TXT, etc.) to chat with them. Max size: 200MB.</p>
                    </div>
                    <div class="card-content">
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>
                            <div class="upload-text">
                                <p class="upload-title" id="uploadTitleLabel">Click to upload or drag & drop</p>
                                <p class="upload-subtitle" id="uploadSubtitleLabel">Allowed: .pdf, .docx, .doc, .txt, .rtf, .ppt, .pptx</p>
                            </div>
                            <input type="file" id="fileInput" multiple accept=".pdf,.docx,.doc,.txt,.rtf,.ppt,.pptx" class="file-input" aria-labelledby="uploadTitleLabel uploadSubtitleLabel">
                        </div>
                        <div class="file-list-container" id="fileListContainer" style="display: none;">
                            <p class="file-list-title">Selected files:</p>
                            <div id="file-list" class="file-list"></div>
                        </div>
                        <div id="uploadStatus" class="progress-container">
                            <!-- JS will inject progress or status messages here -->
                        </div>
                    </div>
                    <div class="card-footer">
                        <button id="uploadButton" class="button button-primary upload-button" disabled>
                            <svg class="button-icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span class="button-text">Upload Documents</span>
                            <span class="spinner"></span> <!-- Existing spinner -->
                        </button>
                    </div>
                </div>
            </section> <!-- End of section wrapper -->
        </div>
    `,
    chat: `
        <div class="container">
            <section class="chat-section">
                <h2>Chat Interface</h2>
                <div id="chatWindow">
                    <div class="chat-message system-message">Initiate conversation below...</div>
                </div>
                <div class="chat-input-area">
                    <textarea id="chatInput" placeholder="Type your query here..."></textarea>
                    <button id="sendButton" class="button button-primary">
                        <span class="button-text">Send</span>
                        <span class="spinner"></span>
                    </button>
                </div>
            </section>
        </div>
    `,
};

function navigateTo(route) {
    app.innerHTML = routes[route];

    // --- Add Active Nav Link Styling ---
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${route}`) {
            link.classList.add('active');
        }
    });
    // ---

    if (route === "upload") setupUpload();
    if (route === "chat") setupChat();
}

// --- Helper function for smooth progress animation ---
function animateProgress(progressBar, targetWidth, duration = 500, percentageElement) { // Added percentageElement
    const startWidth = parseFloat(progressBar.style.width) || 0;
    const change = targetWidth - startWidth;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        const currentWidth = startWidth + change * progressRatio;
        progressBar.style.width = `${currentWidth}%`;
        if (percentageElement) { // Update percentage text
            percentageElement.textContent = `${Math.round(currentWidth)}%`;
        }

        if (elapsed < duration) {
            requestAnimationFrame(step);
        } else {
            progressBar.style.width = `${targetWidth}%`;
            if (percentageElement) { // Ensure final percentage text
                percentageElement.textContent = `${Math.round(targetWidth)}%`;
            }
        }
    }
    requestAnimationFrame(step);
}
// ---

function setupUpload() {
    const uploadButton = document.getElementById("uploadButton");
    const fileInput = document.getElementById("fileInput");
    const uploadStatus = document.getElementById("uploadStatus");
    const fileListDisplay = document.getElementById("file-list");
    const uploadArea = document.getElementById("uploadArea");
    const fileListContainer = document.getElementById("fileListContainer");
    const buttonText = uploadButton.querySelector('.button-text');

    let selectedFilesArray = []; // To store selected File objects

    function renderSelectedFiles() {
        if (selectedFilesArray.length > 0) {
            let fileItemsHTML = selectedFilesArray.map((file, index) => {
                // Simple remove icon (SVG for 'x')
                const removeIconSvg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="remove-icon-svg">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>`;
                return `
                    <div class="file-item">
                        <div class="file-info">
                            <span class="file-name" title="${file.name}">${file.name}</span>
                        </div>
                        <button class="remove-button" data-file-index="${index}" aria-label="Remove ${file.name}">
                            ${removeIconSvg}
                        </button>
                    </div>
                `;
            }).join('');
            fileListDisplay.innerHTML = fileItemsHTML;
            fileListContainer.style.display = 'block';
            uploadButton.disabled = false;
            if (buttonText) buttonText.textContent = `Upload ${selectedFilesArray.length} File(s)`;

            // Add event listeners to new remove buttons
            document.querySelectorAll('.remove-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const indexToRemove = parseInt(event.currentTarget.getAttribute('data-file-index'));
                    selectedFilesArray.splice(indexToRemove, 1);
                    fileInput.value = ''; // Clear the actual file input's selection
                    renderSelectedFiles(); // Re-render the list
                });
            });

        } else {
            fileListDisplay.innerHTML = "";
            fileListContainer.style.display = 'none';
            uploadButton.disabled = true;
            if (buttonText) buttonText.textContent = "Upload Documents";
        }
    }

    if (uploadArea) {
        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            if (uploadStatus) uploadStatus.innerHTML = ''; // Clear previous status/progress
            uploadArea.classList.remove('dragover');
            const droppedFiles = Array.from(event.dataTransfer.files);
            let newFilesAdded = false;
            if (droppedFiles.length > 0) {
                droppedFiles.forEach(file => {
                    const isDuplicate = selectedFilesArray.some(existingFile => 
                        existingFile.name === file.name && 
                        existingFile.size === file.size && 
                        existingFile.lastModified === file.lastModified
                    );
                    if (!isDuplicate) {
                        selectedFilesArray.push(file);
                        newFilesAdded = true;
                    }
                });
                if (newFilesAdded) {
                    renderSelectedFiles();
                }
            }
        });
    }

    fileInput.addEventListener("change", () => {
        if (uploadStatus) uploadStatus.innerHTML = ''; // Clear previous status/progress
        const newFiles = Array.from(fileInput.files);
        let newFilesAddedToSelection = false;
        if (newFiles.length > 0) {
            newFiles.forEach(file => {
                const isDuplicate = selectedFilesArray.some(existingFile => 
                    existingFile.name === file.name && 
                    existingFile.size === file.size && 
                    existingFile.lastModified === file.lastModified
                );
                if (!isDuplicate) {
                    selectedFilesArray.push(file);
                    newFilesAddedToSelection = true;
                }
            });
            
            if (newFilesAddedToSelection) {
                renderSelectedFiles();
            }
            // Clear the file input value to allow re-selecting the same file(s) 
            // or to ensure the change event fires for subsequent selections.
            fileInput.value = ''; 
        }
    });

    uploadButton.addEventListener("click", async () => {
        // Use selectedFilesArray instead of fileInput.files
        if (!selectedFilesArray.length) {
            alert("Please select at least one file.");
            return;
        }

        uploadButton.classList.add('loading');
        uploadButton.disabled = true;
        fileInput.disabled = true;
        if (uploadArea) uploadArea.style.pointerEvents = 'none';

        uploadStatus.innerHTML = `
            <div class="progress-info">
                <span class="status-text-element">Preparing upload...</span>
                <span class="progress-percentage-element">0%</span>
            </div>
            <div class="progress-bar-outer">
                <div class="progress-bar-inner" style="width: 0%;"></div>
            </div>`;
        const progressBar = uploadStatus.querySelector('.progress-bar-inner');
        const statusTextElement = uploadStatus.querySelector('.status-text-element');
        const progressPercentageElement = uploadStatus.querySelector('.progress-percentage-element');

        let overallProgress = 0;
        const totalFiles = selectedFilesArray.length; // Use array length
        const progressPerFile = totalFiles > 0 ? 95 / totalFiles : 0;

        try {
            for (let i = 0; i < totalFiles; i++) {
                const file = selectedFilesArray[i]; // Use file from array
                const targetProgressForFile = overallProgress + progressPerFile;

                if (statusTextElement) statusTextElement.textContent = `Uploading ${file.name} (${i + 1} of ${totalFiles})...`;
                
                // Simulate upload delay for each file before calling API
                // In a real scenario, animateProgress might be called with actual progress from XHR/fetch
                await new Promise(resolve => setTimeout(resolve, 200)); // Short delay before "API call"
                animateProgress(progressBar, targetProgressForFile - (progressPerFile / 2), 300, progressPercentageElement); // Animate to partial progress for the file

                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch(`${API_BASE_URL}/api/upload/`, {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `Failed to upload ${file.name}.`);
                }
                
                // Animate to full progress for this file after successful API call
                animateProgress(progressBar, targetProgressForFile, 300, progressPercentageElement);
                overallProgress = targetProgressForFile;
            }

            if (statusTextElement) statusTextElement.textContent = "Finalizing...";
            animateProgress(progressBar, 100, 300, progressPercentageElement);

            await new Promise(resolve => setTimeout(resolve, 400)); // Wait for final animation

            // Update status text to success, keep progress bar structure
            const uploadedFileNames = selectedFilesArray.map(f => f.name).join(', ');
            if (statusTextElement) statusTextElement.textContent = `Successfully uploaded: ${uploadedFileNames}`;
            if (progressPercentageElement) progressPercentageElement.textContent = "100%";
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.classList.add('success'); // Add success class for styling
            }
            
            // Reset file input and our array for next use
            fileInput.value = ''; 
            selectedFilesArray = [];
            renderSelectedFiles(); 
            
            // Toast has been removed as per request

        } catch (error) {
            console.error("Error uploading document:", error);
            uploadStatus.innerHTML = `
                <p class="error-message">${error.message || 'Upload failed. Please try again.'}</p>
                <div class="progress-bar-outer error">
                    <div class="progress-bar-inner error" style="width: 100%;"></div>
                </div>`;
        } finally {
            uploadButton.classList.remove('loading');
            // renderSelectedFiles() called in try/catch will handle button state,
            // but ensure inputs are re-enabled if something went wrong before that.
            fileInput.disabled = false;
            if (uploadArea) uploadArea.style.pointerEvents = 'auto';
            // Explicitly call renderSelectedFiles here if not cleared by success/error paths
            // to ensure UI consistency if an early exit happened in the try block before full processing.
            if (selectedFilesArray.length > 0) {
                uploadButton.disabled = false;
            } else {
                uploadButton.disabled = true;
                if (buttonText) buttonText.textContent = "Upload Documents";
            }
        }
    });
}

function setupChat() {
    const sendButton = document.getElementById("sendButton");
    const chatInput = document.getElementById("chatInput");
    const chatWindow = document.getElementById("chatWindow");

    // --- Helper function to parse Markdown-like text to HTML ---
    function formatAssistantResponse(text) {
        // Remove "Assistant: " prefix if present
        let formattedText = text.startsWith("Assistant: ") ? text.substring(11) : text;

        // Convert **bold** to <strong>bold</strong>
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        const lines = formattedText.split('\n');
        let htmlContent = '';
        let inList = false;
        let currentParagraph = '';

        function flushParagraph() {
            if (currentParagraph) {
                htmlContent += `<p>${currentParagraph}</p>`;
                currentParagraph = '';
            }
        }

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ')) {
                flushParagraph(); // End current paragraph before starting a list
                if (!inList) {
                    htmlContent += '<ul>';
                    inList = true;
                }
                // Remove the '* ' prefix and trim, then process for bold
                let listItemContent = trimmedLine.substring(2).trim();
                htmlContent += `<li>${listItemContent}</li>`;
            } else { // Not a list item
                if (inList) { // If we were in a list, end it
                    htmlContent += '</ul>';
                    inList = false;
                }
                if (trimmedLine.length > 0) {
                    if (currentParagraph) {
                        currentParagraph += '<br>' + trimmedLine; // Add as part of current paragraph with a line break
                    } else {
                        currentParagraph = trimmedLine;
                    }
                } else { // Empty line indicates a paragraph break
                    flushParagraph();
                }
            }
        });

        flushParagraph(); // Flush any remaining paragraph
        if (inList) { // Close list if it's the last thing
            htmlContent += '</ul>';
        }
        
        // If after all processing, htmlContent is empty (e.g. input was only spaces or empty lines)
        // return a non-breaking space in a paragraph to ensure the div has some content and is visible.
        return htmlContent.trim() ? htmlContent : '<p>&nbsp;</p>';
    }
    // ---

    sendButton.addEventListener("click", async () => {
        const query = chatInput.value.trim();
        if (!query) {
            alert("Please enter a question.");
            return;
        }

        sendButton.classList.add('loading');
        sendButton.disabled = true;
        chatInput.disabled = true;

        const userMessage = document.createElement("div");
        userMessage.className = "chat-message user-message";
        // Use textContent for user messages to prevent XSS
        userMessage.textContent = query; // Display raw query
        chatWindow.appendChild(userMessage);
        userMessage.scrollIntoView({ behavior: "smooth", block: "end" });

        chatInput.value = "";

        try {
            const response = await fetch(`${API_BASE_URL}/api/query/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to fetch response.");
            }

            const assistantMessage = document.createElement("div");
            assistantMessage.className = "chat-message assistant-message";
            // --- Use the formatting function and innerHTML ---
            assistantMessage.innerHTML = formatAssistantResponse(result.response);
            // ---
            chatWindow.appendChild(assistantMessage);
            assistantMessage.scrollIntoView({ behavior: "smooth", block: "end" });

        } catch (error) {
            console.error("Error querying documents:", error);
            const errorMessage = document.createElement("div");
            // Use the specific class for error styling
            errorMessage.className = "chat-message error-message";
            errorMessage.textContent = `Error: ${error.message || 'Unable to fetch response.'}`;
            chatWindow.appendChild(errorMessage);
            errorMessage.scrollIntoView({ behavior: "smooth", block: "end" });
        } finally {
            sendButton.classList.remove('loading');
            sendButton.disabled = false;
            chatInput.disabled = false;
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });
}

// --- Update Nav Link Listener ---
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const route = e.target.getAttribute("href").substring(1);
        navigateTo(route); // navigateTo now handles the active class
    });
});
// ---

// Initialize
navigateTo("home"); // Load home and set initial active link