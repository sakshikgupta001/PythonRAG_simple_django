from django.http import JsonResponse
from django.conf import settings
import os
import json
from . import utils

def upload_view(request):
    if request.method == 'POST' and request.FILES.get('pdf_file'):
        pdf_file = request.FILES['pdf_file']
        
        if not pdf_file.name.endswith('.pdf'):
            return JsonResponse({'success': False, 'message': "Please upload a valid PDF file."}, status=400)

        temp_path = os.path.join(settings.BASE_DIR, 'temp_uploads')
        os.makedirs(temp_path, exist_ok=True)
        file_path = os.path.join(temp_path, pdf_file.name)

        with open(file_path, 'wb') as f:
            for chunk in pdf_file.chunks():
                f.write(chunk)

        text = utils.extract_text_from_pdf(file_path)
        chunks = utils.chunk_text(text)
        embeddings = utils.get_embeddings(chunks)

        os.remove(file_path)
        return JsonResponse({'success': True, 'message': "File processed successfully."}, status=200)

    return JsonResponse({'success': False, 'message': "Please provide a PDF file to upload."}, status=400)

def query_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        query = data.get('query', '')
        if not query:
            return JsonResponse({'success': False, 'message': "Query cannot be empty."}, status=400)

        collection = utils.initialize_chromadb()
        context_chunks = utils.query_chromadb(collection, query, n_results=5)
        response_text = utils.generate_response(query, context_chunks)

        return JsonResponse({'success': True, 'query': query, 'response': response_text}, status=200)

    return JsonResponse({'success': False, 'message': "This endpoint accepts POST requests only."}, status=405)
