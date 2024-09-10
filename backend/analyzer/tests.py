# backend/analyzer/tests.py
import os
import shutil
import tempfile
from django.test import TestCase, Client
from django.contrib.auth.models import User
from .models import AnalysisResult, LanguageAnalysis
from .analysis_utils import analyze_python, analyze_java, analyze_typescript
from .analysis_utils.analyze_cpp import analyze_cpp
from .views import is_valid_repo_url, ALLOWED_REPO_HOSTS

class AnalyzerTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client.login(username='testuser', password='testpassword')
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    # ... (Your existing language-specific analysis tests) ...

    def test_analyze_repo_view_success(self):
        repo_url = 'https://github.com/octocat/Spoon-Knife.git'
        response = self.client.post('/api/v1/analyze/', {'repo_url': repo_url})
        self.assertEqual(response.status_code, 200)
        self.assertIn('analysis_id', response.json())

        # Check if AnalysisResult object was created
        analysis_result = AnalysisResult.objects.get(id=response.json()['analysis_id'])
        self.assertEqual(analysis_result.repo_url, repo_url)
        self.assertEqual(analysis_result.user, self.user)

        # Check if LanguageAnalysis objects were created (at least one)
        language_analyses = LanguageAnalysis.objects.filter(analysis_result=analysis_result)
        self.assertGreater(language_analyses.count(), 0)

    def test_analyze_repo_view_invalid_url(self):
        repo_url = 'invalid-url'
        response = self.client.post('/api/v1/analyze/', {'repo_url': repo_url})
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    def test_analyze_repo_view_unauthorized(self):
        self.client.logout()  # Log out the user
        repo_url = 'https://github.com/octocat/Spoon-Knife.git'
        response = self.client.post('/api/v1/analyze/', {'repo_url': repo_url})
        self.assertEqual(response.status_code, 401)  # Expect Unauthorized

    def test_is_valid_repo_url(self):
        # Valid URLs
        self.assertTrue(is_valid_repo_url("https://github.com/user/repo.git")[0])
        self.assertTrue(is_valid_repo_url("https://github.com/user/repo")[0])
        self.assertTrue(is_valid_repo_url("https://gitlab.com/user/repo.git")[0])
        self.assertTrue(is_valid_repo_url("https://gitlab.com/user/repo")[0])

        # Invalid URLs
        self.assertFalse(is_valid_repo_url("http://github.com/user/repo.git")[0])  # Not HTTPS
        self.assertFalse(is_valid_repo_url("https://www.example.com/user/repo.git")[0])  # Not allowed host
        self.assertFalse(is_valid_repo_url("ftp://github.com/user/repo.git")[0])  # Invalid protocol
        self.assertFalse(is_valid_repo_url("https://github.com/../repo.git")[0])  # Path traversal attempt
        self.assertFalse(is_valid_repo_url("https://github.com/user/repo/../../other_repo.git")[0])  # Path traversal attempt

        # Test with dynamically generated allowed hosts
        allowed_hosts = ['github.com', 'gitlab.com', 'bitbucket.org']
        with self.settings(ALLOWED_REPO_HOSTS=allowed_hosts):
            self.assertTrue(is_valid_repo_url("https://bitbucket.org/user/repo.git")[0])  # Now allowed

    def test_get_function_code_view(self):
        # Create a sample analysis result with Python code
        analysis_result = AnalysisResult.objects.create(repo_url='https://github.com/test/repo', user=self.user)
        language_analysis = LanguageAnalysis.objects.create(
            analysis_result=analysis_result,
            language='python',
            nodes=[
                {'id': 'test.py', 'type': 'file'},
                {'id': 'my_function', 'type': 'function', 'parent': 'test.py', 'code': 'def my_function():\n    print("Hello")\n'}
            ],
            links=[]
        )

        # Test getting the code for 'my_function'
        response = self.client.get('/api/get_function_code/', {'function_id': 'my_function'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), 'def my_function():\n    print("Hello")\n')

        # Test getting the code for a non-existent function
        response = self.client.get('/api/get_function_code/', {'function_id': 'nonexistent_function'})
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.json())