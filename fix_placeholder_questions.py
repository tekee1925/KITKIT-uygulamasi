import json

print("Placeholder soruları gerçek YDS soruları ile değiştiriyorum...")

# JSON dosyasını oku
with open('questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Yeni sorular için sayaç
fixed_count = 0

for i, q in enumerate(data['questions']):
    question_text = q.get('question', '')
    
    # 1. CLOZE TESTİ PLACEHOLDER'LARI (Test 1, Question X)
    if 'Complete the passage with appropriate words (Test 1, Question' in question_text:
        if 'Question 1)' in question_text:
            q['question'] = 'Fill in the blanks: Scientists (1)___ climate change for decades. They (2)___ that immediate action is needed.'
            q['options'] = ['have studied/agree', 'study/agreeing', 'studied/agrees', 'are studying/agreed', 'studies/agree']
            q['correctAnswer'] = 0
        elif 'Question 2)' in question_text:
            q['question'] = 'Fill in the blanks: The committee (1)___ the proposal carefully before (2)___ a decision.'
            q['options'] = ['will review/making', 'reviews/make', 'reviewing/makes', 'reviewed/made', 'review/to make']
            q['correctAnswer'] = 0
        elif 'Question 3)' in question_text:
            q['question'] = 'Fill in the blanks: Education (1)___ opportunities for people (2)___ improve their lives.'
            q['options'] = ['provides/to', 'providing/for', 'provide/to', 'provided/in', 'provides/by']
            q['correctAnswer'] = 0
        elif 'Question 4)' in question_text:
            q['question'] = 'Fill in the blanks: The company (1)___ innovative products, which (2)___ customer satisfaction.'
            q['options'] = ['develops/enhances', 'develop/enhance', 'developing/enhancing', 'developed/enhanced', 'develops/enhance']
            q['correctAnswer'] = 0
        elif 'Question 5)' in question_text:
            q['question'] = 'Fill in the blanks: Modern medicine (1)___ significantly, (2)___ countless lives worldwide.'
            q['options'] = ['has advanced/saving', 'advances/save', 'advancing/saves', 'advanced/saved', 'has advanced/saves']
            q['correctAnswer'] = 0
        elif 'Question 6)' in question_text:
            q['question'] = 'Fill in the blanks: Researchers (1)___ solutions to problems that (2)___ global challenges.'
            q['options'] = ['seek/address', 'seeking/addresses', 'sought/addressing', 'seeks/address', 'seek/addresses']
            q['correctAnswer'] = 0
        elif 'Question 7)' in question_text:
            q['question'] = 'Fill in the blanks: International cooperation (1)___ essential for (2)___ environmental issues.'
            q['options'] = ['remains/tackling', 'remain/tackle', 'remaining/tackles', 'remained/tackled', 'remains/tackle']
            q['correctAnswer'] = 0
        elif 'Question 8)' in question_text:
            q['question'] = 'Fill in the blanks: The government (1)___ policies that (2)___ economic growth and stability.'
            q['options'] = ['implements/promote', 'implementing/promotes', 'implement/promoting', 'implemented/promoted', 'implements/promotes']
            q['correctAnswer'] = 0
        fixed_count += 1
        
    # 2. COMPLETION PLACEHOLDER'LARI
    elif 'Complete the sentence logically (Test 1, Question' in question_text:
        if 'Question 1)' in question_text:
            q['question'] = 'The research was groundbreaking _______.'
            q['options'] = ['in that it challenged existing theories', 'because it was bad', 'when nothing happened', 'if nobody cared', 'unless it failed']
            q['correctAnswer'] = 0
        elif 'Question 2)' in question_text:
            q['question'] = 'The economy recovered quickly, _______ experts had predicted.'
            q['options'] = ['as', 'despite', 'although', 'unless', 'whether']
            q['correctAnswer'] = 0
        elif 'Question 3)' in question_text:
            q['question'] = 'The team will achieve success _______ they work together effectively.'
            q['options'] = ['provided that', 'in spite of', 'even though', 'whereas', 'nevertheless']
            q['correctAnswer'] = 0
        elif 'Question 4)' in question_text:
            q['question'] = 'The innovation was revolutionary _______ it transformed the entire industry.'
            q['options'] = ['in that', 'so that', 'such that', 'even if', 'as if']
            q['correctAnswer'] = 0
        elif 'Question 5)' in question_text:
            q['question'] = 'The regulations must be followed, _______ severe penalties will apply.'
            q['options'] = ['otherwise', 'moreover', 'furthermore', 'besides', 'hence']
            q['correctAnswer'] = 0
        elif 'Question 6)' in question_text:
            q['question'] = 'The findings were significant _______ they contradicted previous assumptions.'
            q['options'] = ['in that', 'so that', 'provided that', 'as though', 'even though']
            q['correctAnswer'] = 0
        elif 'Question 7)' in question_text:
            q['question'] = 'The proposal gained support _______ initial skepticism.'
            q['options'] = ['despite', 'because of', 'due to', 'thanks to', 'owing to']
            q['correctAnswer'] = 0
        elif 'Question 8)' in question_text:
            q['question'] = 'The system operates efficiently, _______ reducing operational costs.'
            q['options'] = ['thereby', 'whenever', 'unless', 'although', 'whether']
            q['correctAnswer'] = 0
        fixed_count += 1
        
    # 3. READING COMPREHENSION PLACEHOLDER'LARI
    elif 'Sample passage discussing various topics relevant to' in q.get('passage', ''):
        level = q['level']
        if level == 'A1':
            q['passage'] = 'Books are important for learning. They help us gain knowledge and understand the world better. Reading regularly improves vocabulary and comprehension skills.'
            q['question'] = 'According to the passage, reading helps with:'
            q['options'] = ['vocabulary and comprehension', 'only grammar', 'nothing useful', 'sports skills', 'cooking']
        elif level == 'A2':
            q['passage'] = 'Social media connects people worldwide. It allows instant communication and information sharing. However, users should be cautious about privacy and misinformation.'
            q['question'] = 'The passage suggests social media users should:'
            q['options'] = ['be careful about privacy', 'share everything', 'avoid all communication', 'ignore information', 'delete their accounts']
        elif level == 'B1':
            q['passage'] = 'Globalization has transformed international trade and cultural exchange. While it creates economic opportunities, it also presents challenges regarding cultural identity and environmental sustainability.'
            q['question'] = 'The passage indicates globalization:'
            q['options'] = ['has both benefits and challenges', 'is only positive', 'is only negative', 'has no impact', 'is impossible']
        elif level == 'B2':
            q['passage'] = 'Quantum computing represents a paradigm shift in computational technology. Unlike classical computers that use bits, quantum computers utilize qubits, enabling exponentially faster processing for specific problems.'
            q['question'] = 'What distinguishes quantum computers from classical ones?'
            q['options'] = ['use of qubits instead of bits', 'larger size', 'different color', 'lower cost', 'simpler design']
        elif level == 'C1':
            q['passage'] = 'Contemporary discourse on artificial intelligence encompasses ethical considerations regarding autonomy, accountability, and the potential displacement of human labor. Policymakers must navigate these complexities while fostering innovation.'
            q['question'] = 'The passage emphasizes that AI policy requires:'
            q['options'] = ['balancing ethics with innovation', 'ignoring ethical concerns', 'stopping all development', 'only technical focus', 'avoiding regulation']
        elif level == 'C2':
            q['passage'] = 'Poststructuralist theory problematizes traditional epistemological frameworks by deconstructing binary oppositions and questioning the stability of meaning. This intellectual movement has profoundly influenced literary criticism and cultural studies.'
            q['question'] = 'Poststructuralism challenges traditional thinking by:'
            q['options'] = ['deconstructing binary oppositions', 'accepting all traditions', 'avoiding all questions', 'simplifying everything', 'ignoring meaning']
        q['correctAnswer'] = 0
        q['explanation'] = 'Parça içeriğine göre'
        fixed_count += 1
        
    # 4. DIALOG PLACEHOLDER'LARI
    elif question_text.startswith('A: Question') and 'about a topic? B:' in question_text:
        num = question_text.split('Question')[1].split('about')[0].strip()
        if '13' in num:
            q['question'] = 'A: Shall we meet at 3 pm? B: _______.'
            q['options'] = ['That works for me', 'I shall too', 'Shall we not', 'Meeting is good', 'Yes, shall']
        elif '14' in num:
            q['question'] = 'A: The report is due tomorrow. B: _______.'
            q['options'] = ['I will have it ready on time', 'Report tomorrow', 'Due is it', 'Yes, report', 'Tomorrow it']
        elif '15' in num:
            q['question'] = 'A: What did you think of the presentation? B: _______.'
            q['options'] = ['It was quite informative and well-structured', 'Think presentation', 'Yes, thought', 'Presenting it', 'Was think']
        elif '16' in num:
            q['question'] = 'A: We need to address this issue urgently. B: _______.'
            q['options'] = ['I agree, let us prioritize it immediately', 'Address urgent', 'Issue we need', 'Yes, address', 'Urgently it']
        elif '17' in num:
            q['question'] = 'A: The data suggests a different conclusion. B: _______.'
            q['options'] = ['We should reconsider our initial hypothesis', 'Data suggests', 'Conclusion different', 'Yes, data', 'Suggests it']
        elif '18' in num:
            q['question'] = 'A: This approach seems counterproductive. B: _______.'
            q['options'] = ['Perhaps we should explore alternative strategies', 'Approach seems', 'Counterproductive it', 'Yes, approach', 'Seems it']
        elif '19' in num:
            q['question'] = 'A: Have you reviewed the contract? B: _______.'
            q['options'] = ['Yes, I found a few clauses that need clarification', 'Contract reviewed', 'Yes, contract', 'Reviewing it', 'Have reviewed']
        elif '20' in num:
            q['question'] = 'A: The deadline has been extended. B: _______.'
            q['options'] = ['That gives us more time to refine our work', 'Deadline extended', 'Yes, deadline', 'Extended it', 'Has been']
        q['correctAnswer'] = 0
        q['explanation'] = 'Uygun cevap'
        fixed_count += 1
        
    # 5. PARAPHRASE PLACEHOLDER'LARI
    elif 'Find the closest meaning: "Sample sentence' in question_text:
        num = question_text.split('sentence')[1].split('with')[0].strip()
        if '13' in num:
            q['question'] = 'Which sentence is closest in meaning? "The implementation was flawed."'
            q['options'] = ['The execution had defects', 'Implementation was perfect', 'Flawed implementation', 'Was implementing', 'Implementation flaws']
        elif '14' in num:
            q['question'] = 'Which sentence is closest in meaning? "The outcome surpassed expectations."'
            q['options'] = ['The result exceeded anticipated levels', 'Outcome was expected', 'Surpassed outcome', 'Expectations outcome', 'Was surpass']
        elif '15' in num:
            q['question'] = 'Which sentence is closest in meaning? "The theory lacks empirical support."'
            q['options'] = ['The hypothesis needs experimental evidence', 'Theory has support', 'Lacks theory', 'Support empirical', 'Empirical lacks']
        elif '16' in num:
            q['question'] = 'Which sentence is closest in meaning? "The methodology proved robust."'
            q['options'] = ['The approach demonstrated strength', 'Methodology was weak', 'Proved methodology', 'Robust was', 'Was proving']
        elif '17' in num:
            q['question'] = 'Which sentence is closest in meaning? "The consensus emerged gradually."'
            q['options'] = ['Agreement developed over time', 'Consensus was instant', 'Emerged consensus', 'Gradually was', 'Was emerging']
        elif '18' in num:
            q['question'] = 'Which sentence is closest in meaning? "The framework requires refinement."'
            q['options'] = ['The structure needs improvement', 'Framework is perfect', 'Requires framework', 'Refinement was', 'Was requiring']
        elif '19' in num:
            q['question'] = 'Which sentence is closest in meaning? "The analysis yielded insights."'
            q['options'] = ['The examination produced understanding', 'Analysis failed', 'Yielded analysis', 'Insights were', 'Was yielding']
        elif '20' in num:
            q['question'] = 'Which sentence is closest in meaning? "The intervention proved effective."'
            q['options'] = ['The action showed success', 'Intervention failed', 'Proved intervention', 'Effective was', 'Was proving']
        q['correctAnswer'] = 0
        q['explanation'] = 'En yakın anlam'
        fixed_count += 1
        
    # 6. PARAGRAPH-COMPLETION PLACEHOLDER'LARI
    elif 'Complete the paragraph with the best sentence: Paragraph about' in question_text:
        num = question_text.split('about topic')[1].split('.')[0].strip()
        if '1' in num:
            q['question'] = 'Complete: Digital transformation reshapes businesses. (1)___ Companies must adapt to survive. (2)___ Innovation drives competitive advantage.'
            q['options'] = ['Technology evolves rapidly / Strategic planning is essential', 'Random thought / Unrelated idea', 'Wrong topic / Bad fit', 'Not relevant / Poor choice', 'Off topic / Incorrect']
        elif '2' in num:
            q['question'] = 'Complete: Mental health awareness grows. (1)___ Society recognizes its importance. (2)___ Support systems expand accordingly.'
            q['options'] = ['Stigma decreases gradually / Professional help becomes accessible', 'Random idea / Unrelated', 'Wrong / Bad', 'Not fit / Poor', 'Off / Wrong']
        elif '3' in num:
            q['question'] = 'Complete: Scientific literacy matters greatly. (1)___ Citizens need critical thinking. (2)___ Evidence-based decisions improve outcomes.'
            q['options'] = ['Education builds understanding / Misinformation spreads easily otherwise', 'Random / Wrong', 'Bad / Poor', 'Not / Off', 'Incorrect / Unrelated']
        elif '4' in num:
            q['question'] = 'Complete: Sustainable practices gain traction. (1)___ Environmental concerns intensify. (2)___ Future generations depend on our actions.'
            q['options'] = ['Corporate responsibility increases / Regulations become stricter', 'Random / Wrong', 'Bad / Poor', 'Not / Off', 'Incorrect / Unrelated']
        elif '5' in num:
            q['question'] = 'Complete: Cultural diversity enriches societies. (1)___ Different perspectives foster creativity. (2)___ Inclusion strengthens communities.'
            q['options'] = ['Tolerance promotes harmony / Exchange broadens horizons', 'Random / Wrong', 'Bad / Poor', 'Not / Off', 'Incorrect / Unrelated']
        elif '6' in num:
            q['question'] = 'Complete: Cybersecurity threats escalate. (1)___ Digital infrastructure remains vulnerable. (2)___ Protection measures evolve constantly.'
            q['options'] = ['Attacks become sophisticated / Organizations invest heavily', 'Random / Wrong', 'Bad / Poor', 'Not / Off', 'Incorrect / Unrelated']
        elif '7' in num:
            q['question'] = 'Complete: Work-life balance proves crucial. (1)___ Burnout affects productivity. (2)___ Wellbeing enhances performance.'
            q['options'] = ['Flexibility improves satisfaction / Boundaries prevent exhaustion', 'Random / Wrong', 'Bad / Poor', 'Not / Off', 'Incorrect / Unrelated']
        elif '8' in num:
            q['question'] = 'Complete: Lifelong learning becomes necessary. (1)___ Skills require constant updating. (2)___ Adaptation ensures relevance.'
            q['options'] = ['Change accelerates continuously / Education never stops', 'Random / Wrong', 'Bad / Poor', 'Not / Off', 'Incorrect / Unrelated']
        q['correctAnswer'] = 0
        q['explanation'] = 'Mantıksal akış'
        fixed_count += 1
        
    # 7. IRRELEVANT SENTENCE PLACEHOLDER'LARI (Level-based)
    elif 'level Irrelevant question (Test' in question_text:
        level = q['level']
        test_num = question_text.split('Test')[1].split(',')[0].strip()
        
        if level == 'A1':
            if 'Test 1' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Vegetables are healthy. (II) They provide vitamins. (III) Cars need fuel. (IV) Eating vegetables is good. (V) Fresh produce is best.'
            elif 'Test 2' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Music can relax people. (II) Many enjoy listening to songs. (III) Trees produce oxygen. (IV) Musicians create melodies. (V) Concerts are popular.'
            else:
                q['question'] = 'Which sentence is irrelevant? (I) Dogs are loyal pets. (II) They need daily walks. (III) Mountains are tall. (IV) Training helps dogs behave. (V) Many families have dogs.'
        elif level == 'A2':
            if 'Test 1' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Online shopping grows rapidly. (II) Customers appreciate convenience. (III) Elephants have good memory. (IV) E-commerce platforms expand. (V) Delivery services improve.'
            elif 'Test 2' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Public transportation reduces traffic. (II) Buses and trains serve commuters. (III) Chocolate tastes sweet. (IV) Transit systems need investment. (V) Urban mobility improves.'
            else:
                q['question'] = 'Which sentence is irrelevant? (I) Recycling helps the environment. (II) Waste management is crucial. (III) Soccer is popular worldwide. (IV) Sustainable practices matter. (V) Resources must be conserved.'
        elif level == 'B1':
            if 'Test 1' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Remote work increases flexibility. (II) Digital tools enable collaboration. (III) Dolphins are intelligent mammals. (IV) Productivity can improve at home. (V) Work arrangements evolve.'
            elif 'Test 2' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Financial literacy empowers individuals. (II) Understanding budgets helps planning. (III) Roses have thorns. (IV) Investment knowledge proves valuable. (V) Economic education matters.'
            else:
                q['question'] = 'Which sentence is irrelevant? (I) Healthcare systems face challenges. (II) Medical advances improve treatment. (III) Rainbows appear after rain. (IV) Access to care remains unequal. (V) Reform discussions continue.'
        elif level == 'B2':
            if 'Test 1' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Urbanization accelerates globally. (II) Cities expand infrastructure. (III) Penguins live in Antarctica. (IV) Population density increases. (V) Metropolitan planning adapts.'
            elif 'Test 2' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Biotechnology advances rapidly. (II) Genetic research progresses. (III) Vanilla flavors desserts. (IV) Medical applications emerge. (V) Ethical debates intensify.'
            else:
                q['question'] = 'Which sentence is irrelevant? (I) Media literacy becomes essential. (II) Critical thinking combats misinformation. (III) Honey comes from bees. (IV) Information overload challenges society. (V) Digital citizenship requires education.'
        elif level == 'C1':
            if 'Test 1' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Macroeconomic policies shape nations. (II) Fiscal strategies influence growth. (III) Butterflies undergo metamorphosis. (IV) Monetary decisions affect stability. (V) Economic governance proves complex.'
            elif 'Test 2' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Neuroscience illuminates cognition. (II) Brain plasticity enables learning. (III) Giraffes have long necks. (IV) Neural pathways adapt continuously. (V) Consciousness remains mysterious.'
            else:
                q['question'] = 'Which sentence is irrelevant? (I) Jurisprudence evolves with society. (II) Legal frameworks require updating. (III) Strawberries contain vitamin C. (IV) Judicial interpretation shapes law. (V) Constitutional principles endure.'
        elif level == 'C2':
            if 'Test 1' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Phenomenological inquiry examines consciousness. (II) Subjective experience merits investigation. (III) Snowflakes have unique patterns. (IV) Intentionality structures perception. (V) Lived experience informs understanding.'
            elif 'Test 2' in question_text:
                q['question'] = 'Which sentence is irrelevant? (I) Hermeneutics interprets meaning. (II) Textual analysis reveals significance. (III) Carrots improve eyesight. (IV) Contextual understanding matters. (V) Interpretive frameworks guide scholarship.'
            else:
                q['question'] = 'Which sentence is irrelevant? (I) Dialectical reasoning synthesizes oppositions. (II) Thesis and antithesis generate synthesis. (III) Waterfalls create mist. (IV) Contradictions drive development. (V) Progressive understanding emerges.'
        
        q['options'] = ['I', 'II', 'III', 'IV', 'V']
        q['correctAnswer'] = 2  # III numaralı cümle her zaman ilgisiz
        q['explanation'] = 'III numaralı cümle konuyla ilgisiz'
        fixed_count += 1
        
    # 8. GENERIC IRRELEVANT PLACEHOLDER'LARI
    elif 'Find the irrelevant sentence: (I) Sentence 1 about topic.' in question_text:
        # Bu genel placeholder'ları da düzelt
        level = q['level']
        if level in ['A1', 'A2']:
            q['question'] = 'Which sentence is irrelevant? (I) Regular exercise benefits health. (II) Physical activity strengthens body. (III) Clouds float in sky. (IV) Fitness improves wellbeing. (V) Movement keeps people active.'
        elif level in ['B1', 'B2']:
            q['question'] = 'Which sentence is irrelevant? (I) Technology transforms communication. (II) Digital platforms connect globally. (III) Maple syrup comes from trees. (IV) Innovation enables interaction. (V) Connectivity reshapes society.'
        else:  # C1, C2
            q['question'] = 'Which sentence is irrelevant? (I) Epistemological frameworks guide inquiry. (II) Knowledge construction involves interpretation. (III) Hummingbirds hover rapidly. (IV) Methodological rigor ensures validity. (V) Theoretical foundations support research.'
        
        q['options'] = ['I', 'II', 'III', 'IV', 'V']
        q['correctAnswer'] = 2
        q['explanation'] = 'III numaralı cümle konuyla ilgisiz'
        fixed_count += 1

# Güncellenmiş JSON'u kaydet
with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Tamamlandı! {fixed_count} placeholder soru gerçek YDS soruları ile değiştirildi.")
print("Dosya kaydedildi: questions.json")
