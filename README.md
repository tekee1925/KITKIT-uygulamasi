# KİTKİT Quiz Uygulaması

Kullanıcı adı tabanlı kimlik doğrulaması ve Firebase backend ile quiz uygulaması.

## Kurulum Talimatları

### 1. Firebase Yapılandırması

1. `firebase-config.template.js` dosyasını kopyalayın ve `firebase-config.js` olarak kaydedin:
   ```bash
   copy firebase-config.template.js firebase-config.js
   ```

2. `firebase-config.js` dosyasını açın ve kendi Firebase proje bilgilerinizi ekleyin:
   - Firebase Console'dan (https://console.firebase.google.com) projenizi açın
   - Project Settings > Your apps bölümünden web app config'inizi kopyalayın
   - Tüm `YOUR_*` placeholder'ları gerçek değerlerle değiştirin

### 2. Firebase Proje Ayarları

Firebase Console'da aşağıdaki servisleri aktif edin:

#### Authentication
- Email/Password authentication'ı aktif edin

#### Firestore Database
- Test mode ile database oluşturun
- Security Rules'ı aşağıdaki gibi güncelleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users koleksiyonu - sadece kendi verilerine erişim
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usernames koleksiyonu - herkes okuyabilir, sadece authenticated kullanıcılar yazabilir
    match /usernames/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Uygulamayı Çalıştırma

Local bir web server başlatın:

```bash
# Python 3
python -m http.server 8000

# veya Python 2
python -m SimpleHTTPServer 8000
```

Tarayıcınızda `http://localhost:8000` adresini açın.

## Özellikler

- ✅ Kullanıcı adı tabanlı kayıt/giriş sistemi
- ✅ Kullanıcı adı benzersizlik kontrolü
- ✅ Soru ve cevapların Firebase'de saklanması
- ✅ Kullanıcı progress tracking
- ✅ Güvenli kimlik doğrulama

## Güvenlik Notu

⚠️ **ÖNEMLİ**: `firebase-config.js` dosyası gizli bilgiler içerir ve `.gitignore` ile hariç tutulmuştur. Bu dosyayı asla GitHub'a yüklemeyin!

## Teknik Detaylar

- Frontend: Vanilla JavaScript (ES6 Modules)
- Backend: Firebase (Authentication + Firestore)
- Hosting: Static web hosting (GitHub Pages, Netlify, Vercel, vb. kullanılabilir)
