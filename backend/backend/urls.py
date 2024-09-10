"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# project_analyzer/backend/backend/urls.py  
from django.contrib import admin
from django.urls import path, include
from analyzer import views
from  rest_framework_simplejwt.views import  ( 
    TokenObtainPairView,  
   TokenRefreshView,
 )

urlpatterns = [ 
    path('admin/', admin.site.urls), 
    path('', views.index, name='index'),
    path('api/', include('analyzer.urls')),
    path('api/analyze/cpp/', views.CppAnalysisView.as_view(), name='cpp_analysis'),
    path('api/analyze/python/', views.PythonAnalysisView.as_view(), name='python_analysis'),
    path('api/analyze/typescript/', views.TypeScriptAnalysisView.as_view(), name='typescript_analysis'),
    path('api/analyze/java/', views.JavaAnalysisView.as_view(), name='java_analysis'),
    path('api/get_function_code/',  views.get_function_code, name='get_function_code'),
    path('api/token/',  TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/token/refresh/',  TokenRefreshView.as_view(), name='token_refresh'),
    path('api/clone/', views.clone_repository, name='clone_repository'),
]


# # Call clone_and_analyze after URLs are loaded
# from django.core.management import call_command 
# from django.urls import reverse
# # ... (rest of your urlpatterns) ... 
# try: 
#     repo_url = 'https://github.com/Pythagora-io/gpt-pilot' # Replace with the actual repository
#     call_command('runserver',  use_reloader=False)  # Start development server with analysis 
#     views.clone_and_analyze(
#             {'repo_url': repo_url, "request": {}}, # Provide dummy request object  
#     )  
# except Exception as e: 
#     print(f"An error occurred during initial analysis: {e}")