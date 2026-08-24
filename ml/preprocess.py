"""
Data Preprocessing module for CareerPredict AI
Provides cleaning, encoding, and transformation utilities for candidate features.
"""
import json
import os
import pickle

def get_preprocessor(preprocessor_path="ml/model/preprocessor.pkl"):
    if os.path.exists(preprocessor_path):
        with open(preprocessor_path, "rb") as f:
            return pickle.load(f)
    return None

def clean_input_features(raw_data):
    """
    Standardize frontend feature keys into expected model schema.
    """
    education = raw_data.get("education_level") or raw_data.get("educationLevel") or "Bachelor's"
    field = raw_data.get("field_of_study") or raw_data.get("fieldOfStudy") or "Computer Science"
    
    return {
        "age": float(raw_data.get("age", 22)),
        "education_level": str(education),
        "field_of_study": str(field),
        "years_experience": float(raw_data.get("years_experience", raw_data.get("yearsExperience", 0))),
        "internship_count": float(raw_data.get("internship_count", raw_data.get("internshipCount", 0))),
        "previous_jobs": float(raw_data.get("previous_jobs", raw_data.get("previousJobs", 0))),
        "technical_skill_score": float(raw_data.get("technical_skill_score", raw_data.get("technicalSkillScore", 50))),
        "web_development_score": float(raw_data.get("web_development_score", raw_data.get("webDevelopmentScore", 50))),
        "database_score": float(raw_data.get("database_score", raw_data.get("databaseScore", 50))),
        "data_structures_score": float(raw_data.get("data_structures_score", raw_data.get("dataStructuresScore", 50))),
        "algorithm_score": float(raw_data.get("algorithm_score", raw_data.get("algorithmScore", 50))),
        "machine_learning_score": float(raw_data.get("machine_learning_score", raw_data.get("machineLearningScore", 50))),
        "cloud_score": float(raw_data.get("cloud_score", raw_data.get("cloudScore", 50))),
        "communication_score": float(raw_data.get("communication_score", raw_data.get("communicationScore", 50))),
        "leadership_score": float(raw_data.get("leadership_score", raw_data.get("leadershipScore", 50))),
        "teamwork_score": float(raw_data.get("teamwork_score", raw_data.get("teamworkScore", 50))),
        "problem_solving_score": float(raw_data.get("problem_solving_score", raw_data.get("problemSolvingScore", 50))),
        "project_count": float(raw_data.get("project_count", raw_data.get("projectCount", 0))),
        "certification_count": float(raw_data.get("certification_count", raw_data.get("certificationCount", 0))),
        "resume_score": float(raw_data.get("resume_score", raw_data.get("resumeScore", 50))),
        "interview_score": float(raw_data.get("interview_score", raw_data.get("interviewScore", 50))),
        "aptitude_score": float(raw_data.get("aptitude_score", raw_data.get("aptitudeScore", 50))),
        "github_activity": float(raw_data.get("github_activity", raw_data.get("githubActivity", 50)))
    }
