
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_view, name='upload'),
    path('query/', views.query_view, name='query'),
    path('', views.query_view, name='home'), # Make query view the default home page
]
