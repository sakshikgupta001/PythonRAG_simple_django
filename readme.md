# PythonRAG: Retrieval-Augmented Generation with Django

PythonRAG is a Django-based project that implements a Retrieval-Augmented Generation (RAG) system. It allows users to upload PDF documents, process their content, and query the system to retrieve relevant information. The project integrates with Google Gemini AI for embedding generation and ChromaDB for vector database storage.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [API Endpoints](#api-endpoints)
7. [Flow of the Application](#flow-of-the-application)
8. [Configuration](#configuration)
9. [Future Improvements](#future-improvements)
10. [License](#license)

---

## Overview

Retrieval-Augmented Generation (RAG) combines retrieval-based methods with generative AI models. This project enables users to upload documents, process them into embeddings, and query the system for relevant information. The system uses:

- **Google Gemini AI**: For generating embeddings and responses.
- **ChromaDB**: A vector database for storing and querying document embeddings.

---

## Architecture

The architecture of PythonRAG is divided into the following components:

1. **Frontend**: Not implemented yet. The project currently uses API endpoints for interaction.
2. **Backend**: Django-based backend that handles file uploads, text processing, and querying.
3. **Vector Database**: ChromaDB is used to store embeddings of document chunks.
4. **AI Integration**: Google Gemini AI is used for embedding generation and response generation.

### High-Level Flow

1. **PDF Upload**:
   - Users upload a PDF file via the `/api/upload/` endpoint.
   - The file is processed to extract text, split into chunks, and generate embeddings.
   - The embeddings and chunks are stored in ChromaDB.

2. **Query**:
   - Users send a query to the `/api/query/` endpoint.
   - The query is converted into an embedding and matched against stored embeddings in ChromaDB.
   - Relevant chunks are retrieved and used as context for generating a response using Google Gemini AI.

---

## Features

1. **PDF Upload and Processing**:
   - Extracts text from uploaded PDFs.
   - Splits text into manageable chunks.
   - Generates embeddings for each chunk using Google Gemini AI.
   - Stores embeddings and metadata in ChromaDB.

2. **Query Interface**:
   - Accepts user queries.
   - Retrieves relevant document chunks from ChromaDB.
   - Generates a response using Google Gemini AI.

3. **CORS Support**:
   - Configured to allow cross-origin requests for API interaction.

---

## Project Structure

```
.env
.gitignore
db.sqlite3
manage.py
readme.md
requirements.txt
chroma_db/
    chroma.sqlite3
    b1ccd0a5-2b4e-4fd8-aab4-b5f509a2373c/
core/
    apps.py
    urls.py
    utils.py
    views.py
PythonRAG/
    settings.py
rag_project/
    asgi.py
    settings.py
    urls.py
    wsgi.py
temp_uploads/
```

### Key Files

- **`core/views.py`**: Contains the logic for handling file uploads and queries.
- **`core/utils.py`**: Utility functions for text extraction, chunking, embedding generation, and database interaction.
- **`rag_project/settings.py`**: Django settings, including database configuration and custom settings for ChromaDB and Gemini AI.
- **`requirements.txt`**: Lists the dependencies required for the project.

---

## Installation

### Prerequisites

- Python 3.8+
- Virtual environment (optional but recommended)
- SQLite (default database)
- Django 4.0+

### Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd PythonRAG
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```
     GEMINI_API_KEY=<your-gemini-api-key>
     ```

5. Apply migrations:
   ```bash
   python manage.py migrate
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

---

## API Endpoints

### 1. Upload API

- **URL**: `/api/upload/`
- **Method**: POST
- **Request**:
  - Form-data with a key `pdf_file` containing the PDF file.
- **Response**:
  - Success:
    ```json
    {
      "success": true,
      "message": "Successfully processed and indexed 'filename.pdf'.",
      "filename": "filename.pdf"
    }
    ```
  - Failure:
    ```json
    {
      "success": false,
      "message": "Error message."
    }
    ```

### 2. Query API

- **URL**: `/api/query/`
- **Method**: POST
- **Request**:
  - JSON body with a key `query` containing the query string.
- **Response**:
  - Success:
    ```json
    {
      "success": true,
      "query": "Your query",
      "response": "Generated response"
    }
    ```
  - Failure:
    ```json
    {
      "success": false,
      "message": "Error message."
    }
    ```

---

## Flow of the Application

1. **PDF Upload**:
   - User uploads a PDF file.
   - The file is saved temporarily in the `temp_uploads` directory.
   - Text is extracted using `pypdf`.
   - Text is split into chunks for embedding generation.
   - Embeddings are generated using Google Gemini AI.
   - Chunks and embeddings are stored in ChromaDB.

2. **Query**:
   - User sends a query string.
   - The query is converted into an embedding.
   - ChromaDB is queried to retrieve relevant chunks.
   - The retrieved chunks are used as context to generate a response using Google Gemini AI.

---

## Configuration

### `PythonRAG/settings.py`

- **Database**: SQLite is used as the default database.
- **CORS**: Configured to allow all origins for development purposes.
- **Custom Settings**:
  - `GEMINI_API_KEY`: API key for Google Gemini AI.
  - `CHROMA_DB_PATH`: Path to ChromaDB storage.
  - `CHROMA_COLLECTION_NAME`: Name of the ChromaDB collection.

---

## Future Improvements

1. **Authentication**:
   - Add token-based authentication for API endpoints.
2. **Error Handling**:
   - Improve error messages and add more specific exception handling.
3. **Rate Limiting**:
   - Implement rate limiting to prevent abuse of the API.
4. **Frontend**:
   - Develop a user-friendly interface for uploading files and querying.
5. **Production Deployment**:
   - Configure the project for deployment using a production-ready server like Gunicorn and a reverse proxy like Nginx.

---

## License

This project is licensed under the MIT License.