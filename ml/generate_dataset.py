"""
Generate realistic synthetic job prediction dataset for CareerPredict AI
Dataset is created for educational and career-guidance research purposes with balanced realistic distributions.
"""
import random
import math
import csv
import os

def generate_dataset(num_samples=5000, output_path="ml/dataset/job_prediction_dataset.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    random.seed(42)
    
    education_levels = ["Diploma", "Bachelor's", "Master's", "PhD"]
    edu_weights = [0.15, 0.60, 0.20, 0.05]
    edu_boost = {"Diploma": -0.6, "Bachelor's": 0.0, "Master's": 0.5, "PhD": 0.9}
    
    field_options = ["Computer Science", "Information Technology", "Data Science", "Electrical Engineering", "Other"]
    
    headers = [
        "age",
        "education_level",
        "field_of_study",
        "years_experience",
        "internship_count",
        "previous_jobs",
        "technical_skill_score",
        "web_development_score",
        "database_score",
        "data_structures_score",
        "algorithm_score",
        "machine_learning_score",
        "cloud_score",
        "communication_score",
        "leadership_score",
        "teamwork_score",
        "problem_solving_score",
        "project_count",
        "certification_count",
        "resume_score",
        "interview_score",
        "aptitude_score",
        "github_activity",
        "desired_role",
        "job_received"
    ]
    
    roles = [
        "Software Developer", "Frontend Developer", "Backend Developer",
        "Full Stack Developer", "Data Analyst", "Machine Learning Engineer",
        "QA Engineer", "DevOps Engineer", "Cloud Engineer"
    ]
    
    rows = []
    
    for _ in range(num_samples):
        age = random.randint(20, 42)
        max_exp = max(0, age - 21)
        years_experience = round(min(max_exp, random.expovariate(0.35)), 1)
        if years_experience > 14:
            years_experience = 14.0
            
        internship_count = random.choices([0, 1, 2, 3, 4], weights=[0.30, 0.35, 0.20, 0.10, 0.05])[0]
        previous_jobs = 0 if years_experience < 1 else random.randint(1, min(5, int(years_experience // 1.5) + 1))
        
        education_level = random.choices(education_levels, weights=edu_weights)[0]
        field_of_study = random.choice(field_options)
        desired_role = random.choice(roles)
        
        # Skill distributions (0 to 100) centered around realistic student/pro values
        base_ability = random.gauss(58, 16)
        base_ability = max(15, min(95, base_ability))
        
        def clamp_score(val):
            return int(max(5, min(100, round(val))))
            
        tech_score = clamp_score(random.gauss(base_ability, 9) + years_experience * 1.8)
        web_score = clamp_score(random.gauss(base_ability, 12))
        db_score = clamp_score(random.gauss(base_ability, 12))
        dsa_score = clamp_score(random.gauss(base_ability, 14))
        algo_score = clamp_score(random.gauss(base_ability, 14))
        ml_score = clamp_score(random.gauss(base_ability - 5, 15))
        cloud_score = clamp_score(random.gauss(base_ability - 5, 15))
        
        comm_score = clamp_score(random.gauss(60, 15))
        leader_score = clamp_score(random.gauss(55, 16))
        team_score = clamp_score(random.gauss(65, 14))
        problem_solving = clamp_score(random.gauss(base_ability, 12))
        
        project_count = int(max(0, min(12, round(random.gauss(1.8 + (tech_score / 35), 1.6)))))
        cert_count = int(max(0, min(8, round(random.gauss(1.2 + (cloud_score / 50), 1.2)))))
        
        resume_score = clamp_score(0.35 * tech_score + 0.3 * comm_score + 0.35 * random.gauss(60, 14) + project_count * 2)
        interview_score = clamp_score(0.4 * comm_score + 0.4 * problem_solving + 0.2 * random.gauss(58, 15))
        aptitude_score = clamp_score(0.6 * problem_solving + 0.4 * random.gauss(60, 15))
        github_activity = clamp_score(project_count * 6 + tech_score * 0.35 + random.gauss(15, 18))
        
        # Latent log-odds z calibrated to have ~50% positive rate around avg scores:
        # Benchmark profile (tech=60, comm=60, prob=60, exp=2, proj=2, int=1, res=60, iv=60) -> z ~ 0
        z = (
            -7.2
            + 0.032 * tech_score
            + 0.025 * problem_solving
            + 0.024 * interview_score
            + 0.016 * resume_score
            + 0.014 * comm_score
            + 0.095 * years_experience
            + 0.180 * project_count
            + 0.140 * internship_count
            + 0.090 * cert_count
            + 0.008 * github_activity
            + 0.006 * aptitude_score
            + edu_boost[education_level]
            + random.gauss(0, 0.75) # market noise
        )
        
        prob = 1.0 / (1.0 + math.exp(-max(-30, min(30, z))))
        job_received = 1 if prob >= 0.50 else 0
        
        rows.append([
            age,
            education_level,
            field_of_study,
            years_experience,
            internship_count,
            previous_jobs,
            tech_score,
            web_score,
            db_score,
            dsa_score,
            algo_score,
            ml_score,
            cloud_score,
            comm_score,
            leader_score,
            team_score,
            problem_solving,
            project_count,
            cert_count,
            resume_score,
            interview_score,
            aptitude_score,
            github_activity,
            desired_role,
            job_received
        ])
        
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
        
    pos_count = sum(1 for r in rows if r[-1] == 1)
    neg_count = len(rows) - pos_count
    print(f"Generated {num_samples} samples: {pos_count} positive ({pos_count/num_samples*100:.1f}%), {neg_count} negative ({neg_count/num_samples*100:.1f}%)")

if __name__ == "__main__":
    generate_dataset()
