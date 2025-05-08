document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const uploadDropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadBtnText = document.getElementById('upload-btn-text');
    const uploadBtnIcon = document.getElementById('upload-btn-icon');
    const uploadBtnLoader = document.getElementById('upload-btn-loader');
    const uploadFilename = document.getElementById('upload-filename');
    const uploadFilesize = document.getElementById('upload-filesize');
    const uploadProgressContainer = document.getElementById('upload-progress-container');
    const uploadProgressBar = document.getElementById('upload-progress-bar');
    const uploadProgressPercentage = document.getElementById('upload-progress-percentage');
    const uploadStatus = document.getElementById('upload-status');
    const uploadedFilesCard = document.getElementById('uploaded-files-card');
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    
    // State
    let file = null;
    let uploading = false;
    let uploadedFiles = [];
    
    // Event Listeners
    uploadDropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('active');
    });
    
    uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('active');
    });
    
    uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileSelect(fileInput.files[0]);
        }
    });
    
    uploadBtn.addEventListener('click', handleUpload);
    
    // Functions
    function handleFileSelect(selectedFile) {
        // Check file type
        const allowedTypes = ['.pdf', '.docx', '.txt', '.pptx'];
        const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showToast('Invalid File Type', 'Please upload a PDF, DOCX, TXT, or PPTX file.', 'error');
            return;
        }
        
        // Check file size (max 50MB)
        if (selectedFile.size > 50 * 1024 * 1024) {
            showToast('File Too Large', 'Please upload a file smaller than 50MB.', 'error');
            return;
        }
        
        file = selectedFile;
        uploadFilename.textContent = file.name;
        uploadFilesize.textContent = formatFileSize(file.size);
        uploadDropzone.classList.add('active');
        uploadBtn.disabled = false;
        uploadProgressContainer.classList.add('hidden');
        uploadStatus.innerHTML = '';
    }
    
    async function handleUpload() {
        if (!file || uploading) return;

        uploading = true;
        uploadBtn.disabled = true;
        uploadBtnText.textContent = 'Uploading...';
        uploadBtnIcon.classList.add('hidden');
        uploadBtnLoader.classList.remove('hidden');
        uploadProgressContainer.classList.remove('hidden');
        uploadProgressBar.style.width = '0%';
        uploadProgressPercentage.textContent = '0%';

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload file');
            }

            const data = await response.json();
            if (data.success) {
                updateProgress(100);
                uploadStatus.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span style="color: #10b981">Upload successful</span>
                `;
                addUploadedFile(file);
                showToast('Upload Successful', `${file.name} has been processed successfully.`, 'success');
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span style="color: #ef4444">Upload failed: ${error.message}</span>
            `;
            showToast('Upload Failed', error.message, 'error');
        } finally {
            uploading = false;
            uploadBtn.disabled = false;
            uploadBtnText.textContent = 'Upload Document';
            uploadBtnIcon.classList.remove('hidden');
            uploadBtnLoader.classList.add('hidden');
            fileInput.value = '';
            file = null;
            uploadFilename.textContent = 'Drag and drop or click to upload';
            uploadFilesize.textContent = 'PDF, DOCX, TXT, PPTX (Max 50MB)';
            uploadDropzone.classList.remove('active');
        }
    }
    
    function updateProgress(progress) {
        uploadProgressBar.style.width = `${progress}%`;
        uploadProgressPercentage.textContent = `${progress}%`;
    }
    
    function addUploadedFile(file) {
        const fileObj = {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            type: file.name.split('.').pop().toLowerCase(),
            uploadDate: new Date()
        };
        
        uploadedFiles.push(fileObj);
        
        // Show uploaded files card if hidden
        if (uploadedFilesCard.classList.contains('hidden')) {
            uploadedFilesCard.classList.remove('hidden');
        }
        
        // Add file to list
        const fileItem = document.createElement('li');
        fileItem.className = 'uploaded-file-item';
        fileItem.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="uploaded-file-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="uploaded-file-name">${fileObj.name}</span>
            <span class="uploaded-file-time">Just now</span>
        `;
        
        uploadedFilesList.appendChild(fileItem);
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }
});