document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const documentsList = document.getElementById('documents-list');
    const documentsLoading = document.getElementById('documents-loading');
    const selectedCount = document.getElementById('selected-count');
    const chatMessages = document.getElementById('chat-messages');
    const emptyChat = document.getElementById('empty-chat');
    const queryForm = document.getElementById('query-form');
    const queryInput = document.getElementById('query-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceToggleBtn = document.getElementById('voice-toggle-btn');
    const micIcon = voiceToggleBtn.querySelector('.mic-icon');
    const micOffIcon = voiceToggleBtn.querySelector('.mic-off-icon');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const queryStatus = document.getElementById('query-status');
    
    // State
    let documents = [];
    let selectedDocIds = [];
    let messages = [];
    let isLoading = false;
    let isListening = false;
    let isSpeaking = false;
    let recognition = null;
    let synth = window.speechSynthesis;
    
    // Initialize
    initSpeechRecognition();
    fetchDocuments();
    
    // Event Listeners
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
    
    queryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmit();
    });
    
    queryInput.addEventListener('input', () => {
        sendBtn.disabled = !queryInput.value.trim() || isLoading;
        
        // Auto-resize textarea
        queryInput.style.height = 'auto';
        queryInput.style.height = queryInput.scrollHeight + 'px';
    });
    
    voiceToggleBtn.addEventListener('click', toggleListening);
    downloadBtn.addEventListener('click', downloadConversation);
    clearBtn.addEventListener('click', clearConversation);
    
    // Functions
    function initSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                queryInput.value = transcript;
                queryInput.dispatchEvent(new Event('input'));
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                isListening = false;
                updateVoiceToggleUI();
                showToast('Voice Input Error', `Error: ${event.error}. Please try again.`, 'error');
            };
        }
    }
    
    function fetchDocuments() {
        // Simulate API call
        setTimeout(() => {
            documents = [
                { id: '1', name: 'Annual Report 2023.pdf', type: 'pdf', uploadDate: new Date(2023, 11, 15) },
                { id: '2', name: 'Project Proposal.docx', type: 'docx', uploadDate: new Date(2023, 10, 22) },
                { id: '3', name: 'Meeting Notes.txt', type: 'txt', uploadDate: new Date(2023, 11, 5) },
                { id: '4', name: 'Quarterly Presentation.pptx', type: 'pptx', uploadDate: new Date(2023, 9, 10) },
                { id: '5', name: 'Research Paper.pdf', type: 'pdf', uploadDate: new Date(2023, 8, 18) },
            ];
            
            // Default select some documents
            selectedDocIds = ['1', '2'];
            
            renderDocuments();
            updateSelectedCount();
            updateQueryStatus();
            
            // Hide loading
            documentsLoading.classList.add('hidden');
            
            // In a real implementation, you would use fetch API:
            /*
            fetch('/api/docs/all')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        documents = data.documents;
                        renderDocuments();
                    } else {
                        showToast('Error', data.message || 'Failed to fetch documents', 'error');
                    }
                    documentsLoading.classList.add('hidden');
                })
                .catch(error => {
                    showToast('Error', 'Failed to fetch documents. Please try again.', 'error');
                    documentsLoading.classList.add('hidden');
                });
            */
        }, 1000);
    }
    
    function renderDocuments() {
        documentsList.innerHTML = '';
        
        documents.forEach(doc => {
            const isSelected = selectedDocIds.includes(doc.id);
            const docItem = document.createElement('li');
            docItem.className = `document-item ${isSelected ? 'selected' : ''}`;
            docItem.innerHTML = `
                <input type="checkbox" id="doc-${doc.id}" class="document-checkbox" ${isSelected ? 'checked' : ''}>
                <div class="document-info">
                    <label for="doc-${doc.id}" class="document-name">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        ${doc.name}
                    </label>
                    <div class="document-date">${formatDate(doc.uploadDate)}</div>
                </div>
            `;
            
            const checkbox = docItem.querySelector('.document-checkbox');
            checkbox.addEventListener('change', () => {
                toggleDocumentSelection(doc.id);
            });
            
            documentsList.appendChild(docItem);
        });
    }
    
    function toggleDocumentSelection(docId) {
        if (selectedDocIds.includes(docId)) {
            selectedDocIds = selectedDocIds.filter(id => id !== docId);
        } else {
            selectedDocIds.push(docId);
        }
        
        // Update UI
        const docItem = document.querySelector(`#doc-${docId}`).closest('.document-item');
        docItem.classList.toggle('selected');
        
        updateSelectedCount();
        updateQueryStatus();
    }
    
    function updateSelectedCount() {
        selectedCount.textContent = `${selectedDocIds.length} of ${documents.length} selected`;
    }
    
    function updateQueryStatus() {
        if (selectedDocIds.length === 0) {
            queryStatus.textContent = 'No documents selected';
        } else {
            queryStatus.textContent = `Querying ${selectedDocIds.length} document${selectedDocIds.length > 1 ? 's' : ''}`;
        }
    }
    
    function toggleListening() {
        if (!recognition) {
            showToast('Voice Input Not Supported', 'Your browser doesn\'t support voice input. Please use a modern browser like Chrome.', 'error');
            return;
        }
        
        if (isListening) {
            recognition.stop();
            isListening = false;
        } else {
            recognition.start();
            isListening = true;
            queryInput.value = '';
            queryInput.dispatchEvent(new Event('input'));
        }
        
        updateVoiceToggleUI();
    }
    
    function updateVoiceToggleUI() {
        if (isListening) {
            voiceToggleBtn.classList.add('active');
            micIcon.classList.add('hidden');
            micOffIcon.classList.remove('hidden');
            queryInput.placeholder = 'Listening...';
        } else {
            voiceToggleBtn.classList.remove('active');
            micIcon.classList.remove('hidden');
            micOffIcon.classList.add('hidden');
            queryInput.placeholder = 'Ask a question about your documents...';
        }
    }
    
    function speakMessage(text) {
        if (!synth) {
            showToast('Text-to-Speech Not Supported', 'Your browser doesn\'t support text-to-speech. Please use a modern browser.', 'error');
            return;
        }
        
        if (isSpeaking) {
            synth.cancel();
            isSpeaking = false;
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            isSpeaking = false;
        };
        utterance.onerror = () => {
            isSpeaking = false;
            showToast('Text-to-Speech Error', 'There was an error playing the audio. Please try again.', 'error');
        };
        
        isSpeaking = true;
        synth.speak(utterance);
    }
    
    function handleSubmit() {
        const query = queryInput.value.trim();
        if (!query || isLoading) return;
        
        // Stop listening if active
        if (isListening && recognition) {
            recognition.stop();
            isListening = false;
            updateVoiceToggleUI();
        }
        
        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };
        
        messages.push(userMessage);
        renderMessages();
        
        // Clear input
        queryInput.value = '';
        queryInput.style.height = 'auto';
        queryInput.dispatchEvent(new Event('input'));
        
        // Show loading
        isLoading = true;
        sendBtn.disabled = true;
        sendBtn.querySelector('.send-icon').classList.add('hidden');
        sendBtn.querySelector('.loader').classList.remove('hidden');
        
        // Enable download and clear buttons
        downloadBtn.disabled = false;
        clearBtn.disabled = false;
        
        // Simulate API response
        setTimeout(() => {
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `This is a simulated response to your query: "${query}". In a real implementation, this would be the response from the Gemini AI based on the context of your selected documents.

For your query, I would analyze the content of ${selectedDocIds.length} selected document(s) and provide relevant information extracted from them. The response would highlight key passages that answer your question and synthesize information across multiple documents if needed.

The RAG system would:
1. Process your query
2. Search through the vector embeddings of your documents
3. Retrieve the most relevant chunks of text
4. Generate a comprehensive answer using Gemini AI

Would you like me to provide more specific information about any particular topic in your documents?`,
                timestamp: new Date()
            };
            
            messages.push(assistantMessage);
            renderMessages();
            
            // Hide loading
            isLoading = false;
            sendBtn.disabled = !queryInput.value.trim();
            sendBtn.querySelector('.send-icon').classList.remove('hidden');
            sendBtn.querySelector('.loader').classList.add('hidden');
            
            // In a real implementation, you would use fetch API:
            /*
            fetch('/api/query/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    docIds: selectedDocIds,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const assistantMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.response,
                        timestamp: new Date()
                    };
                    
                    messages.push(assistantMessage);
                    renderMessages();
                } else {
                    showToast('Query Failed', data.message || 'Failed to process your query', 'error');
                }
                
                isLoading = false;
                sendBtn.disabled = !queryInput.value.trim();
                sendBtn.querySelector('.send-icon').classList.remove('hidden');
                sendBtn.querySelector('.loader').classList.add('hidden');
            })
            .catch(error => {
                showToast('Query Failed', 'There was an error processing your query. Please try again.', 'error');
                
                isLoading = false;
                sendBtn.disabled = !queryInput.value.trim();
                sendBtn.querySelector('.send-icon').classList.remove('hidden');
                sendBtn.querySelector('.loader').classList.add('hidden');
            });
            */
        }, 2000);
    }
    
    function renderMessages() {
        if (messages.length === 0) {
            emptyChat.classList.remove('hidden');
            return;
        }
        
        emptyChat.classList.add('hidden');
        
        // Clear existing messages
        const existingMessages = chatMessages.querySelectorAll('.message');
        existingMessages.forEach(msg => {
            if (!msg.isEqualNode(emptyChat)) {
                msg.remove();
            }
        });
        
        // Add messages
        messages.forEach(message => {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${message.role}`;
            
            messageEl.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${message.role === 'user' ? 'You' : 'TextAssist'}</span>
                    <span class="message-time">${formatTime(message.timestamp)}</span>
                </div>
                <div class="message-bubble">
                    <div class="message-content">${message.content}</div>
                </div>
            `;
            
            if (message.role === 'assistant') {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                
                const speakBtn = document.createElement('button');
                speakBtn.className = 'message-action-btn';
                speakBtn.title = 'Speak response';
                speakBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                `;
                
                speakBtn.addEventListener('click', () => {
                    speakMessage(message.content);
                });
                
                actionsDiv.appendChild(speakBtn);
                messageEl.appendChild(actionsDiv);
            }
            
            chatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function downloadConversation() {
        if (messages.length === 0) {
            showToast('No Conversation', 'There\'s no conversation to download.', 'default');
            return;
        }
        
        const text = messages
            .map(msg => `${msg.role === 'user' ? 'You' : 'TextAssist'} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}\n\n`)
            .join('');
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `textassist-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Download Complete', 'Your conversation has been downloaded.', 'success');
    }
    
    function clearConversation() {
        if (messages.length === 0) return;
        
        messages = [];
        renderMessages();
        
        // Disable download and clear buttons
        downloadBtn.disabled = true;
        clearBtn.disabled = true;
        
        showToast('Conversation Cleared', 'Your conversation history has been cleared.', 'success');
    }
});