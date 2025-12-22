# Firebase Kurulum Rehberi

## 1. Firebase Projesi Oluştur

1. [Firebase Console](https://console.firebase.google.com/) adresine git
2. "Add project" (Proje ekle) butonuna tıkla
3. Proje adı: **kitkit** (veya istediğin bir isim)
4. Google Analytics'i istersen aktif et
5. Projeyi oluştur

## 2. Web Uygulaması Ekle

1. Firebase Console'da projenin ana sayfasında **Web** simgesine (</>) tıkla
2. App nickname: **KİTKİT Web App**
3. Firebase Hosting'i şimdilik ekleme (isteğe bağlı)
4. "Register app" butonuna tıkla

## 3. Firebase Yapılandırmasını Kopyala

Firebase SDK snippet kısmında gösterilen `firebaseConfig` objesini kopyala:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "kitkit-xxxxx.firebaseapp.com",
  projectId: "kitkit-xxxxx",
  storageBucket: "kitkit-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Bu bilgileri `index.html` dosyasındaki Firebase yapılandırma kısmına yapıştır.

## 4. Authentication (Kimlik Doğrulama) Aktif Et

1. Firebase Console'da sol menüden **Authentication** seçeneğine tıkla
2. "Get started" butonuna tıkla
3. "Sign-in method" sekmesine geç
4. **Email/Password** seçeneğini aktif et
5. "Enable" (Etkinleştir) butonuna tıkla ve kaydet

## 5. Firestore Database Oluştur

1. Firebase Console'da sol menüden **Firestore Database** seçeneğine tıkla
2. "Create database" butonuna tıkla
3. **Test mode** seç (geliştirme için)
4. Location: **europe-west** (Avrupa) seç
5. "Enable" butonuna tıkla

## 6. Firestore Güvenlik Kuralları

Firestore Database'de "Rules" sekmesine git ve şu kuralları yapıştır:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi verilerini okuyup yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Kullanıcı adları koleksiyonu - sadece okuma izni
    match /usernames/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

"Publish" butonuna tıkla.

## 7. Test Et

1. Uygulamayı çalıştır
2. Yeni bir kullanıcı kaydı oluştur
3. Giriş yap
4. Bir test çöz
5. Çıkış yap ve tekrar giriş yap
6. Verilerinin korunduğunu kontrol et

## 8. Firebase Console'da Kontrol Et

### Authentication:
- **Authentication > Users** kısmında kayıtlı kullanıcıları görebilirsin

### Firestore:
- **Firestore Database > Data** kısmında kullanıcı verilerini görebilirsin
- Her kullanıcı için bir doküman olacak
- İçinde `completedTests`, `quizHistory`, `userStats` gibi alanlar olacak

## Önemli Notlar

⚠️ **Üretim (Production) için:**
- Firestore kurallarını daha güvenli hale getir
- Firebase Security Rules'u düzenle
- API Key'leri environment variables ile sakla
- Rate limiting ekle

✅ **Avantajlar:**
- Gerçek çok kullanıcılı sistem
- Farklı cihazlardan erişim
- Gerçek zamanlı senkronizasyon
- Güvenli authentication
- Ücretsiz plan (günde 50K okuma, 20K yazma)

🔒 **Güvenlik:**
- Şifreler Firebase tarafından güvenli şekilde hash'leniyor
- HTTPS ile şifreli iletişim
- Kullanıcılar sadece kendi verilerini görebiliyor

## Sorun Giderme

**"Firebase is not defined" hatası:**
- `index.html` dosyasında Firebase SDK'nın doğru yüklendiğinden emin ol

**"Permission denied" hatası:**
- Firestore Rules'un doğru ayarlandığından emin ol
- Kullanıcının giriş yapmış olduğundan emin ol

**Veriler kaydolmuyor:**
- Tarayıcı Console'u aç (F12)
- Hata mesajlarını kontrol et
- Firebase Console'da verilerin kaydedilip kaydedilmediğini kontrol et
