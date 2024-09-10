from django.db import models
from  django.contrib.auth.models import  AbstractUser

class CustomUser(AbstractUser):  
    ROLE_CHOICES  =  ( 
        ('standard',  'Standard  User'),  
        ('admin', 'Administrator'), 
    )  

    role = models.CharField(max_length=20, choices=ROLE_CHOICES,  default='standard')

class AnalysisResult(models.Model):
    repo_url = models.URLField(unique=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='analysis_results')

    def __str__(self):
        return f"AnalysisResult for {self.repo_url}"

class LanguageAnalysis(models.Model): 
    """Model to store individual language analysis results."""

    LANGUAGE_CHOICES = [
        ("python", "Python"),
        ("java", "Java"), 
        ("typescript", "TypeScript"),
        ("cpp", "C++"),
        # ... other language choices ...  
    ] 

    analysis_result = models.ForeignKey(
        AnalysisResult,
        on_delete=models.CASCADE, 
        related_name="language_analyses" 
    )
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES) 

    # Use JSONField for nodes and links
    nodes = models.JSONField()  
    links = models.JSONField()  

    def __str__(self): 
       return f"{self.language} analysis for {self.analysis_result.repo_url}"
    