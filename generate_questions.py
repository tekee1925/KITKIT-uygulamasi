import json

# YDS-style high-quality questions
questions = []

# A1 Level - Grammar (30 questions = 3 tests x 10)
a1_grammar = [
    {
        "passage": "",
        "question": "John _______ to work every day by bus.",
        "options": ["go", "goes", "going", "gone", "went"],
        "correctAnswer": 1,
        "explanation": "Third person singular takes '-s' in present simple tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "They _______ in London since 2010.",
        "options": ["live", "lives", "living", "lived", "have lived"],
        "correctAnswer": 4,
        "explanation": "'Since' indicates present perfect tense for actions continuing from past to present.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "I _______ my homework right now.",
        "options": ["do", "does", "am doing", "did", "have done"],
        "correctAnswer": 2,
        "explanation": "'Right now' requires present continuous tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "She _______ speak three languages fluently.",
        "options": ["can", "cans", "could", "must", "should"],
        "correctAnswer": 0,
        "explanation": "'Can' expresses ability in present tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "We _______ to Paris last summer.",
        "options": ["go", "goes", "went", "have gone", "will go"],
        "correctAnswer": 2,
        "explanation": "'Last summer' requires past simple tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "There _______ many students in the classroom.",
        "options": ["is", "are", "was", "be", "been"],
        "correctAnswer": 1,
        "explanation": "Plural 'students' requires 'are'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "He _______ coffee for breakfast every morning.",
        "options": ["drink", "drinks", "drinking", "drank", "drunk"],
        "correctAnswer": 1,
        "explanation": "Third person singular with habitual action uses present simple with '-s'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "_______ you like to join us for dinner?",
        "options": ["Do", "Does", "Would", "Did", "Are"],
        "correctAnswer": 2,
        "explanation": "'Would you like' is the polite form for invitations.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "The students _______ their exam tomorrow.",
        "options": ["take", "takes", "took", "will take", "have taken"],
        "correctAnswer": 3,
        "explanation": "'Tomorrow' indicates future tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "I _______ never been to Japan before.",
        "options": ["am", "was", "have", "had", "will"],
        "correctAnswer": 2,
        "explanation": "'Never' with experience requires present perfect 'have never been'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "She usually _______ her dog in the park.",
        "options": ["walk", "walks", "walking", "walked", "has walked"],
        "correctAnswer": 1,
        "explanation": "'Usually' with third person singular requires present simple with '-s'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "My brother _______ a doctor for ten years.",
        "options": ["is", "was", "has been", "will be", "be"],
        "correctAnswer": 2,
        "explanation": "'For ten years' indicates duration, requiring present perfect tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "_______ students are absent today?",
        "options": ["How much", "How many", "How long", "How often", "How far"],
        "correctAnswer": 1,
        "explanation": "'How many' is used for countable nouns like students.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "We _______ to the cinema next weekend.",
        "options": ["go", "goes", "went", "are going", "have gone"],
        "correctAnswer": 3,
        "explanation": "'Next weekend' with planned action uses present continuous for future.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "This book is _______ than that one.",
        "options": ["interesting", "more interesting", "most interesting", "interestinger", "interest"],
        "correctAnswer": 1,
        "explanation": "Comparative form of long adjectives uses 'more + adjective'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "They _______ watching TV when I called.",
        "options": ["are", "were", "was", "is", "be"],
        "correctAnswer": 1,
        "explanation": "Past continuous requires 'were' with plural subject.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "I have _______ finished my work.",
        "options": ["yet", "already", "still", "ever", "never"],
        "correctAnswer": 1,
        "explanation": "'Already' is used in affirmative sentences with present perfect.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "She _______ arrive before 9 o'clock.",
        "options": ["must", "musts", "must to", "has must", "must be"],
        "correctAnswer": 0,
        "explanation": "'Must' is followed directly by base verb without 'to'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "There aren't _______ chairs in the room.",
        "options": ["some", "any", "much", "no", "none"],
        "correctAnswer": 1,
        "explanation": "'Any' is used in negative sentences with countable nouns.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "He is the _______ student in our class.",
        "options": ["smart", "smarter", "smartest", "most smart", "more smart"],
        "correctAnswer": 2,
        "explanation": "Superlative of short adjectives uses '-est'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "I would like _______ water, please.",
        "options": ["any", "some", "few", "many", "much"],
        "correctAnswer": 1,
        "explanation": "'Some' is used in requests even though they are questions.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "She _______ her keys yesterday.",
        "options": ["lose", "loses", "lost", "has lost", "losing"],
        "correctAnswer": 2,
        "explanation": "'Yesterday' requires past simple tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "We _______ study harder for the exam.",
        "options": ["should", "shoulds", "should to", "are should", "have should"],
        "correctAnswer": 0,
        "explanation": "'Should' gives advice and is followed by base verb.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "_______ you ever visited Rome?",
        "options": ["Do", "Does", "Did", "Have", "Are"],
        "correctAnswer": 3,
        "explanation": "'Ever' with experience requires present perfect 'Have you ever'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "The meeting _______ at 3 PM tomorrow.",
        "options": ["start", "starts", "started", "is starting", "has started"],
        "correctAnswer": 1,
        "explanation": "Scheduled future events can use present simple tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "I'm _______ tired to go out tonight.",
        "options": ["to", "too", "two", "so", "very"],
        "correctAnswer": 1,
        "explanation": "'Too' means 'excessively' and is used with 'to + verb'.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "She has lived here _______ five years.",
        "options": ["since", "for", "during", "while", "from"],
        "correctAnswer": 1,
        "explanation": "'For' is used with periods of time.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "They _______ the project by next month.",
        "options": ["complete", "completed", "will complete", "have completed", "completing"],
        "correctAnswer": 2,
        "explanation": "'By next month' indicates future completion, requiring future tense.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "I _______ waiting for you for an hour.",
        "options": ["am", "was", "have been", "had been", "will be"],
        "correctAnswer": 2,
        "explanation": "Action continuing from past to present uses present perfect continuous.",
        "level": "A1",
        "topic": "Grammar"
    },
    {
        "passage": "",
        "question": "Neither John _______ Mary came to the party.",
        "options": ["or", "nor", "and", "but", "so"],
        "correctAnswer": 1,
        "explanation": "'Neither' is paired with 'nor' for negative correlation.",
        "level": "A1",
        "topic": "Grammar"
    }
]

questions.extend(a1_grammar)

# Write to file
with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump({"questions": questions}, f, indent=2, ensure_ascii=False)

print(f"Generated {len(questions)} questions successfully!")
