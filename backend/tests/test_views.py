from django.test import TestCase, Client
from django.contrib.auth.models import User
from .models import AnalysisResult, LanguageAnalysis
from unittest.mock import patch
from .analysis_utils import analyze_java, analyze_python
from .analysis_utils.analyze_typescript import analyzeTypeScriptRepository
from .analysis_utils.analyze_cpp import analyze_cpp

class AnalysisTests(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.user.role = 'admin'  # Assuming you have a role field on your User model
        self.user.save()
        self.client.login(username='testuser', password='testpassword')

    @patch('analyzer.views.analyze_python.analyze_python_repository')
    @patch('analyzer.views.analyzeTypeScriptRepository')
    @patch('analyzer.views.analyze_java.analyze_java')
    @patch('analyzer.views.analyze_cpp')
    def test_analyze_repo_success(self, mock_cpp, mock_java, mock_typescript, mock_python):
        # Mock the analysis functions to return successful results
        mock_python.return_value = {'success': True, 'nodes': [], 'links': []}
        mock_typescript.return_value = {'success': True, 'nodes': [], 'links': []}
        mock_java.return_value = {'success': True, 'nodes': [], 'links': []}
        mock_cpp.return_value = {'success': True, 'nodes': [], 'links': []}

        # Test a valid repository URL
        repo_url = 'https://github.com/testuser/testrepo.git'
        response = self.client.post('/analyze_repo/', {'repo_url': repo_url})

        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.json())
        self.assertIn('analysis_id', response.json())

        # Check if analysis results were saved to the database
        analysis_result = AnalysisResult.objects.get(repo_url=repo_url)
        self.assertEqual(analysis_result.repo_url, repo_url)
        self.assertEqual(LanguageAnalysis.objects.filter(analysis_result=analysis_result).count(), 4)

    def test_analyze_repo_invalid_url(self):
        # Test an invalid repository URL
        repo_url = 'invalid_url'
        response = self.client.post('/analyze_repo/', {'repo_url': repo_url})

        # Assertions
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    @patch('analyzer.views.analyze_python.analyze_python_repository')
    def test_analyze_repo_analysis_failure(self, mock_python):
        # Mock the analysis function to return a failure result
        mock_python.return_value = {'success': False, 'error': 'Analysis failed'}

        # Test a valid repository URL
        repo_url = 'https://github.com/testuser/testrepo.git'
        response = self.client.post('/analyze_repo/', {'repo_url': repo_url})

        # Assertions
        self.assertEqual(response.status_code, 500)
        self.assertIn('success', response.json())
        self.assertEqual(response.json()['success'], False)
        self.assertIn('messages', response.json())

    def test_get_function_code_success(self):
        # Create a LanguageAnalysis object with a function node
        analysis_result = AnalysisResult.objects.create(repo_url='https://github.com/testuser/testrepo.git')
        language_analysis = LanguageAnalysis.objects.create(
            analysis_result=analysis_result,
            language='python',
            nodes=[{'id': 'function_id', 'code': 'def test_function():\n    pass'}],
            links=[]
        )

        # Test retrieving the function code
        response = self.client.get('/get_function_code/', {'function_id': 'function_id'})

        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), 'def test_function():\n    pass')

    def test_get_function_code_not_found(self):
        # Test retrieving a non-existent function
        response = self.client.get('/get_function_code/', {'function_id': 'non_existent_function'})

        # Assertions
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.json())

    def test_get_function_code_missing_parameter(self):
        # Test missing function_id parameter
        response = self.client.get('/get_function_code/')

        # Assertions
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())