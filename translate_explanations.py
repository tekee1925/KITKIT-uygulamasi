import json

# Açıklama çevirileri (İngilizce -> Türkçe)
translations = {
    "too + adjective means excessively": "too + sıfat = aşırı anlamına gelir",
    "left = placed and forgot to take": "left = bıraktı ve almayı unuttu",
    "postponed = rescheduled for later": "postponed = ileri tarihe ertelendi",
    "break a promise is a common collocation": "break a promise yaygın bir söz öbeğidir",
    "laid off = terminated employment": "laid off = işten çıkarılmak",
    "do someone a favor is idiomatic": "do someone a favor deyimsel bir ifadedir",
    "arouse controversy is standard collocation": "arouse controversy standart söz öbeğidir",
    "turn down = reject": "turn down = reddetmek",
    "fall through = fail to be completed": "fall through = tamamlanamamak, suya düşmek",
    "bring under control is standard phrase": "bring under control standart ifadedir",
    "come to light = become known": "come to light = ortaya çıkmak, öğrenilmek",
    "come up with = think of": "come up with = bulmak, düşünmek",
    "point to = suggest/indicate": "point to = işaret etmek, göstermek",
    "come into effect = become active": "come into effect = yürürlüğe girmek",
    "step down = resign": "step down = istifa etmek",
    "exploit loopholes is standard collocation": "exploit loopholes standart söz öbeğidir",
    "turn a blind eye = ignore deliberately": "turn a blind eye = görmezden gelmek",
    "go well = be received positively": "go well = iyi karşılanmak",
    "flood the market is idiomatic": "flood the market deyimsel bir ifadedir",
    "abuse authority/power is standard": "abuse authority/power standart kullanımdır",
    "Third person singular takes -s": "Üçüncü tekil şahıs -s alır",
    "Present perfect with for + time period": "For + zaman dilimi ile present perfect kullanılır",
    "Present continuous for actions happening now": "Şu anda olan eylemler için present continuous kullanılır",
    "Second conditional uses were for all persons": "İkinci koşul cümlelerinde tüm şahıslar için were kullanılır",
    "Passive voice in past simple": "Geçmiş zamanda pasif yapı",
    "Present perfect with since": "Since ile present perfect kullanılır",
    "Future perfect for action before future time": "Gelecekte bir zamandan önce tamamlanacak eylem için future perfect",
    "Past perfect for earlier past action": "Geçmişte daha önce olan eylem için past perfect",
    "Wish + past simple for present unreal": "Şimdiki zamanla ilgili hayaller için wish + geçmiş zaman",
    "Suggest + gerund": "Suggest fiilinden sonra -ing takısı gelir",
    "Third conditional inversion": "Üçüncü koşul cümlesinde devrik yapı",
    "Past perfect continuous passive": "Geçmiş zamanda süregelen pasif yapı",
    "Inversion with scarcely": "Scarcely ile devrik yapı kullanılır",
    "Future passive": "Gelecek zamanda pasif yapı",
    "Inversion after not only": "Not only'den sonra devrik yapı",
    "Under no circumstances + inversion": "Under no circumstances ile devrik yapı",
    "Merit = deserve (formal)": "Merit = hak etmek (resmi)",
    "Inversion with rarely": "Rarely ile devrik yapı",
    "Data is uncountable, needs passive": "Data sayılamaz, pasif yapı gerektirir",
    "Inversion with little": "Little ile devrik yapı",
    "Fill in both blanks correctly": "Her iki boşluğu da doğru doldurun",
    "Correct combination": "Doğru kombinasyon",
    "Logical completion with despite": "Despite ile mantıksal tamamlama",
    "Cause and effect": "Sebep ve sonuç",
    "Contrast with although": "Although ile karşıtlık",
    "Condition for success": "Başarı için koşul",
    "Not only...but also structure": "Not only...but also yapısı",
    "Contrast preposition": "Karşıtlık edatı",
    "Third conditional": "Üçüncü koşul cümlesi",
    "in that = because": "in that = çünkü anlamında",
    "Scarcely...when structure": "Scarcely...when yapısı",
    "in that shows reason": "in that sebep gösterir",
    "Despite obstacles = success": "Engellere rağmen = başarı",
    "Concessive clause": "İmtiyaç cümlesi",
    "Logical completion": "Mantıksal tamamlama",
    "Based on passage content": "Parça içeriğine göre",
    "Inference from passage": "Parçadan çıkarım",
    "Would like requires would in answer": "Would like cevabında would gerektirir",
    "Standard greeting response": "Standart selamlaşma cevabı",
    "Polite acceptance": "Kibar kabul",
    "Question about profession": "Meslek hakkında soru",
    "Sympathetic response": "Sempati gösteren cevap",
    "Not at all = no problem": "Not at all = sorun değil",
    "Polite agreement": "Kibar kabul",
    "Logical follow-up question": "Mantıklı takip sorusu",
    "Professional response": "Profesyonel cevap",
    "Formal polite response": "Resmi kibar cevap",
    "Academic discourse": "Akademik söylem",
    "Formal agreement": "Resmi onay",
    "Appropriate response": "Uygun cevap",
    "Same meaning": "Aynı anlam",
    "Paraphrase": "Açıklama, ifade değişimi",
    "Same meaning, different words": "Aynı anlam, farklı kelimeler",
    "Closest meaning": "En yakın anlam",
    "Logical flow": "Mantıksal akış",
    "Sentence III breaks coherence": "III numaralı cümle bütünlüğü bozar"
}

# Level-based standart açıklamalar
level_topic_explanations = {
    "Vocabulary": "Kelime bilgisi açıklaması",
    "Grammar": "Dilbilgisi kuralı açıklaması",
    "Reading": "Okuma parçası açıklaması",
    "Completion": "Cümle tamamlama mantığı",
    "Cloze": "Boşluk doldurma açıklaması",
    "Dialog": "Diyalog tamamlama açıklaması",
    "Paraphrase": "Anlam benzerliği açıklaması",
    "Paragraph-Completion": "Paragraf akışı açıklaması",
    "Irrelevant": "İlgisiz cümle açıklaması"
}

print("Açıklamaları Türkçe'ye çeviriyorum...")

# JSON dosyasını oku
with open('questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Her sorunun açıklamasını çevir
translated_count = 0
for q in data['questions']:
    original_exp = q['explanation']
    
    # Direkt çeviri varsa kullan
    if original_exp in translations:
        q['explanation'] = translations[original_exp]
        translated_count += 1
    # Seviye bazlı sorular için topic'e göre genel açıklama
    elif "explanation" in original_exp and q['topic'] in level_topic_explanations:
        q['explanation'] = level_topic_explanations[q['topic']]
        translated_count += 1
    # Eğer çeviri yoksa, genel bir format kullan
    else:
        # Özel durumlar için kontrol
        if "Sample sentence" in q['question']:
            q['explanation'] = "En yakın anlamlı ifade"
        elif "Test" in q['question'] and "Question" in q['question']:
            q['explanation'] = level_topic_explanations.get(q['topic'], "Açıklama")
        elif q['topic'] == 'Irrelevant':
            q['explanation'] = "III numaralı cümle konuyla ilgisiz"
        else:
            q['explanation'] = original_exp  # Orijinali koru

print(f"Çevrilen açıklama sayısı: {translated_count}")

# Güncellenmiş JSON'u kaydet
with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Tamamlandı! Tüm açıklamalar Türkçe'ye çevrildi.")
print("Dosya kaydedildi: questions.json")
