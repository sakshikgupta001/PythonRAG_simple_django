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
            <section class="upload-section">
                <h2>Upload Documents</h2>
                <label for="fileInput" class="file-label">
                    <input type="file" id="fileInput" multiple accept=".pdf,.docx,.doc,.txt,.rtf,.ppt,.pptx" />
                    <span>Select Files</span>
                </label>
                <div id="file-list" class="file-list-display">No files selected</div>
                <button id="uploadButton" class="button button-primary">
                    <span class="button-text">Upload</span>
                    <span class="spinner"></span>
                </button>
                <div id="uploadStatus"></div>
            </section>
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
function animateProgress(progressBar, targetWidth, duration = 500) {
    const startWidth = parseFloat(progressBar.style.width) || 0;
    const change = targetWidth - startWidth;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progressRatio = Math.min(elapsed / duration, 1); // Ensure progress doesn't exceed 1
        const currentWidth = startWidth + change * progressRatio;
        progressBar.style.width = `${currentWidth}%`;

        if (elapsed < duration) {
            requestAnimationFrame(step);
        } else {
            progressBar.style.width = `${targetWidth}%`; // Ensure final target width
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

    fileInput.addEventListener("change", () => {
        const files = fileInput.files;
        if (files.length > 0) {
            let fileSpans = Array.from(files).map(file => `<span>${file.name}</span>`).join('');
            fileListDisplay.innerHTML = fileSpans;
        } else {
            fileListDisplay.textContent = "No files selected";
        }
        uploadStatus.innerHTML = ''; // Clear status on new selection
    });

    uploadButton.addEventListener("click", async () => {
        const files = fileInput.files;
        if (!files.length) {
            alert("Please select at least one file.");
            return;
        }

        uploadButton.classList.add('loading');
        uploadButton.disabled = true;
        fileInput.disabled = true;

        // Prepare UI: Show progress bar container and initial status
        uploadStatus.innerHTML = `
            <p class="status-text">Preparing upload...</p>
            <div class="progress-bar">
                <div class="progress" style="width: 0%;"></div>
            </div>`;
        const progressBar = uploadStatus.querySelector('.progress');
        const statusText = uploadStatus.querySelector('.status-text');

        let overallProgress = 0;
        const totalFiles = files.length;
        // Allocate ~95% for file uploads, 5% for finalization
        const progressPerFile = totalFiles > 0 ? 95 / totalFiles : 0;

        try {
            for (let i = 0; i < totalFiles; i++) {
                const file = files[i];
                const targetProgressForFile = overallProgress + progressPerFile;

                statusText.textContent = `Uploading ${file.name} (${i + 1} of ${totalFiles})...`;

                // --- Simulate progress during the fetch ---
                // Start animating towards the target progress for this file
                // Adjust duration based on expected upload time or keep fixed
                animateProgress(progressBar, targetProgressForFile, 1000); // Simulate 1 sec per file upload
                // ---

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

                // Ensure progress bar reaches the target for this file upon success
                progressBar.style.width = `${targetProgressForFile}%`;
                overallProgress = targetProgressForFile; // Update overall progress
            }

            // Finalization step
            statusText.textContent = "Finalizing...";
            animateProgress(progressBar, 100, 300); // Animate to 100% quickly

            // Short delay before showing success message
            await new Promise(resolve => setTimeout(resolve, 400));

            let uploadedFileNames = Array.from(files).map(file => file.name).join(', ');
            // Replace progress bar with success message
            uploadStatus.innerHTML = `<p class="success-message">Successfully uploaded: ${uploadedFileNames}</p>`;
            fileInput.value = '';
            fileListDisplay.textContent = "No files selected";

        } catch (error) {
            console.error("Error uploading document:", error);
            // Show error message and make progress bar red
            uploadStatus.innerHTML = `
                <p class="error-message">${error.message || 'Upload failed. Please try again.'}</p>
                <div class="progress-bar">
                    <div class="progress error" style="width: 100%;"></div>
                </div>`;
        } finally {
            uploadButton.classList.remove('loading');
            uploadButton.disabled = false;
            fileInput.disabled = false;
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

        // Convert * bullet points to <ul><li>...</li></ul>
        // Split into lines, process lines starting with *, wrap in <ul>
        const lines = formattedText.split('\n');
        let htmlContent = '';
        let inList = false;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ')) {
                if (!inList) {
                    htmlContent += '<ul>';
                    inList = true;
                }
                // Remove the '* ' prefix and trim
                htmlContent += `<li>${trimmedLine.substring(2).trim()}</li>`;
            } else {
                if (inList) {
                    htmlContent += '</ul>';
                    inList = false;
                }
                // Add non-list lines as paragraphs (or divs)
                if (trimmedLine.length > 0) {
                    htmlContent += `<p>${trimmedLine}</p>`;
                } else {
                    // Preserve empty lines potentially for spacing, or skip
                     htmlContent += '<br>'; // Or just continue
                }
            }
        });
        // Close list if the text ends with list items
        if (inList) {
            htmlContent += '</ul>';
        }

        // If no list was created and the content is simple, wrap in <p>
        if (!htmlContent.includes('<ul>') && !htmlContent.includes('<p>') && formattedText.trim().length > 0) {
             htmlContent = `<p>${formattedText.trim()}</p>`;
        } else if (htmlContent.startsWith('<br>')) {
            // Avoid starting with a line break if the first line was empty
            htmlContent = htmlContent.substring(4);
        }


        return htmlContent;
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