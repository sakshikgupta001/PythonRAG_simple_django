import logging
from django.http import JsonResponse
from django.conf import settings
import os
import json
import uuid
from . import utils

logger = logging.getLogger(__name__)

def upload_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': "Invalid request method. Only POST is allowed."}, status=405)

    pdf_file = request.FILES.get('pdf_file')
    if not pdf_file:
        return JsonResponse({'success': False, 'message': "No file provided."}, status=400)

    if not pdf_file.name.lower().endswith('.pdf'):
        return JsonResponse({'success': False, 'message': "Invalid file type. Please upload a PDF file."}, status=400)

    # Consider adding file size validation
    MAX_UPLOAD_SIZE = 200 * 1024 * 1024 # Example: 200MB limit
    if pdf_file.size > MAX_UPLOAD_SIZE:
        return JsonResponse({'success': False, 'message': f"File size exceeds the limit of {MAX_UPLOAD_SIZE // 1024 // 1024}MB."}, status=413)

    temp_path = os.path.join(settings.BASE_DIR, 'temp_uploads')
    os.makedirs(temp_path, exist_ok=True)
    # Generate a unique temporary filename to avoid collisions and potential security issues
    temp_filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(temp_path, temp_filename)

    try:
        # Save the uploaded file securely
        with open(file_path, 'wb') as f:
            for chunk in pdf_file.chunks():
                f.write(chunk)

        # Process the file
        try:
            text = utils.extract_text_from_pdf(file_path)
            if not text or not text.strip():
                logger.warning(f"Extracted empty text from PDF: {pdf_file.name}")
                return JsonResponse({'success': False, 'message': "Could not extract text from the PDF."}, status=400)

            chunks = utils.chunk_text(text)
            if not chunks:
                logger.warning(f"Could not chunk text from PDF: {pdf_file.name}")
                return JsonResponse({'success': False, 'message': "Failed to process text chunks."}, status=500)

            embeddings = utils.get_embeddings(chunks)
            if embeddings is None:
                logger.error(f"Failed to get embeddings for PDF: {pdf_file.name}")
                return JsonResponse({'success': False, 'message': "Failed to generate document embeddings."}, status=500)

            # ---- Start: Add to ChromaDB ----
            try:
                collection = utils.initialize_chromadb()
                if collection is None:
                    logger.error("Failed to initialize ChromaDB collection during upload.")
                    return JsonResponse({'success': False, 'message': "Failed to connect to the document database."}, status=503)

                # Generate unique IDs for each chunk
                base_doc_id = pdf_file.name # Consider sanitizing or using a hash if filename is complex/unsafe
                chunk_ids = [f"{base_doc_id}_{i}" for i in range(len(chunks))]

                collection.add(
                    embeddings=embeddings,
                    documents=chunks,
                    ids=chunk_ids
                )
                logger.info(f"Added {len(chunks)} chunks from {pdf_file.name} to ChromaDB.")

            except Exception as e:
                logger.error(f"Failed to add embeddings for {pdf_file.name} to ChromaDB: {e}", exc_info=True)
                return JsonResponse({'success': False, 'message': "Failed to store document embeddings in the database."}, status=500)
            # ---- End: Add to ChromaDB ----

        except Exception as e:
            logger.error(f"Error processing PDF {pdf_file.name}: {e}", exc_info=True)
            return JsonResponse({'success': False, 'message': f"An error occurred during file processing: {e}"}, status=500)

        # Return success only after all steps (including DB add) are complete
        return JsonResponse({'success': True, 'message': f"File '{pdf_file.name}' processed and stored successfully."}, status=200)

    except IOError as e:
        logger.error(f"IOError saving uploaded file {pdf_file.name}: {e}", exc_info=True)
        return JsonResponse({'success': False, 'message': "Failed to save uploaded file."}, status=500)
    except Exception as e:
        logger.error(f"Unexpected error handling upload for {pdf_file.name}: {e}", exc_info=True)
        return JsonResponse({'success': False, 'message': "An unexpected error occurred."}, status=500)
    finally:
        # Ensure the temporary file is always removed
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                logger.error(f"Error removing temporary file {file_path}: {e}", exc_info=True)

def query_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': "Invalid request method. Only POST is allowed."}, status=405)

    try:
        data = json.loads(request.body)
        query = data.get('query', '').strip() # Trim whitespace
    except json.JSONDecodeError:
        logger.warning("Received invalid JSON in query request body.")
        return JsonResponse({'success': False, 'message': "Invalid JSON format in request body."}, status=400)
    except Exception as e:
        logger.error(f"Error reading request body: {e}", exc_info=True)
        return JsonResponse({'success': False, 'message': "Could not read request data."}, status=400)

    if not query:
        logger.warning("Received empty query.")
        return JsonResponse({'success': False, 'message': "Query cannot be empty."}, status=400)

    # Add query length validation if desired
    # MAX_QUERY_LENGTH = 500
    # if len(query) > MAX_QUERY_LENGTH:
    #     logger.warning(f"Query length exceeded limit: {len(query)} chars.")
    #     return JsonResponse({'success': False, 'message': f"Query length exceeds the limit of {MAX_QUERY_LENGTH} characters."}, status=413)

    try: # This try block covers the core query processing logic
        collection = utils.initialize_chromadb()
        if collection is None:
            logger.error("Failed to initialize ChromaDB collection.")
            # Return 503 Service Unavailable as the backend dependency is down
            return JsonResponse({'success': False, 'message': "Failed to connect to the document database."}, status=503)

        context_chunks = utils.query_chromadb(collection, query, n_results=5)
        if not context_chunks:
            logger.info(f"No relevant context found for query: '{query}'")
            # Return a specific message indicating no context was found.
            return JsonResponse({'success': True, 'query': query, 'response': "No relevant information found in the uploaded documents for your query."}, status=200)

        response_text = utils.generate_response(query, context_chunks)
        if response_text is None: # Assuming generate_response returns None on failure
            logger.error(f"Failed to generate response for query: '{query}'")
            return JsonResponse({'success': False, 'message': "Failed to generate a response from the language model."}, status=500)

        return JsonResponse({'success': True, 'query': query, 'response': response_text}, status=200)

    except Exception as e: # This except block catches errors specifically from the core logic try block above
        logger.error(f"Error processing query '{query}': {e}", exc_info=True)
        # Return a generic 500 error for internal processing issues
        return JsonResponse({'success': False, 'message': f"An error occurred while processing your query."}, status=500)
