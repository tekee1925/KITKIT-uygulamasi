# 📚 KİTKİT - YDS Hazırlık Uygulaması

Firebase tabanlı, kullanıcı adı ile giriş yapılan interaktif YDS sınav hazırlık platformu.

## 🌐 Canlı Demo

**[🎯 Uygulamayı Deneyin](https://tekee1925.github.io/KITKIT-uygulamasi/)**

> Kayıt olup hemen kullanmaya başlayabilirsiniz!

## 🚀 Özellikler

- ✅ **Kullanıcı Adı ile Giriş** - Email yerine benzersiz kullanıcı adı sistemi
- ✅ **Güvenli Kimlik Doğrulama** - Firebase Authentication ile güvenli giriş
- ✅ **Soru Bankası** - 500+ soru, seviye ve konuya göre filtreleme
- ✅ **İlerleme Takibi** - Firestore ile kullanıcı verilerinin saklanması
- ✅ **Deneme Sınavları** - 80 soruluk tam deneme formatı
- ✅ **İstatistikler** - Detaylı performans analizi ve grafikler
- ✅ **Ses Efektleri** - Doğru/yanlış cevap sesleri ve arka plan müziği
- ✅ **Favori Sorular** - Beğendiğin soruları kaydet
- ✅ **Yanlış Sorular** - Yanlış yaptığın soruları tekrar çöz
- ✅ **Responsive Tasarım** - Mobil ve masaüstü uyumlu arayüz

## 📋 Kurulum (Yerel Geliştirme)

### Adım 1: Projeyi Klonlayın

```bash
git clone https://github.com/tekee1925/KITKIT-uygulamasi.git
cd KITKIT-uygulamasi
```

### Adım 2: Uygulamayı Çalıştırın

```bash
# Python 3
python -m http.server 8000
```

Tarayıcınızda **http://localhost:8000** adresini açın.

## 🎯 Kullanım

1. **Kayıt Olun:** Kullanıcı adı, ad soyad ve şifre ile kayıt olun
2. **Giriş Yapın:** Kullanıcı adınız ve şifrenizle giriş yapın
3. **Test Seçin:** Seviye (A1-C2) ve konu seçerek teste başlayın
4. **Deneme Sınavı:** 80 soruluk tam deneme çözün
5. **İstatistikler:** Performansınızı takip edin

## 🛠️ Teknolojiler

- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Backend:** Firebase
  - Authentication (Email/Password)
  - Firestore Database
- **Styling:** Custom CSS
- **Hosting:** GitHub Pages

## 📁 Proje Yapısı

```
KITKIT-uygulamasi/
├── index.html              # Ana HTML dosyası
├── app.js                  # Uygulama mantığı (~2800 satır)
├── styles.css              # Stil dosyası
├── questions.json          # Soru bankası (500+ soru)
├── firebase-config.js      # Firebase yapılandırması
├── .gitignore              # Git ignore kuralları
├── README.md               # Bu dosya
├── FIREBASE_SETUP.md       # Detaylı Firebase kurulum rehberi
└── assets/                 # Medya dosyaları
    ├── KİTKİTlogo.jpg      # Uygulama logosu
    ├── chill-drum-loop-6887.mp3    # Arka plan müziği
    ├── correct-6033.mp3    # Doğru cevap sesi
    └── wrong-answer-126515.mp3     # Yanlış cevap sesi
```

## 🔒 Güvenlik

Firebase API anahtarları istemci tarafı için tasarlanmıştır ve güvenlik şu şekilde sağlanır:

- ✅ **Security Rules** - Kullanıcılar sadece kendi verilerine erişebilir
- ✅ **Authorized Domains** - Sadece izin verilen domainlerden erişim

## 📝 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

⭐ Beğendiyseniz yıldız vermeyi unutmayın!
