# 📚 KİTKİT - YDS Hazırlık Uygulaması

Firebase tabanlı, kullanıcı adı ile giriş yapılan interaktif YDS sınav hazırlık platformu.

## 🌐 Canlı Demo

**[🎯 Uygulamayı Deneyin](https://tekee1925.github.io/KITKIT-uygulamasi/)**

> Kayıt olup hemen kullanmaya başlayabilirsiniz!

## 🚀 Özellikler

- ✅ **Kullanıcı Adı ile Giriş** - Email yerine benzersiz kullanıcı adı sistemi
- ✅ **Güvenli Kimlik Doğrulama** - Firebase Authentication ile güvenli giriş
- ✅ **Soru Bankası** - JSON tabanlı esnek soru yapısı
- ✅ **İlerleme Takibi** - Firestore ile kullanıcı verilerinin saklanması
- ✅ **Responsive Tasarım** - Mobil ve masaüstü uyumlu arayüz

## 📋 Kurulum

### Adım 1: Projeyi Klonlayın

```bash
git clone https://github.com/tekee1925/KITKIT-uygulamasi.git
cd KITKIT-uygulamasi
```

### Adım 2: Firebase Yapılandırması

1. **Firebase projesi oluşturun:**
   - [Firebase Console](https://console.firebase.google.com) adresine gidin
   - "Add project" ile yeni proje oluşturun
   - Web uygulaması (</>) ekleyin

2. **Config dosyasını hazırlayın:**
   ```bash
   copy firebase-config.template.js firebase-config.js
   ```

3. **Firebase ayarlarınızı ekleyin:**
   - Firebase Console > Project Settings > Your apps
   - Config bilgilerini kopyalayın
   - `firebase-config.js` dosyasındaki `YOUR_*` değerlerini gerçek değerlerle değiştirin

### Adım 3: Firebase Servislerini Aktifleştirin

**Authentication:**
- Firebase Console > Authentication
- "Get started" butonuna tıklayın
- Sign-in method > Email/Password'u aktifleştirin

**Firestore Database:**
- Firebase Console > Firestore Database
- "Create database" butonuna tıklayın
- Test mode seçin (geliştirme için)
- Region seçin (örn: europe-west)

**Security Rules:**

Firestore > Rules sekmesinde aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - sadece kendi verilerine erişim
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usernames - herkes okuyabilir, authenticated kullanıcılar yazabilir
    match /usernames/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Adım 4: Uygulamayı Çalıştırın

```bash
# Python 3
python -m http.server 8000
```

Tarayıcınızda **http://localhost:8000** adresini açın.

## 🎯 Kullanım

1. **Kayıt Olun:** Kullanıcı adı, ad soyad ve şifre ile kayıt olun
2. **Giriş Yapın:** Kullanıcı adınız ve şifrenizle giriş yapın
3. **Sorulara Başlayın:** Quiz sorularını cevaplayın
4. **İlerlemenizi Takip Edin:** Verileriniz otomatik olarak kaydedilir

## 🛠️ Teknolojiler

- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Backend:** Firebase
  - Authentication (Email/Password)
  - Firestore Database
- **Styling:** Custom CSS

## 📁 Proje Yapısı

```
KITKIT-uygulamasi/
├── index.html                      # Ana HTML dosyası
├── app.js                          # Uygulama mantığı
├── styles.css                      # Stil dosyası
├── questions.json                  # Soru bankası
├── firebase-config.js              # Firebase config (GİZLİ - .gitignore)
├── firebase-config.template.js     # Config şablonu
├── .gitignore                      # Git ignore kuralları
├── README.md                       # Bu dosya
├── FIREBASE_SETUP.md               # Detaylı Firebase kurulum
├── DOMAIN_AUTHORIZATION_FIX.md     # Domain yetkilendirme kılavuzu
└── assets/                         # Medya dosyaları
    ├── KİTKİTlogo.jpg              # Uygulama logosu
    ├── chill-drum-loop-6887.mp3    # Arka plan müziği
    ├── correct-6033.mp3            # Doğru cevap sesi
    └── wrong-answer-126515.mp3     # Yanlış cevap sesi
```

## 🔒 Güvenlik

⚠️ **ÖNEMLİ:** `firebase-config.js` dosyası hassas bilgiler içerir!

- ✅ `.gitignore` ile GitHub'dan hariç tutulmuştur
- ✅ Asla public repository'ye yüklemeyin
- ✅ Şablon dosya (`firebase-config.template.js`) kullanın

## 📝 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

⭐ Beğendiyseniz yıldız vermeyi unutmayın!
