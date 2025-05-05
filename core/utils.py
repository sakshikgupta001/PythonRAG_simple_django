import os
import google.generativeai as genai
import chromadb
from pypdf import PdfReader
from django.conf import settings

def extract_text_from_pdf(pdf_file_path):
    reader = PdfReader(pdf_file_path)
    text = "".join(page.extract_text() for page in reader.pages if page.extract_text())
    return text

def chunk_text(text, chunk_size=1000, overlap=100):
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size - overlap)]
    return chunks

def get_embeddings(text_chunks):
    result = genai.embed_content(
        model="models/embedding-001",
        content=text_chunks,
        task_type="retrieval_document"
    )
    return result['embedding']

def initialize_chromadb():
    client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    return client.get_or_create_collection(name=settings.CHROMA_COLLECTION_NAME)

def query_chromadb(collection, query_text, n_results=5):
    query_embedding = genai.embed_content(
        model="models/embedding-001",
        content=query_text,
        task_type="retrieval_query"
    )['embedding']
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results, include=['documents'])
    return results.get('documents', [[]])[0]

def generate_response(query_text, context_chunks):
    context = "\n\n".join(context_chunks)
    prompt = f"""Based ONLY on the following context:\n\n{context}\n\nAnswer the following question:\n{query_text}\n\nAnswer:"""
    response = genai.GenerativeModel('gemini-1.5-flash').generate_content(prompt)
    return response.text if response.text else "No answer available."

