#!/usr/bin/env python3
"""Test all three BERTopic models with diverse inputs and report results."""

from bertopic import BERTopic

MODEL_EN = "models/topic_english"
MODEL_PAIR = "models/topic_english_tagalog"
MODEL_TRI = "models/topic_trilingual"

TEST_CASES_ENGLISH = [
    ("i want to cook chicken for dinner", "cook"),
    ("she is studying french at the university", "french"),
    ("the dog is running in the park", "dog"),
    ("he plays basketball every weekend", "baseball"),
    ("i need to buy groceries at the supermarket", "shop"),
    ("the children are playing in the garden", "children"),
    ("it is raining heavily outside", "rain"),
    ("i love drinking coffee in the morning", "coffee"),
    ("he went to the hospital because he was sick", "sick"),
    ("she is reading a book in the library", "read"),
    ("my family traveled to europe last summer", "travel"),
    ("the earthquake destroyed many buildings", "earthquake"),
    ("he was arrested by the police", "police"),
    ("she dreams about becoming a doctor", "dream"),
    ("they are eating rice and chicken", "rice"),
]

TEST_CASES_TAGALOG = [
    ("gusto kong kumain ng manok", "eating chicken"),
    ("nag-aaral siya ng pranses", "studying french"),
    ("malungkot ako ngayon", "feeling sad"),
    ("masarap ang kape", "coffee is delicious"),
    ("pumunta siya sa ospital", "went to hospital"),
    ("nagbabasa ako ng libro", "reading a book"),
    ("umuulan nang malakas", "heavy rain"),
    ("mahal ko ang pamilya ko", "love my family"),
    ("kumain kami sa restawran", "ate at restaurant"),
    ("nagluluto siya ng sopas", "cooking soup"),
]

TEST_CASES_CEBUANO = [
    ("ganahan ko magluto og manok", "cooking chicken"),
    ("nagbasa siya og libro", "reading a book"),
    ("nagaulan og kusog", "heavy rain"),
    ("gimahal nako ang akong pamilya", "love my family"),
    ("mikaon mi sa restawran", "ate at restaurant"),
    ("nagluto siya og sopas", "cooking soup"),
    ("gidakop siya sa pulis", "arrested by police"),
    ("nag eskwela siya sa unibersidad", "studying at university"),
    ("ganahan siya mokaon og pizza", "eating pizza"),
    ("gikapoy na siya sa trabaho", "tired from work"),
]

TEST_CASES_ENGLISH_ON_PAIR = [
    ("i want to cook chicken for dinner", "cook"),
    ("she is studying french at school", "french"),
    ("the police arrested the thief", "police"),
    ("he plays tennis every saturday", "tennis"),
    ("i love eating pizza", "pizza"),
]

TEST_CASES_ENGLISH_ON_TRI = [
    ("i want to cook chicken for dinner", "cook"),
    ("she is studying french at school", "french"),
    ("the police arrested the thief", "police"),
    ("he plays tennis every saturday", "tennis"),
    ("i love eating pizza", "pizza"),
    ("the earthquake destroyed the building", "earthquake"),
    ("she is reading a book", "book"),
    ("i am very hungry right now", "hungry"),
]

TEST_CASES_TAGALOG_ON_TRI = [
    ("gusto kong kumain ng manok", "eating chicken"),
    ("nagbabasa ako ng libro", "reading a book"),
    ("kumain kami sa restawran", "ate at restaurant"),
    ("nagluluto siya ng sopas", "cooking soup"),
    ("nag-aaral siya sa unibersidad", "studying at university"),
    ("gutom na gutom ako", "very hungry"),
    ("natutulog siya sa sofa", "sleeping on sofa"),
    ("umuulan nang malakas ngayon", "heavy rain now"),
]


def predict(model, text):
    topics, _ = model.transform([text])
    topic_id = topics[0]
    if topic_id == -1:
        return topic_id, "No clear topic (outlier)"
    info = model.get_topic_info()
    match = info[info["Topic"] == topic_id]
    name = match.iloc[0]["Name"] if not match.empty else f"Topic {topic_id}"
    return topic_id, name


def run_keyword_test(model, test_cases, label):
    print(f"\n{'='*70}")
    print(f"  {label}")
    print(f"{'='*70}")
    hits, total = 0, len(test_cases)
    for text, keyword in test_cases:
        tid, name = predict(model, text)
        matched = keyword.lower() in name.lower()
        if matched:
            hits += 1
        status = "✓" if matched else "✗"
        print(f"  {status} \"{text}\"")
        print(f"    → {name} (keyword: {keyword})")
    print(f"\n  Score: {hits}/{total}")
    return hits, total


def run_assignment_test(model, test_cases, label):
    print(f"\n{'='*70}")
    print(f"  {label}")
    print(f"{'='*70}")
    outliers = 0
    for text, desc in test_cases:
        tid, name = predict(model, text)
        is_outlier = tid == -1
        if is_outlier:
            outliers += 1
        status = "✗ OUTLIER" if is_outlier else "✓"
        print(f"  {status} \"{text}\" ({desc})")
        print(f"    → {name}")
    assigned = len(test_cases) - outliers
    print(f"\n  Score: {assigned}/{len(test_cases)} assigned ({outliers} outliers)")
    return assigned, len(test_cases)


def main():
    results = []

    # English-only model
    print("\nLoading English model...")
    m_en = BERTopic.load(MODEL_EN)
    h, t = run_keyword_test(m_en, TEST_CASES_ENGLISH, "English Model — English Input (keyword match)")
    results.append(("EN model → EN input", h, t))

    # Bilingual model
    print("\nLoading Bilingual model...")
    m_pair = BERTopic.load(MODEL_PAIR)
    h, t = run_assignment_test(m_pair, TEST_CASES_TAGALOG, "Bilingual Model — Tagalog Input (assignment)")
    results.append(("EN-TL model → TL input", h, t))
    h, t = run_keyword_test(m_pair, TEST_CASES_ENGLISH_ON_PAIR, "Bilingual Model — English Input (keyword match)")
    results.append(("EN-TL model → EN input", h, t))

    # Trilingual model
    print("\nLoading Trilingual model...")
    m_tri = BERTopic.load(MODEL_TRI)
    h, t = run_keyword_test(m_tri, TEST_CASES_ENGLISH_ON_TRI, "Trilingual Model — English Input (keyword match)")
    results.append(("EN-TL-CB model → EN input", h, t))
    h, t = run_assignment_test(m_tri, TEST_CASES_TAGALOG_ON_TRI, "Trilingual Model — Tagalog Input (assignment)")
    results.append(("EN-TL-CB model → TL input", h, t))
    h, t = run_assignment_test(m_tri, TEST_CASES_CEBUANO, "Trilingual Model — Cebuano Input (assignment)")
    results.append(("EN-TL-CB model → CB input", h, t))

    # Summary
    print(f"\n{'='*70}")
    print("  SUMMARY")
    print(f"{'='*70}")
    for label, hits, total in results:
        pct = int(hits / total * 100)
        print(f"  {label:35s} {hits}/{total} ({pct}%)")


if __name__ == "__main__":
    main()
