import json

print("Kalan tüm sorunlu soruları düzeltiyorum...")

# JSON dosyasını oku
with open('questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

fixed_count = 0

for i, q in enumerate(data['questions']):
    question_text = q.get('question', '')
    
    # 1. "Exercise benefits:" gibi eksik sorular
    if question_text == "Exercise benefits:":
        q['question'] = "According to the passage, exercise benefits:"
        fixed_count += 1
    
    # 2. Level-based placeholder sorular (A1 level Vocabulary question, etc.)
    elif 'level Vocabulary question (Test' in question_text or \
         'level Grammar question (Test' in question_text or \
         'level Reading question (Test' in question_text or \
         'level Cloze question (Test' in question_text or \
         'level Completion question (Test' in question_text or \
         'level Dialog question (Test' in question_text or \
         'level Paraphrase question (Test' in question_text or \
         'level Paragraph-Completion question (Test' in question_text:
        
        level = q['level']
        topic = q['topic']
        
        # Her seviye ve topic için uygun sorular oluştur
        if topic == 'Vocabulary':
            if level == 'A1':
                q['question'] = 'The teacher asked the students to _______ their homework.'
                q['options'] = ['do', 'make', 'give', 'take', 'have']
                q['correctAnswer'] = 0
                q['explanation'] = 'do homework yaygın kullanımdır'
            elif level == 'A2':
                q['question'] = 'The company decided to _______ off several employees.'
                q['options'] = ['put', 'lay', 'take', 'get', 'make']
                q['correctAnswer'] = 1
                q['explanation'] = 'lay off = işten çıkarmak'
            elif level == 'B1':
                q['question'] = 'The manager needs to _______ with this problem immediately.'
                q['options'] = ['deal', 'make', 'do', 'take', 'get']
                q['correctAnswer'] = 0
                q['explanation'] = 'deal with = ilgilenmek, çözmek'
            elif level == 'B2':
                q['question'] = 'The evidence _______ his claims about the incident.'
                q['options'] = ['contradicts', 'says', 'tells', 'speaks', 'talks']
                q['correctAnswer'] = 0
                q['explanation'] = 'contradict = çelişmek'
            elif level == 'C1':
                q['question'] = 'The new policy will _______ significant changes in our operations.'
                q['options'] = ['entail', 'have', 'make', 'do', 'take']
                q['correctAnswer'] = 0
                q['explanation'] = 'entail = gerektirmek, içermek'
            else:  # C2
                q['question'] = 'The research findings _______ conventional wisdom on this topic.'
                q['options'] = ['belie', 'show', 'prove', 'make', 'tell']
                q['correctAnswer'] = 0
                q['explanation'] = 'belie = yalanlamak, çürütmek'
        
        elif topic == 'Grammar':
            if level == 'A1':
                q['question'] = 'She _______ to school every day.'
                q['options'] = ['go', 'goes', 'going', 'gone', 'went']
                q['correctAnswer'] = 1
                q['explanation'] = 'Üçüncü tekil şahıs -s alır'
            elif level == 'A2':
                q['question'] = 'They _______ in London since 2010.'
                q['options'] = ['live', 'lived', 'have lived', 'are living', 'lives']
                q['correctAnswer'] = 2
                q['explanation'] = 'Since ile present perfect kullanılır'
            elif level == 'B1':
                q['question'] = 'If I _______ more time, I would travel around the world.'
                q['options'] = ['have', 'had', 'has', 'having', 'will have']
                q['correctAnswer'] = 1
                q['explanation'] = 'İkinci tip koşul cümlesinde geçmiş zaman kullanılır'
            elif level == 'B2':
                q['question'] = 'The report _______ by the committee before the deadline.'
                q['options'] = ['must complete', 'must be completed', 'must completing', 'must to complete', 'must have complete']
                q['correctAnswer'] = 1
                q['explanation'] = 'Modal + be + past participle pasif yapı'
            elif level == 'C1':
                q['question'] = 'Never _______ such a beautiful sunset.'
                q['options'] = ['I have seen', 'have I seen', 'I seen', 'did I seen', 'I had seen']
                q['correctAnswer'] = 1
                q['explanation'] = 'Never ile devrik yapı kullanılır'
            else:  # C2
                q['question'] = 'Rarely _______ with such eloquence and precision.'
                q['options'] = ['one speaks', 'does one speak', 'speaks one', 'one does speak', 'speaking one']
                q['correctAnswer'] = 1
                q['explanation'] = 'Rarely ile devrik yapı'
        
        elif topic == 'Reading':
            passages = {
                'A1': 'Sports are good for health. Playing sports helps children stay active and build strong bodies. It also teaches teamwork and discipline.',
                'A2': 'The internet has changed how we communicate. People can now connect instantly with others around the world through email and social media.',
                'B1': 'Sustainable development aims to meet present needs without compromising future generations. It requires balancing economic growth, environmental protection, and social equity.',
                'B2': 'Globalization has interconnected economies and cultures worldwide. While it facilitates trade and cultural exchange, it also raises concerns about inequality and cultural homogenization.',
                'C1': 'Contemporary neuroscience research suggests that neuroplasticity persists throughout adulthood. This finding challenges traditional assumptions about the rigidity of the mature brain.',
                'C2': 'Postcolonial literary theory interrogates the cultural legacy of colonialism and imperialism. It examines how colonial discourse constructed knowledge and perpetuated power asymmetries.'
            }
            questions_by_level = {
                'A1': 'According to the passage, sports help children:',
                'A2': 'The internet allows people to:',
                'B1': 'Sustainable development requires:',
                'B2': 'The passage suggests globalization:',
                'C1': 'The research on neuroplasticity:',
                'C2': 'Postcolonial theory examines:'
            }
            options_by_level = {
                'A1': ['stay active and learn teamwork', 'only run fast', 'avoid exercise', 'play alone', 'watch TV'],
                'A2': ['connect with others globally', 'only send letters', 'avoid communication', 'never use technology', 'only call'],
                'B1': ['balancing multiple factors', 'only economic growth', 'ignoring the environment', 'only social issues', 'no planning'],
                'B2': ['has both benefits and concerns', 'is only positive', 'has no effects', 'is completely negative', 'is impossible'],
                'C1': ['challenges old assumptions', 'confirms all previous beliefs', 'proves nothing', 'is irrelevant', 'only applies to children'],
                'C2': ['colonial power structures', 'only literature', 'modern economics', 'sports history', 'mathematics']
            }
            
            q['passage'] = passages.get(level, '')
            q['question'] = questions_by_level.get(level, 'Based on the passage:')
            q['options'] = options_by_level.get(level, ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'])
            q['correctAnswer'] = 0
            q['explanation'] = 'Parça içeriğine göre'
        
        elif topic == 'Cloze':
            if level in ['A1', 'A2']:
                q['question'] = 'Fill in the blanks: Students (1)___ hard for exams. They (2)___ to get good grades.'
                q['options'] = ['study/want', 'studying/wanting', 'studies/wants', 'studied/wanted', 'study/wants']
            else:
                q['question'] = 'Fill in the blanks: Researchers (1)___ this phenomenon extensively. Their findings (2)___ significant implications.'
                q['options'] = ['have investigated/have', 'investigates/has', 'investigating/having', 'investigated/had', 'investigate/has']
            q['correctAnswer'] = 0
            q['explanation'] = 'Her iki boşluğu da doğru doldurun'
        
        elif topic == 'Completion':
            if level in ['A1', 'A2']:
                q['question'] = 'She went to the store _______ she needed milk.'
                q['options'] = ['because', 'although', 'despite', 'unless', 'whereas']
            else:
                q['question'] = 'The project succeeded _______ numerous obstacles.'
                q['options'] = ['despite', 'because of', 'due to', 'owing to', 'thanks to']
            q['correctAnswer'] = 0
            q['explanation'] = 'Mantıksal tamamlama'
        
        elif topic == 'Dialog':
            if level in ['A1', 'A2']:
                q['question'] = 'A: How do you get to work? B: _______.'
                q['options'] = ['I usually take the bus', 'Yes, I do', 'Work is good', 'Every day', 'I am worker']
            else:
                q['question'] = 'A: Would you be available for a meeting tomorrow? B: _______.'
                q['options'] = ['I should be free in the afternoon', 'Yes, available', 'Tomorrow is day', 'Meeting good', 'I am tomorrow']
            q['correctAnswer'] = 0
            q['explanation'] = 'Uygun cevap'
        
        elif topic == 'Paraphrase':
            if level in ['A1', 'A2']:
                q['question'] = 'Which is closest in meaning? "The room is very big."'
                q['options'] = ['The room is spacious', 'Room is small', 'Big room is', 'Is very room', 'Room big']
            else:
                q['question'] = 'Which is closest in meaning? "The evidence corroborates the theory."'
                q['options'] = ['The data supports the hypothesis', 'Evidence is theory', 'Theory evidence', 'Corroborates is', 'Theory proves']
            q['correctAnswer'] = 0
            q['explanation'] = 'En yakın anlam'
        
        elif topic == 'Paragraph-Completion':
            if level in ['A1', 'A2']:
                q['question'] = 'Complete: Healthy eating is important. (1)___ It provides energy. (2)___ Good nutrition improves wellbeing.'
                q['options'] = ['Fresh food contains vitamins / Balanced meals help growth', 'Random / Unrelated', 'Wrong / Bad', 'Not fit / Poor', 'Off / Wrong']
            else:
                q['question'] = 'Complete: Innovation drives progress. (1)___ New technologies emerge rapidly. (2)___ Adaptation becomes essential.'
                q['options'] = ['Change accelerates continuously / Organizations must evolve', 'Random / Unrelated', 'Wrong / Bad', 'Not fit / Poor', 'Off / Wrong']
            q['correctAnswer'] = 0
            q['explanation'] = 'Mantıksal akış'
        
        fixed_count += 1

# Güncellenmiş JSON'u kaydet
with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Tamamlandı! {fixed_count} sorunlu soru düzeltildi.")
print("Dosya kaydedildi: questions.json")
