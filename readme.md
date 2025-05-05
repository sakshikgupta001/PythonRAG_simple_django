# TextAssist Documentation

## Overview
TextAssist is a web-based application that allows users to upload PDF documents and interact with an AI-powered chatbot to ask questions about the uploaded content. The project is built using Django for the backend and a plain HTML/CSS/JavaScript frontend.

## Features
- **PDF Upload**: Users can upload PDF files, which are processed to extract text.
- **AI Chatbot**: Users can ask questions about the uploaded documents, and the chatbot provides context-aware answers.
- **Progress Indicators**: Visual feedback for file uploads and chatbot responses.
- **Responsive Design**: A clean and user-friendly interface.

## Project Structure
```
PythonRAG/
├── core/                # Backend logic and utilities
│   ├── apps.py
│   ├── urls.py
│   ├── utils.py         # PDF processing and AI integration
│   ├── views.py         # API endpoints for upload and query
├── plain-frontend/      # Frontend files
│   ├── index.html       # Main HTML file
│   ├── script.js        # JavaScript logic
│   ├── style.css        # Styling
├── rag_project/         # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
├── temp_uploads/        # Temporary storage for uploaded files
├── db.sqlite3           # SQLite database
├── manage.py            # Django management script
├── requirements.txt     # Python dependencies
└── readme.md            # Project documentation
```

## Backend
The backend is built using Django and provides the following functionalities:

### Key Files
- **`core/utils.py`**:
  - `extract_text_from_pdf`: Extracts text from PDF files using `pypdf`.
  - `chunk_text`: Splits text into manageable chunks for processing.
  - `get_embeddings`: Generates embeddings for text chunks using the Gemini AI API.
  - `initialize_chromadb`: Initializes a ChromaDB client for document storage and retrieval.
  - `query_chromadb`: Queries the ChromaDB for relevant document chunks.
  - `generate_response`: Generates AI responses based on user queries and document context.

- **`core/views.py`**:
  - `upload_view`: Handles file uploads and processes PDFs.
  - `query_view`: Handles user queries and returns AI-generated responses.

- **`rag_project/settings.py`**:
  - Configures the Django project, including database settings, CORS, and API keys.

## Frontend
The frontend is a single-page application built with plain HTML, CSS, and JavaScript.

### Key Files
- **`index.html`**: The main HTML file that serves as the entry point.
- **`style.css`**: Contains styles for the application, including buttons, progress bars, and chat interface.
- **`script.js`**:
  - `navigateTo`: Handles navigation between pages (Home, Upload, Chat).
  - `setupUpload`: Manages file upload functionality, including progress indicators.
  - `setupChat`: Manages the chat interface, including sending queries and displaying responses.

## Environment Variables
The project uses a `.env` file to store sensitive information:
```
GEMINI_API_KEY=<your_api_key>
```

## Installation and Setup
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd PythonRAG
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up the `.env` file with your API key.
4. Run the Django development server:
   ```bash
   python manage.py runserver
   ```
5. Open `plain-frontend/index.html` in a browser to access the application.

## Usage
1. Navigate to the **Upload** section to upload PDF files.
2. Switch to the **Chat** section to ask questions about the uploaded documents.
3. View responses in the chat window.

## Dependencies
- **Backend**:
  - Django
  - pypdf
  - chromadb
  - google-generativeai
  - python-dotenv

- **Frontend**:
  - Plain HTML, CSS, and JavaScript

## Future Enhancements
- Add user authentication.
- Support for additional file formats.
- Improved error handling and logging.
- Deployment to a cloud platform.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- [Django](https://www.djangoproject.com/)
- [ChromaDB](https://www.trychroma.com/)
- [Google Generative AI](https://ai.google/tools/)

---
Feel free to contribute to this project by submitting issues or pull requests.