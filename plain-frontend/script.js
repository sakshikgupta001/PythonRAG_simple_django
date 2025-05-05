const API_BASE_URL = "http://127.0.0.1:8000";

// Handle file upload
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");

uploadButton.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
        alert("Please select at least one file.");
        return;
    }

    uploadStatus.textContent = "Uploading...";

    try {
        for (const file of files) {
            const formData = new FormData();
            formData.append("pdf_file", file);

            const response = await fetch(`${API_BASE_URL}/api/upload/`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to upload document.");
            }

            uploadStatus.textContent = `Uploaded: ${file.name}`;
        }
    } catch (error) {
        console.error("Error uploading document:", error);
        uploadStatus.textContent = "Upload failed. Please try again.";
    }
});

// Handle chat
const sendButton = document.getElementById("sendButton");
const chatInput = document.getElementById("chatInput");
const chatWindow = document.getElementById("chatWindow");

sendButton.addEventListener("click", async () => {
    const query = chatInput.value.trim();
    if (!query) {
        alert("Please enter a question.");
        return;
    }

    const userMessage = document.createElement("div");
    userMessage.textContent = `You: ${query}`;
    chatWindow.appendChild(userMessage);

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
        assistantMessage.textContent = `Assistant: ${result.response}`;
        chatWindow.appendChild(assistantMessage);
    } catch (error) {
        console.error("Error querying documents:", error);
        const errorMessage = document.createElement("div");
        errorMessage.textContent = "Error: Unable to fetch response.";
        chatWindow.appendChild(errorMessage);
    }
});