import os
import google.generativeai as genai
import chromadb
from pypdf import PdfReader
from django.conf import settings
import logging
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {e}")
    # Handle the error appropriately, maybe raise an exception or exit
    # For now, we'll just log it. You might want more robust error handling.

def extract_text_from_pdf(pdf_file_path):
    """Extracts text from a given PDF file."""
    logger.info(f"Extracting text from PDF: {pdf_file_path}")
    try:
        reader = PdfReader(pdf_file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n" # Add newline between pages
        logger.info(f"Successfully extracted text from {pdf_file_path}. Length: {len(text)}")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_file_path}: {e}")
        return None

def chunk_text(text, chunk_size=1000, overlap=100):
    """Splits text into overlapping chunks."""
    logger.info(f"Chunking text. Total length: {len(text)}, Chunk size: {chunk_size}, Overlap: {overlap}")
    if not text:
        logger.warning("Text is empty, cannot chunk.")
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
        if start >= len(text): # Ensure we don't go past the end on the next iteration check
             break
        # Adjust start if overlap pushes it beyond text length unnecessarily
        if start + overlap >= len(text) and end < len(text):
             start = len(text) - chunk_size # Ensure the last chunk captures the end
             if start < 0: start = 0 # Handle case where text is smaller than chunk size
             end = len(text)
             chunks.append(text[start:end])
             break # Last chunk added

    logger.info(f"Created {len(chunks)} chunks.")
    return chunks

def get_embeddings(text_chunks):
    """Generates embeddings for a list of text chunks using Gemini."""
    logger.info(f"Generating embeddings for {len(text_chunks)} chunks.")
    if not text_chunks:
        logger.warning("No text chunks provided for embedding.")
        return []
    try:
        # Note: The free tier might have rate limits.
        # Consider batching or adding delays if you hit limits.
        # The embed_content function can handle a list of strings directly.
        result = genai.embed_content(
            model="models/embedding-001",
            content=text_chunks,
            task_type="retrieval_document" # Use "retrieval_document" for texts to be stored
        )
        logger.info(f"Successfully generated {len(result['embedding'])} embeddings.")
        return result['embedding']
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        # Depending on the error, you might want to retry or handle specific exceptions
        return None # Indicate failure

def initialize_chromadb():
    """Initializes ChromaDB client and collection."""
    logger.info(f"Initializing ChromaDB at path: {settings.CHROMA_DB_PATH}")
    try:
        client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        collection = client.get_or_create_collection(name=settings.CHROMA_COLLECTION_NAME)
        logger.info(f"ChromaDB collection '{settings.CHROMA_COLLECTION_NAME}' ready.")
        return collection
    except Exception as e:
        logger.error(f"Error initializing ChromaDB: {e}")
        return None

def add_to_chromadb(collection, chunks, embeddings, pdf_filename):
    """Adds text chunks and their embeddings to the ChromaDB collection."""
    if not chunks or not embeddings or len(chunks) != len(embeddings):
        logger.error("Mismatch between chunks and embeddings or empty lists. Cannot add to ChromaDB.")
        return False
    logger.info(f"Adding {len(chunks)} items to ChromaDB collection '{collection.name}'.")
    ids = [f"{pdf_filename}_chunk_{i}_{hashlib.md5(chunk.encode()).hexdigest()[:8]}" for i, chunk in enumerate(chunks)] # Create unique IDs
    metadatas = [{"source": pdf_filename, "chunk_index": i} for i in range(len(chunks))]

    try:
        collection.add(
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Successfully added {len(ids)} items to ChromaDB.")
        return True
    except Exception as e:
        # Consider more specific error handling (e.g., chromadb.errors.IDAlreadyExistsError)
        logger.error(f"Error adding data to ChromaDB: {e}")
        return False

def query_chromadb(collection, query_text, n_results=5):
    """Queries the ChromaDB collection for relevant chunks based on the query text."""
    logger.info(f"Querying ChromaDB collection '{collection.name}' with query: '{query_text[:50]}...'")
    try:
        # Generate embedding for the query itself
        query_embedding_result = genai.embed_content(
            model="models/embedding-001",
            content=query_text,
            task_type="retrieval_query" # Use "retrieval_query" for the query text
        )
        query_embedding = query_embedding_result['embedding']

        results = collection.query(
            query_embeddings=[query_embedding], # Query expects a list of embeddings
            n_results=n_results,
            include=['documents'] # Include the actual text chunks in the results
        )
        # The result structure is a dict containing lists for ids, embeddings, documents, metadatas, distances.
        # Since we query with one embedding, we access the first element of the 'documents' list.
        retrieved_chunks = results.get('documents', [[]])[0]
        logger.info(f"Retrieved {len(retrieved_chunks)} relevant chunks from ChromaDB.")
        return retrieved_chunks
    except Exception as e:
        logger.error(f"Error querying ChromaDB: {e}")
        return [] # Return empty list on error

def generate_response(query_text, context_chunks):
    """Generates a response using Gemini based on the query and context."""
    logger.info("Generating response using Gemini.")
    if not context_chunks:
        logger.warning("No context chunks provided for response generation.")
        # Optionally return a default message or try generating without context
        # return "I couldn't find relevant information in the provided documents to answer your question."

    # Construct the prompt
    context = "\n\n".join(context_chunks)
    prompt = f"""Based ONLY on the following context:

Context:
{context}

---

Answer the following question:
Question: {query_text}

Answer:"""

    logger.debug(f"Generated prompt for Gemini: {prompt}")

    try:
        model = genai.GenerativeModel('gemini-1.5-flash') # Or another suitable model like 'gemini-pro'
        response = model.generate_content(prompt)
        logger.info("Successfully generated response from Gemini.")
        # Basic check if response has text
        if response.text:
             return response.text
        else:
             # Handle cases where the model might return empty or blocked responses
             logger.warning(f"Gemini response was empty or blocked. Reason: {response.prompt_feedback}")
             return "I am sorry, I cannot provide an answer based on the available information or the query might be inappropriate."

    except Exception as e:
        logger.error(f"Error generating response from Gemini: {e}")
        return "An error occurred while generating the response."

