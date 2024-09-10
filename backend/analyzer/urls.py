# project_analyzer/backend/analyzer/urls.py 
from django.urls import path
from . import views

urlpatterns = [
    # API v1 URLs
    path('api/v1/analyze/', views.AnalyzeRepoView.as_view(), name='api_analyze_repo'),
    path('api/v1/analysis/<int:analysis_id>/', views.AnalysisResultDetailView.as_view(), name='analysis-result-detail'),
    path('api/v1/analysis/<int:analysis_id>/languages/', views.LanguageAnalysisListView.as_view(), name='language-analysis-list'),
    path('api/v1/repositories/', views.RepositoryListView.as_view(), name='repository-list'),
    path('api/v1/user-analyses/', views.UserAnalysisListView.as_view(), name='user-analysis-list'),
    path('api/v1/analysis/<int:analysis_id>/delete/', views.DeleteAnalysisResultView.as_view(), name='delete-analysis-result'),
    path('api/v1/analyze/cpp/', views.CppAnalysisView.as_view(), name='cpp-analysis'),
    path('api/v1/analyze/java/', views.JavaAnalysisView.as_view(), name='java-analysis'),
    path('api/v1/analyze/python/', views.PythonAnalysisView.as_view(), name='python-analysis'),
    path('api/v1/analyze/typescript/', views.TypeScriptAnalysisView.as_view(), name='typescript-analysis'),
    path('api/v1/register/', views.UserRegistrationView.as_view(), name='register'),
    path('api/v1/login/', views.UserLoginView.as_view(), name='login'),
    path('api/v1/analysis/<int:pk>/', views.AnalysisResultDetailView.as_view(), name='analysis-detail'),
    path('api/v1/analysis/', views.AnalysisResultListView.as_view(), name='analysis-list'),
    path('api/v1/analysis/create/', views.AnalysisResultCreateView.as_view(), name='analysis-create'),
    path('api/v1/analysis/<int:pk>/', views.AnalysisResultDetailView.as_view(), name='analysis-detail'),
]