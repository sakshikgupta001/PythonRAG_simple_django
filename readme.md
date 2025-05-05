# TextAssist Documentation

## Abstract
TextAssist is a web-based application designed to facilitate seamless interaction between users and AI-powered systems. The platform enables users to upload PDF documents and engage in meaningful conversations with an AI chatbot to extract insights from the uploaded content. This document provides a comprehensive overview of the system's architecture, features, and implementation details.

## Introduction
The increasing reliance on AI for document analysis and conversational interfaces has necessitated the development of user-friendly platforms. TextAssist bridges this gap by combining document upload capabilities with an AI chatbot interface. Built using Django for the backend and plain HTML/CSS/JavaScript for the frontend, TextAssist offers a lightweight yet powerful solution for document-based AI interactions.

## System Architecture
### Project Structure
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

### System Design
The system is designed with a modular architecture to ensure scalability and maintainability. Below is a high-level overview of the system design:

#### Backend Workflow
1. **PDF Upload**: Users upload PDF files via the frontend.
2. **Text Extraction**: The backend processes the uploaded files to extract text using `pypdf`.
3. **Text Chunking**: The extracted text is split into manageable chunks.
4. **Embedding Generation**: Text chunks are converted into embeddings using the Gemini AI API.
5. **Storage**: Embeddings are stored in ChromaDB for efficient retrieval.
6. **Query Handling**: User queries are processed to retrieve relevant text chunks from ChromaDB.
7. **Response Generation**: AI-generated responses are returned to the user.

#### Frontend Workflow
1. **Navigation**: Users navigate between the Upload and Chat sections.
2. **File Upload**: Users upload files, and progress indicators provide feedback.
3. **Chat Interface**: Users interact with the chatbot to ask questions about the uploaded documents.
4. **Response Display**: AI-generated responses are displayed in the chat window.

### Flow Diagram
Below is a flow diagram illustrating the end-to-end workflow of the system:

```plaintext
+----------------+       +----------------+       +----------------+       +----------------+
|                |       |                |       |                |       |                |
|  User Uploads  | ----> |  Backend       | ----> |  ChromaDB      | ----> |  AI Response   |
|  PDF Files     |       |  Processing    |       |  Retrieval     |       |  Generation    |
|                |       |                |       |                |       |                |
+----------------+       +----------------+       +----------------+       +----------------+
```

### Architecture Diagram
Below is a high-level architecture diagram:

```plaintext
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|  Frontend         | ----> |  Backend          | ----> |  ChromaDB         |
|  (HTML/CSS/JS)    |       |  (Django)         |       |  (Document Store) |
|                   |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
```

## Features
### PDF Upload
- Users can upload PDF files, which are processed to extract text.
- Supports multiple file uploads with progress indicators.

### AI Chatbot
- Users can ask questions about the uploaded documents.
- Provides context-aware answers using advanced AI models.

### Progress Indicators
- Visual feedback for file uploads and chatbot responses.

### Responsive Design
- A clean and user-friendly interface optimized for various devices.

## Backend Implementation
The backend is built using Django and provides the following functionalities:

### Key Modules
#### `core/utils.py`
- **`extract_text_from_pdf`**: Extracts text from PDF files using `pypdf`.
- **`chunk_text`**: Splits text into manageable chunks for processing.
- **`get_embeddings`**: Generates embeddings for text chunks using the Gemini AI API.
- **`initialize_chromadb`**: Initializes a ChromaDB client for document storage and retrieval.
- **`query_chromadb`**: Queries the ChromaDB for relevant document chunks.
- **`generate_response`**: Generates AI responses based on user queries and document context.

#### `core/views.py`
- **`upload_view`**: Handles file uploads and processes PDFs.
- **`query_view`**: Handles user queries and returns AI-generated responses.

#### `rag_project/settings.py`
- Configures the Django project, including database settings, CORS, and API keys.

## Frontend Implementation
The frontend is a single-page application built with plain HTML, CSS, and JavaScript.

### Key Components
#### `index.html`
- The main HTML file that serves as the entry point.

#### `style.css`
- Contains styles for the application, including buttons, progress bars, and chat interface.

#### `script.js`
- **`navigateTo`**: Handles navigation between pages (Home, Upload, Chat).
- **`setupUpload`**: Manages file upload functionality, including progress indicators.
- **`setupChat`**: Manages the chat interface, including sending queries and displaying responses.

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
### Backend
- Django
- pypdf
- chromadb
- google-generativeai
- python-dotenv

### Frontend
- Plain HTML, CSS, and JavaScript

## Future Enhancements
- Add user authentication.
- Support for additional file formats.
- Improved error handling and logging.
- Deployment to a cloud platform.

## Conclusion
TextAssist demonstrates the potential of integrating document processing with conversational AI. Its modular architecture and user-friendly interface make it a valuable tool for various applications, from academic research to business analytics.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- [Django](https://www.djangoproject.com/)
- [ChromaDB](https://www.trychroma.com/)
- [Google Generative AI](https://ai.google/tools/)

---
Feel free to contribute to this project by submitting issues or pull requests.