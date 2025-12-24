import json

print("Reading comprehension sorularını kaldırıyorum...")

# JSON dosyasını oku
with open('questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Başlangıç soru sayısı
initial_count = len(data['questions'])

# Reading olmayan soruları filtrele
data['questions'] = [q for q in data['questions'] if q.get('topic') != 'Reading']

# Yeni soru sayısı
final_count = len(data['questions'])
removed_count = initial_count - final_count

# Güncellenmiş JSON'u kaydet
with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Tamamlandı!")
print(f"Kaldırılan Reading sorusu: {removed_count}")
print(f"Kalan toplam soru sayısı: {final_count}")
print("Dosya kaydedildi: questions.json")
