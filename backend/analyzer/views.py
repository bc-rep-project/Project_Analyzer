import os
import json
import git
import re
from django.db import IntegrityError
import tempfile
import logging
import multiprocessing
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

# Direct imports of analysis functions
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from .models import CustomUser
from .serializers import UserSerializer, AnalysisResultSerializer
from .analysis_utils import analyze_java, analyze_python
from .models import AnalysisResult, LanguageAnalysis
from .analysis_utils.analyze_typescript import analyzeTypeScriptRepository
from .analysis_utils.analyze_cpp import analyze_cpp
from urllib.parse import urlparse
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import AnalysisResultSerializer
from django.http import JsonResponse,  HttpResponse
from  django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from  django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
# from .serializers import AnalysisResultSerializer
from django.core.exceptions import PermissionDenied
from . import views
from django.shortcuts import render

ALLOWED_REPO_HOSTS = ['github.com', 'gitlab.com']
ALLOWED_REPO_URL_REGEX = r'^(https://)(?:[a-zA-Z0-9]+.)*(?:github|gitlab).com/(?:[a-zA-Z0-9_\.-]+/)+(?:[a-zA-Z0-9_\.-]+)(.git)?$'

# Error Codes
ERROR_INVALID_REPO_URL = "INVALID_REPO_URL"
ERROR_REPO_CLONE_FAILED = "REPO_CLONE_FAILED"
ERROR_ANALYSIS_FAILED = "ANALYSIS_FAILED"
ERROR_ANALYSIS_NOT_FOUND = "ANALYSIS_NOT_FOUND"
ERROR_LANGUAGE_ANALYSIS_NOT_FOUND = "LANGUAGE_ANALYSIS_NOT_FOUND"
ERROR_UNAUTHORIZED = "UNAUTHORIZED"
ERROR_PERMISSION_DENIED = "PERMISSION_DENIED"

def index(request):
    return render(request, 'index.html')

def is_valid_repo_url(repo_url):
    """Performs stricter validation on the repository URL."""
    # --- 1. Sanitize for Path Traversal  ---
    repo_url = repo_url.replace("../", "")  # Remove '../'
    repo_url = repo_url.replace("..\\", "")  # For Windows-style paths

    #  --- 2. Basic Check:  HTTPS ---
    if not repo_url.startswith("https://"):
        return False, "Only HTTPS repository URLs are supported."

    # ---  3. Basic format and allowed hosts using regex ---
    if not re.match(ALLOWED_REPO_URL_REGEX, repo_url):
        return False, "Invalid repository URL format."

    # --- 4. Check allowed hosts  ----
    parsed_url = urlparse(repo_url)
    if parsed_url.hostname not in ALLOWED_REPO_HOSTS:
        return False, f"Repository URL host must be one of: {', '.join(ALLOWED_REPO_HOSTS)}"

    return True, ''  # URL is valid


# --------- Utility Functions ---------

@login_required
@csrf_exempt
def clone_repository(request):
    """Endpoint for cloning a repository (admin only)."""
    if request.method == 'POST' and request.user.role == 'admin':
        repo_url = request.POST.get('repo_url', '')
        if not repo_url:
            return JsonResponse({'error': 'Missing \'repo_url\' parameter.'}, status=400)

        # ----- Validate Repository URL -----
        is_valid, error_message = is_valid_repo_url(repo_url)
        if not is_valid:
            return JsonResponse({'error': error_message}, status=400)

        # Create a safe directory name
        repo_name = re.sub(r'[^\w\s-]', '_', repo_url.split('/')[-1].replace('.git', ''))
        repo_path = os.path.join(settings.BASE_DIR, 'analyzer', 'repositories', repo_name)

        # -------- Clone or Pull Repository -------
        try:
            if os.path.exists(repo_path):
                # Pull latest changes
                repo = git.Repo(repo_path)
                origin = repo.remotes.origin
                origin.pull()
            else:
                # Clone the repository
                repo = git.Repo.clone_from(repo_url, repo_path)
            return JsonResponse({'message': f'Repository cloned successfully to {repo_path}'})
        except git.GitCommandError as e:
            return JsonResponse({'error': f"Git error: {e}"}, status=500)
        except Exception as e:
            return JsonResponse({'error': f"Error during clone/pull: {e}"}, status=500)
    else:
        return JsonResponse({"error": "Unauthorized."}, status=401)


def run_analysis(repo_path):
    """Runs analysis on the cloned repo for all supported languages."""
    results = {
        "python": None,
        "typescript": None,
        "java": None,
        "cpp": None,
        "success": True,
        "messages": []
    }

    analysis_tasks = [
        (analyze_python.analyze_python_repository, "python", "Python analysis"),
        (analyzeTypeScriptRepository, "typescript", "TypeScript analysis"),
        (analyze_java.analyze_java, "java", "Java analysis"),
        (analyze_cpp, "cpp", "C++ analysis")
    ]

    for analysis_func, language, message in analysis_tasks:
        try:
            analysis_data = analysis_func(repo_path)
            if 'error' in analysis_data:
                results["success"] = False
                results["messages"].append(f"{message} error: {analysis_data['error']}")
            else:
                results[language] = analysis_data
                results["messages"].append(f"{message} successful.")
        except Exception as e:
            results["success"] = False
            results["messages"].append(f"{message} failed: {str(e)}")

    return results

# Get a logger instance
logger = logging.getLogger(__name__)

@login_required
@csrf_exempt
def analyze_repo(request):
    """Receives a repo URL from the authenticated user and analyzes it."""
    if request.method == 'POST':
        repo_url = request.POST.get('repo_url')
        logger.info(f"Received request to analyze repository: {repo_url}")
        if not repo_url:
            return JsonResponse({'error': {'code': ERROR_INVALID_REPO_URL, 'message': 'Missing \'repo_url\' parameter.'}}, status=400)

        # ----- Validate Repository URL -----
        is_valid, error_message = is_valid_repo_url(repo_url)
        if not is_valid:
            return JsonResponse({'error': {'code': ERROR_INVALID_REPO_URL, 'message': error_message}}, status=400)

        try:
            # Create a safe directory name
            repo_name = re.sub(r'[^\w\s-]', '_', repo_url.split('/')[-1].replace('.git', ''))
            repo_path = os.path.join(settings.BASE_DIR, 'analyzer', 'repositories', repo_name)

            # ------- Clone Repo or Pull Latest Changes (Admin-Only) ------
            if request.user.role == 'admin':
                clone_message = clone_repository(request)  # Pass request object
                if 'error' in clone_message.content.decode():
                    return clone_message

            # ---- Perform analysis (for both admins and standard users) ----
            analysis_results = run_analysis(repo_path)

            # ---- 1. Create Analysis Result (linked to the user) ----
            try:
                analysis_result = AnalysisResult.objects.create(repo_url=repo_url,
                                                                user=request.user)  # Link to the user!
            except IntegrityError:
                analysis_result = AnalysisResult.objects.get(repo_url=repo_url, user=request.user)
                return JsonResponse({'message': 'Analysis for this repository already exists for this user.'}, status=400)

            # ---- 2. Save language analyses ----
            if analysis_results['success']:
                for language in ["python", "typescript", "java", "cpp"]:
                    if analysis_results[language]:
                        LanguageAnalysis.objects.create(
                            analysis_result=analysis_result,
                            language=language,
                            nodes=analysis_results[language].get("nodes", []),
                            links=analysis_results[language].get("links", [])
                        )

            logger.info(f"Analysis of repository {repo_url} completed successfully.")

            # --- Return Analysis ID in case of success ---
            if analysis_results['success']:
                return JsonResponse({'message': 'Analysis completed successfully.', 'analysis_id': analysis_result.id})
            else:
                return JsonResponse({'error': {'code': ERROR_ANALYSIS_FAILED, 'message': analysis_results['messages']}}, status=500)

        except git.GitCommandError as e:
            logger.error(f"Error cloning repository {repo_url}: {str(e)}")
            return JsonResponse({'error': {'code': ERROR_REPO_CLONE_FAILED, 'message': f"Error cloning repository: {str(e)}"}}, status=500)
        except Exception as e:
            logger.error(f"Error analyzing repository {repo_url}: {str(e)}")
            return JsonResponse({'error': {'code': ERROR_ANALYSIS_FAILED, 'message': f"An error occurred during analysis: {str(e)}"}}, status=500)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def get_function_code(request):
    """Endpoint to retrieve the code of a function."""
    if request.method == 'GET':
        try:
            function_id = request.GET.get('function_id', '')
            if not function_id:
                return JsonResponse({'error': 'Missing \'function_id\' parameter.'}, status=400)

            # ----------- Retrieve Function Code  Logic -----------
            language_analysis = LanguageAnalysis.objects.filter(nodes__contains=[{'id': function_id}]).first()
            if language_analysis:
                for node in language_analysis.nodes:
                    if node.get('id') == function_id and 'code' in node:
                        code = node['code']
                        return HttpResponse(code, content_type='text/plain')

            return JsonResponse({'error': 'Function not found or code unavailable.'}, status=404)

        except ObjectDoesNotExist:
            return JsonResponse({'error': f'No analysis data found for function ID: {function_id}'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'An unexpected server error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


# Individual language analysis views (for debugging/testing)
def analyze_python(request):
    """Analyzes a Python repository."""
    repo_path = request.GET.get('repo_path')
    if not repo_path:
        return JsonResponse({"error": "Missing 'repo_path' parameter"}, status=400)

    try:
        analysis_data = analyze_python.analyze_python_repository(repo_path)
        return JsonResponse(analysis_data)
    except Exception as e:
        return JsonResponse({"error": f"Error in Python analysis: {str(e)}"}, status=500)


def analyze_typescript(request):
    """Analyzes a TypeScript repository."""
    repo_path = request.GET.get('repo_path')
    if not repo_path:
        return JsonResponse({"error": "Missing 'repo_path' parameter"}, status=400)

    try:
        analysis_data = analyzeTypeScriptRepository(repo_path)
        return JsonResponse(analysis_data)
    except Exception as e:
        return JsonResponse({"error": f"Error in TypeScript analysis: {str(e)}"}, status=500)


def analyze_java(request):
    """Analyzes a Java repository."""
    repo_path = request.GET.get('repo_path')
    if not repo_path:
        return JsonResponse({"error": "Missing 'repo_path' parameter"}, status=400)

    try:
        analysis_data = analyze_java.analyze_java(repo_path)
        return JsonResponse(analysis_data)
    except Exception as e:
        return JsonResponse({"error": f"Error in Java analysis: {str(e)}"}, status=500)


def analyze_cpp(request):
    """Analyzes a C++ repository."""
    repo_path = request.GET.get('repo_path')
    if not repo_path:
        return JsonResponse({"error": "Missing 'repo_path' parameter"}, status=400)

    try:
        analysis_data = analyze_cpp(repo_path)
        return JsonResponse(analysis_data)
    except Exception as e:
        return JsonResponse({"error": f"Error in C++ analysis: {str(e)}"}, status=500)

# --------- API v1 Views ---------
class AnalyzeRepoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        repo_url = request.data.get('repo_url')
        if not repo_url:
            return Response({'error': {'code': ERROR_INVALID_REPO_URL, 'message': 'Missing \'repo_url\' parameter.'}}, status=400)

        # --- Validate Repository URL ---
        is_valid, error_message = is_valid_repo_url(repo_url)
        if not is_valid:
            return Response({'error': {'code': ERROR_INVALID_REPO_URL, 'message': error_message}}, status=400)

        # --- Clone or Pull Repository (Admin-Only) ---
        if request.user.role == 'admin':
            clone_message = views.clone_repository(request)
            if 'error' in clone_message.content.decode():
                return Response({'error': clone_message.content.decode()}, status=500)

        # --- Perform Analysis ---
        repo_name = re.sub(r'[^\w\s-]', '_', repo_url.split('/')[-1].replace('.git', ''))
        repo_path = os.path.join(settings.BASE_DIR, 'analyzer', 'repositories', repo_name)
        analysis_results = views.run_analysis(repo_path)

        # --- Create AnalysisResult ---
        try:
            analysis_result = AnalysisResult.objects.create(repo_url=repo_url, user=request.user)
        except IntegrityError:
            analysis_result = AnalysisResult.objects.get(repo_url=repo_url, user=request.user)
            return Response({'message': 'Analysis for this repository already exists for this user.'}, status=400)

        # --- Save Language Analyses ---
        if analysis_results['success']:
            for language in ["python", "typescript", "java", "cpp"]:
                if analysis_results[language]:
                    LanguageAnalysis.objects.create(
                        analysis_result=analysis_result,
                        language=language,
                        nodes=analysis_results[language].get("nodes", []),
                        links=analysis_results[language].get("links", [])
                    )

        # --- Return Response ---
        if analysis_results['success']:
            return Response({'message': 'Analysis completed successfully.', 'analysis_id': analysis_result.id})
        else:
            return Response({'error': {'code': ERROR_ANALYSIS_FAILED, 'message': analysis_results['messages']}}, status=500)

class UserRegistrationView(generics.CreateAPIView):
    """View for registering new users."""
    permission_classes = (permissions.AllowAny,)  # Allow anyone to register
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate token for the new user
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'user': serializer.data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)

class UserLoginView(generics.GenericAPIView):
    """View for user login."""
    permission_classes = (permissions.AllowAny,)  # Allow anyone to login
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to access it.
    """

    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == 'admin':
            return True

        # Otherwise, only the owner can access
        return obj.user == request.user

class AnalysisResultListView(generics.ListAPIView):
    """View for listing analysis results."""
    permission_classes = (permissions.IsAuthenticated,)  # Only authenticated users can list
    serializer_class = AnalysisResultSerializer

    def get_queryset(self):
        """
        Return a list of all analysis results for the currently authenticated user.
        """
        user = self.request.user
        return AnalysisResult.objects.filter(user=user)

class AnalysisResultDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating, and deleting a specific analysis result."""
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrAdmin)  # Authenticated owners or admins
    serializer_class = AnalysisResultSerializer
    queryset = AnalysisResult.objects.all()

class AnalysisResultCreateView(generics.CreateAPIView):
    """View for creating a new analysis result."""
    permission_classes = (permissions.IsAuthenticated,)  # Only authenticated users can create
    serializer_class = AnalysisResultSerializer

    def perform_create(self, serializer):
        """
        Set the user to the currently authenticated user when creating a new analysis result.
        """
        serializer.save(user=self.request.user)

class AnalysisResultDetailView(generics.RetrieveAPIView):
    """View for retrieving a specific analysis result."""
    permission_classes = (permissions.IsAuthenticated,)  # Only authenticated users can view
    serializer_class = AnalysisResultSerializer
    queryset = AnalysisResult.objects.all()

    def get_object(self):
        obj = super().get_object()
        # Check if the authenticated user owns the analysis result
        if obj.user != self.request.user:
            raise PermissionDenied("You are not authorized to view this analysis result.")
        return obj

class AnalysisResultDetailView(APIView):
    def get(self, request, analysis_id):
        try:
            analysis_result = AnalysisResult.objects.get(pk=analysis_id)
            serializer = AnalysisResultSerializer(analysis_result)
            return Response(serializer.data)
        except AnalysisResult.DoesNotExist:
            return Response({'error': 'Analysis result not found.'}, status=404)

class LanguageAnalysisListView(APIView):
    def get(self, request, analysis_id):
        try:
            analysis_result = AnalysisResult.objects.get(pk=analysis_id)
            language_analyses = LanguageAnalysis.objects.filter(analysis_result=analysis_result)
            data = [{'language': la.language, 'nodes': la.nodes, 'links': la.links} for la in language_analyses]
            return Response(data)
        except AnalysisResult.DoesNotExist:
            return Response({'error': 'Analysis result not found.'}, status=404)

class CppAnalysisView(APIView):
    def get(self, request):
        repo_path = request.GET.get('repo_path')
        if not repo_path:
            return Response({"error": "Missing 'repo_path' parameter"}, status=400)

        try:
            analysis_data = analyze_cpp(repo_path)
            if 'error' in analysis_data:
                return Response({"error": analysis_data['error']}, status=500)
            else:
                serializer = AnalysisResultSerializer(analysis_data)
                return Response(serializer.data)
        except Exception as e:
            return Response({"error": f"Error in C++ analysis: {str(e)}"}, status=500)


class JavaAnalysisView(APIView):
    def get(self, request):
        repo_path = request.GET.get('repo_path')
        if not repo_path:
            return Response({"error": "Missing 'repo_path' parameter"}, status=400)

        try:
            analysis_data = analyze_java.analyze_java(repo_path)
            if 'error' in analysis_data:
                return Response({"error": analysis_data['error']}, status=500)
            else:
                serializer = AnalysisResultSerializer(analysis_data)
                return Response(serializer.data)
        except Exception as e:
            return Response({"error": f"Error in Java analysis: {str(e)}"}, status=500)


class PythonAnalysisView(APIView):
    def get(self, request):
        repo_path = request.GET.get('repo_path')
        if not repo_path:
            return Response({"error": "Missing 'repo_path' parameter"}, status=400)

        try:
            analysis_data = analyze_python.analyze_python_repository(repo_path)
            if 'error' in analysis_data:
                return Response({"error": analysis_data['error']}, status=500)
            else:
                serializer = AnalysisResultSerializer(analysis_data)
                return Response(serializer.data)
        except Exception as e:
            return Response({"error": f"Error in Python analysis: {str(e)}"}, status=500)


class TypeScriptAnalysisView(APIView):
    def get(self, request):
        repo_path = request.GET.get('repo_path')
        if not repo_path:
            return Response({"error": "Missing 'repo_path' parameter"}, status=400)

        try:
            analysis_data = analyzeTypeScriptRepository(repo_path)
            if 'error' in analysis_data:
                return Response({"error": analysis_data['error']}, status=500)
            else:
                serializer = AnalysisResultSerializer(analysis_data)
                return Response(serializer.data)
        except Exception as e:
            return Response({"error": f"Error in TypeScript analysis: {str(e)}"}, status=500)
        
class RepositoryListView(APIView):
    def get(self, request):
        # --- Filtering ---
        user_id = request.GET.get('user_id')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        repo_url = request.GET.get('repo_url')

        repositories = AnalysisResult.objects.all()

        if user_id:
            repositories = repositories.filter(user_id=user_id)
        if date_from:
            repositories = repositories.filter(created_at__gte=date_from)
        if date_to:
            repositories = repositories.filter(created_at__lte=date_to)
        if repo_url:
            repositories = repositories.filter(repo_url__icontains=repo_url)

        # --- Pagination ---
        page_size = request.GET.get('page_size', 10)  # Default page size is 10
        page = request.GET.get('page', 1)  # Default page is 1

        paginator = Paginator(repositories, page_size)
        try:
            repositories = paginator.page(page)
        except PageNotAnInteger:
            repositories = paginator.page(1)
        except EmptyPage:
            repositories = paginator.page(paginator.num_pages)

        serializer = AnalysisResultSerializer(repositories, many=True)
        return Response({
            'results': serializer.data,
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': repositories.number,
        })
class UserAnalysisListView(APIView):
    permission_classes = [IsAuthenticated]  # Require authentication

    def get(self, request):
        try:
            # --- Filtering ---
            date_from = request.GET.get('date_from')
            date_to = request.GET.get('date_to')
            repo_url = request.GET.get('repo_url')

            analysis_results = AnalysisResult.objects.filter(user=request.user)

            if date_from:
                analysis_results = analysis_results.filter(created_at__gte=date_from)
            if date_to:
                analysis_results = analysis_results.filter(created_at__lte=date_to)
            if repo_url:
                analysis_results = analysis_results.filter(repo_url__icontains=repo_url)

            # --- Pagination ---
            page_size = request.GET.get('page_size', 10)  # Default page size is 10
            page = request.GET.get('page', 1)  # Default page is 1

            paginator = Paginator(analysis_results, page_size)
            try:
                analysis_results = paginator.page(page)
            except PageNotAnInteger:
                analysis_results = paginator.page(1)
            except EmptyPage:
                analysis_results = paginator.page(paginator.num_pages)

            serializer = AnalysisResultSerializer(analysis_results, many=True)
            return Response({
                'results': serializer.data,
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': analysis_results.number,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)

class DeleteAnalysisResultView(APIView):
    permission_classes = [IsAuthenticated]  # Require authentication

    def delete(self, request, analysis_id):
        try:
            analysis_result = AnalysisResult.objects.get(pk=analysis_id)

            # Authorization check: Only allow deletion if the user owns the result
            if analysis_result.user != request.user:
                raise PermissionDenied("You are not authorized to delete this analysis result.")

            analysis_result.delete()
            return Response({'message': 'Analysis result deleted successfully.'})

        except AnalysisResult.DoesNotExist:
            return Response({'error': 'Analysis result not found.'}, status=404)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=403)