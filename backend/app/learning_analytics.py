from app.models import Student, StudentAssessmentResult, Assessment

# Pedagogical topic mastery and remedial activity recommendations
SUBJECT_REMEDIAL_CATALOG: dict[str, dict[str, list[dict]]] = {
    "mathematics": {
        "Foundational Numeracy & Place Value": [
            {"title": "Number Line Jump Exercise", "type": "Interactive Worksheet", "duration_minutes": 15, "language_hint": "मराठी/हिंदी संख्यारेषा सराव"},
            {"title": "Tens & Units Counting with Bundles", "type": "Concrete Activity", "duration_minutes": 20, "language_hint": "दशक-एकक संकल्पना"},
        ],
        "Multiplication Tables & Basic Operations": [
            {"title": "Multiplication Grid Pattern Drill", "type": "Peer Learning", "duration_minutes": 15, "language_hint": "पाढे रचना आणि गुणधर्म"},
            {"title": "Step-by-Step Carryover Addition/Multiplication", "type": "Guided Practice", "duration_minutes": 25, "language_hint": "हातच्याची बेरीज व गुणाकार"},
        ],
        "Fractions & Decimals": [
            {"title": "Visual Paper Folding Fraction Model", "type": "Hands-on Activity", "duration_minutes": 20, "language_hint": "अपूर्णांक कागदी घडी"},
            {"title": "Real-life Fraction Word Problems", "type": "Contextual Math", "duration_minutes": 25, "language_hint": "व्यावहारिक उदाहरणे"},
        ],
        "Word Problems & Reasoning": [
            {"title": "3-Step Word Problem Breakdown", "type": "Comprehension Guide", "duration_minutes": 20, "language_hint": "उदाहरणाचे विश्लेषण"},
        ],
    },
    "science": {
        "Plant & Animal Life Cycles": [
            {"title": "Leaf & Seed Classification Chart", "type": "Observation Project", "duration_minutes": 20, "language_hint": "सजीव सृष्टी निरीक्षण"},
            {"title": "Photosynthesis Flow Diagram", "type": "Visual Concept Map", "duration_minutes": 15, "language_hint": "प्रकाशसंश्लेषण रेखाटन"},
        ],
        "States of Matter & Water Cycle": [
            {"title": "Evaporation & Condensation Mini-Experiment", "type": "Demonstration", "duration_minutes": 25, "language_hint": "जलचक्र प्रयोग"},
        ],
        "Human Body & Nutrition": [
            {"title": "Balanced Diet Local Food Chart", "type": "Diet Diary", "duration_minutes": 20, "language_hint": "संतुलित आहार तक्ता"},
        ],
    },
    "english": {
        "Phonics & Basic Word Reading": [
            {"title": "Sight Words Flashcard Game", "type": "Phonics Drill", "duration_minutes": 15, "language_hint": "शब्दोच्चार आणि ओळख"},
            {"title": "Rhyming Word Family Builder", "type": "Word Match", "duration_minutes": 15, "language_hint": "यमक जुळणारे शब्द"},
        ],
        "Sentence Construction & Grammar": [
            {"title": "Jumbled Sentence Reordering", "type": "Sentence Scramble", "duration_minutes": 20, "language_hint": "वाक्यरचना नियम"},
            {"title": "Verb Tenses in Daily Life Stories", "type": "Storytelling", "duration_minutes": 25, "language_hint": "काळ आणि क्रियापदे"},
        ],
        "Reading Comprehension": [
            {"title": "Short Story Paragraph Q&A", "type": "Guided Reading", "duration_minutes": 20, "language_hint": "परिच्छेद वाचन व आकलन"},
        ],
    },
    "marathi": {
        "वाचन आकलन (Reading Comprehension)": [
            {"title": "परिच्छेद वाचन आणि मुख्य कल्पना शोधणे", "type": "वाचन सराव", "duration_minutes": 20, "language_hint": "मराठी वाचन कौशल्य"},
        ],
        "व्याकरण व शब्दसंग्रह (Grammar & Vocabulary)": [
            {"title": "नाम, सर्वनाम व क्रियापद ओळख", "type": "व्याकरण खेळ", "duration_minutes": 15, "language_hint": "व्याकरण सराव"},
            {"title": "समानार्थी व विरुद्धार्थी शब्द जोड्या", "type": "शब्द कोडे", "duration_minutes": 15, "language_hint": "शब्दसंग्रह वाढवणे"},
        ],
    },
    "hindi": {
        "पठन और समझ (Reading & Understanding)": [
            {"title": "कहानी पठन एवं प्रश्नोत्तर", "type": "अभ्यास", "duration_minutes": 20, "language_hint": "हिंदी पाठ पठन"},
        ],
        "व्याकरण (Grammar)": [
            {"title": "संज्ञा, सर्वनाम एवं वाक्य निर्माण", "type": "व्याकरण अभ्यास", "duration_minutes": 15, "language_hint": "वाक्य रचना"},
        ],
    },
}

def analyze_student_learning_gaps(
    student: Student,
    results: list[tuple[StudentAssessmentResult, Assessment]],
) -> dict:
    """
    Analyzes student assessment history to compute subject mastery,
    recurring learning gaps, and structured remedial practice activities.
    """
    subject_totals: dict[str, list[float]] = {}
    all_weak_topics: list[str] = []
    recent_trend: list[dict] = []

    for res, asm in results:
        subj = asm.subject
        if subj not in subject_totals:
            subject_totals[subj] = []
        subject_totals[subj].append(res.score_percentage)
        for topic in (res.weak_topics or []):
            if topic and topic not in all_weak_topics:
                all_weak_topics.append(topic)
        recent_trend.append({
            "assessment_id": str(asm.id),
            "title": asm.title,
            "subject": subj,
            "date": asm.assessment_date.isoformat(),
            "score_percentage": res.score_percentage,
            "is_gap": res.is_learning_gap,
        })

    subject_averages: dict[str, float] = {}
    for subj, scores in subject_totals.items():
        subject_averages[subj] = round(sum(scores) / len(scores), 1)

    overall_avg = round(sum([r[0].score_percentage for r in results]) / len(results), 1) if results else 0.0

    return {
        "student_id": str(student.id),
        "student_name": student.display_name,
        "grade_level": student.grade_level,
        "overall_average": overall_avg,
        "subject_averages": subject_averages,
        "identified_gaps": all_weak_topics,
        "total_assessments_taken": len(results),
        "recent_trend": recent_trend[-10:],
    }


def generate_learning_pathway_plan(
    student: Student,
    subject: str,
    identified_gaps: list[str] | None = None,
) -> dict:
    """
    Generates a tailored, explainable remedial pathway plan based on NIPUN Bharat FLN standards.
    """
    clean_subj = subject.strip().casefold()
    catalog_key = "mathematics"
    for k in SUBJECT_REMEDIAL_CATALOG:
        if k in clean_subj or clean_subj in k:
            catalog_key = k
            break

    catalog = SUBJECT_REMEDIAL_CATALOG.get(catalog_key, SUBJECT_REMEDIAL_CATALOG["mathematics"])

    recommended_topics: list[str] = []
    activities: list[dict] = []

    if identified_gaps and len(identified_gaps) > 0:
        for gap in identified_gaps:
            recommended_topics.append(f"Remedial Practice: {gap}")
            # Find matching or fallback activity
            matched_acts = None
            for topic_name, acts in catalog.items():
                if any(w in topic_name.lower() for w in gap.lower().split()):
                    matched_acts = acts
                    break
            if not matched_acts:
                # Default from first topic
                first_key = list(catalog.keys())[0]
                matched_acts = catalog[first_key]
            activities.extend(matched_acts)
    else:
        # Generate foundational pathway for the subject
        for topic_name, acts in list(catalog.items())[:3]:
            recommended_topics.append(topic_name)
            activities.extend(acts)

    return {
        "subject": subject,
        "current_level": "Needs Support" if (identified_gaps and len(identified_gaps) > 0) else "Foundational",
        "target_competency": f"Grade {student.grade_level} {subject} Foundational Competency Mastery",
        "recommended_topics": recommended_topics[:5],
        "practice_activities": activities[:6],
    }
