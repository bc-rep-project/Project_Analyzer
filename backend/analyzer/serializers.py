# backend/analyzer/serializers.py

from rest_framework import serializers
from .models import AnalysisResult, CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role')

class AnalysisResultSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Include user details in the serialized output

    class Meta:
        model = AnalysisResult
        fields = '__all__'