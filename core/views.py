from django.shortcuts import render, redirect
from django.http import HttpResponseServerError, HttpResponseBadRequest
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os
import logging
from . import utils # Import the utility functions

logger = logging.getLogger(__name__)

def upload_view(request):
    message = None
    if request.method == 'POST' and request.FILES.get('pdf_file'):
        pdf_file = request.FILES['pdf_file']

        # Basic validation
        if not pdf_file.name.endswith('.pdf'):
            message = "Error: Please upload a valid PDF file."
            return render(request, 'core/upload.html', {'message': message, 'is_error': True})

        # Save the uploaded file temporarily
        fs = FileSystemStorage(location=os.path.join(settings.BASE_DIR, 'temp_uploads'))
        try:
            # Ensure the temp directory exists
            os.makedirs(fs.location, exist_ok=True)

            filename = fs.save(pdf_file.name, pdf_file)
            uploaded_file_path = fs.path(filename)
            logger.info(f"PDF file saved temporarily to: {uploaded_file_path}")

            # 1. Extract Text
            text = utils.extract_text_from_pdf(uploaded_file_path)
            if text is None:
                message = "Error: Could not extract text from the PDF."
                fs.delete(filename) # Clean up temp file
                return render(request, 'core/upload.html', {'message': message, 'is_error': True})

            # 2. Chunk Text
            chunks = utils.chunk_text(text)
            if not chunks:
                message = "Error: Could not chunk the extracted text (is the PDF empty?)."
                fs.delete(filename) # Clean up temp file
                return render(request, 'core/upload.html', {'message': message, 'is_error': True})

            # 3. Get Embeddings
            embeddings = utils.get_embeddings(chunks)
            if embeddings is None:
                message = "Error: Failed to generate embeddings for the text chunks."
                fs.delete(filename) # Clean up temp file
                return render(request, 'core/upload.html', {'message': message, 'is_error': True})

            # 4. Initialize ChromaDB and Add Data
            collection = utils.initialize_chromadb()
            if collection is None:
                message = "Error: Failed to initialize the vector database."
                fs.delete(filename) # Clean up temp file
                return render(request, 'core/upload.html', {'message': message, 'is_error': True})

            success = utils.add_to_chromadb(collection, chunks, embeddings, pdf_file.name)
            if not success:
                message = "Error: Failed to add document chunks to the vector database."
                fs.delete(filename) # Clean up temp file
                return render(request, 'core/upload.html', {'message': message, 'is_error': True})

            # Clean up the temporary file
            fs.delete(filename)
            logger.info(f"Temporary file {uploaded_file_path} deleted.")

            message = f"Successfully processed and indexed '{pdf_file.name}'."
            # Redirect to query page or stay on upload page with success message
            # return redirect('query') # Or keep on upload page:
            return render(request, 'core/upload.html', {'message': message, 'is_error': False})

        except Exception as e:
            logger.error(f"An error occurred during PDF processing: {e}", exc_info=True)
            # Clean up if file was saved
            if 'filename' in locals() and fs.exists(filename):
                fs.delete(filename)
            message = f"An unexpected error occurred: {e}"
            return render(request, 'core/upload.html', {'message': message, 'is_error': True})

    # GET request or POST without file
    return render(request, 'core/upload.html', {'message': message})


def query_view(request):
    response_text = None
    query = None
    if request.method == 'POST':
        query = request.POST.get('query', '')
        if not query:
            # Handle empty query if needed, maybe just re-render the form
            return render(request, 'core/query.html')

        logger.info(f"Received query: {query}")

        # 1. Initialize ChromaDB
        collection = utils.initialize_chromadb()
        if collection is None:
            return HttpResponseServerError("Error: Could not connect to the vector database.")

        # 2. Query ChromaDB for relevant context
        context_chunks = utils.query_chromadb(collection, query, n_results=5) # Get top 5 chunks

        # 3. Generate Response using Gemini
        response_text = utils.generate_response(query, context_chunks)

    # Render the page with the query and response (if any)
    return render(request, 'core/query.html', {'query': query, 'response': response_text})
