from dataclasses import dataclass, field
from app.models import Student, Teacher

SUBJECT_ALIASES: dict[str, set[str]] = {
    "mathematics": {"mathematics", "math", "maths", "ganit", "गणित", "अंकगणित"},
    "science": {"science", "vigyan", "विज्ञान", "general science", "evs", "environmental studies"},
    "english": {"english", "ingraji", "इंग्रजी", "अंग्रेजी"},
    "marathi": {"marathi", "मराठी"},
    "hindi": {"hindi", "हिंदी"},
    "social science": {"social science", "social studies", "itihas", "bhugol", "इतिहास", "भूगोल", "नागरिकशास्त्र", "history", "geography"},
}

def normalize_subject_term(term: str) -> str:
    cleaned = term.strip().casefold()
    for canonical, aliases in SUBJECT_ALIASES.items():
        if cleaned == canonical or cleaned in aliases:
            return canonical
    return cleaned

def subjects_match(wanted: str, teacher_subjects: list[str]) -> tuple[bool, str | None]:
    norm_wanted = normalize_subject_term(wanted)
    for subj in teacher_subjects:
        norm_subj = normalize_subject_term(subj)
        if norm_wanted == norm_subj or norm_wanted in norm_subj or norm_subj in norm_wanted:
            return True, subj
    return False, None

def languages_match(student_lang: str, teacher_languages: list[str]) -> tuple[bool, str | None]:
    s_norm = (student_lang or "").strip().casefold()
    if not s_norm:
        return True, "General"
    for lang in teacher_languages:
        t_norm = lang.strip().casefold()
        if s_norm == t_norm or s_norm in t_norm or t_norm in s_norm:
            return True, lang
    return False, None


@dataclass(frozen=True)
class MatchFactorsResult:
    subject_match: float
    language_match: float
    experience_score: float
    workload_balance: float
    effectiveness_score: float


@dataclass(frozen=True)
class MatchResult:
    teacher: Teacher
    score: float
    factors: MatchFactorsResult
    reasons: list[str]
    missing_data_warnings: list[str] = field(default_factory=list)
    current_workload: int = 0
    max_capacity: int = 30


def rank_teachers(
    student: Student,
    teachers: list[Teacher],
    subject: str,
    support_hours: int = 2,
    teacher_active_loads: dict[str, int] | None = None,
) -> list[MatchResult]:
    """
    Explainable pedagogical recommendation engine for rural schools.
    Evaluates candidate teachers across subject fit, language alignment,
    capacity/workload balance, relevant experience, and recorded efficacy.
    Distinguishes missing data from poor performance.
    """
    if teacher_active_loads is None:
        teacher_active_loads = {}

    results: list[MatchResult] = []
    for teacher in teachers:
        if not teacher.active or not teacher.available:
            continue

        active_count = teacher_active_loads.get(str(teacher.id), 0)
        capacity = max(teacher.capacity, 1)
        remaining_capacity = max(0, capacity - active_count)

        # Skip if teacher has zero capacity left
        if remaining_capacity < 1:
            continue

        is_subj_match, matched_subject_name = subjects_match(subject, teacher.subjects or [])
        is_lang_match, matched_lang_name = languages_match(student.preferred_language, teacher.languages or [])

        # Calculate individual normalized factor scores [0.0 - 1.0]
        subject_score = 1.0 if is_subj_match else 0.20
        language_score = 1.0 if is_lang_match else 0.30

        # Workload balance score: rewards teachers with available capacity bandwidth
        workload_ratio = remaining_capacity / float(capacity)
        workload_score = max(0.2, min(1.0, workload_ratio))

        # Experience score: non-linear scaling up to 10 years
        exp_years = max(0, teacher.experience_years)
        experience_score = min(exp_years / 10.0, 1.0)

        # Effectiveness score with explicit missing-evidence handling
        missing_warnings: list[str] = []
        effectiveness = teacher.effectiveness_score
        if effectiveness is not None:
            effectiveness_score = min(max(effectiveness, 0.0), 1.0)
        else:
            effectiveness_score = 0.50  # Neutral baseline
            missing_warnings.append("No prior teaching-effectiveness metric recorded; neutral default (50%) applied.")

        if not teacher.qualification:
            missing_warnings.append("Teacher qualification record is currently blank.")

        reasons: list[str] = []
        if is_subj_match:
            reasons.append(f"Subject expertise verified in {matched_subject_name or subject}.")
        else:
            reasons.append("Subject expertise is secondary; suitable for general remedial supervision.")

        if is_lang_match:
            reasons.append(f"Fluent in student's preferred medium ({matched_lang_name or student.preferred_language}).")
        else:
            reasons.append(f"Different primary medium ({', '.join(teacher.languages[:2]) if teacher.languages else 'General'}); bilingual support suggested.")

        if remaining_capacity >= 5:
            reasons.append(f"High available capacity ({remaining_capacity} open slots out of {capacity}).")
        else:
            reasons.append(f"Moderate available capacity ({remaining_capacity} remaining slots).")

        if exp_years >= 5:
            reasons.append(f"Senior educator with {exp_years} years of teaching experience.")
        elif exp_years >= 2:
            reasons.append(f"{exp_years} years of active classroom experience.")

        if effectiveness is not None and effectiveness >= 0.75:
            reasons.append(f"High recorded student learning gain index ({int(effectiveness * 100)}%).")

        # Configurable weights:
        # 40% Subject Fit + 25% Language Fit + 15% Workload + 10% Experience + 10% Effectiveness
        raw_score = 100.0 * (
            0.40 * subject_score
            + 0.25 * language_score
            + 0.15 * workload_score
            + 0.10 * experience_score
            + 0.10 * effectiveness_score
        )
        final_score = round(min(100.0, max(0.0, raw_score)), 1)

        factors = MatchFactorsResult(
            subject_match=round(subject_score, 2),
            language_match=round(language_score, 2),
            experience_score=round(experience_score, 2),
            workload_balance=round(workload_score, 2),
            effectiveness_score=round(effectiveness_score, 2),
        )

        results.append(
            MatchResult(
                teacher=teacher,
                score=final_score,
                factors=factors,
                reasons=reasons,
                missing_data_warnings=missing_warnings,
                current_workload=active_count,
                max_capacity=capacity,
            )
        )

    return sorted(results, key=lambda x: (-x.score, -x.factors.workload_balance, str(x.teacher.id)))
