# Firebase Authentication - Domain Yetkilendirme Sorunu Çözümü

## Sorun
Arkadaşlar linke tıklayınca hesap oluşturamıyor.

## Sebep
Firebase Authentication varsayılan olarak sadece belirli domainlere izin veriyor. Uygulamanız farklı bilgisayarlardan veya IP'lerden erişildiğinde domain yetkisi olmayabiliyor.

## Çözüm Adımları

### 1. Firebase Console'a Git
1. [Firebase Console](https://console.firebase.google.com/) adresine git
2. Projenizi seçin (kitkit veya oluşturduğunuz proje adı)

### 2. Authentication Ayarlarına Git
1. Sol menüden **Authentication** seçeneğine tıklayın
2. Üst menüden **Settings** (Ayarlar) sekmesine geçin
3. **Authorized domains** (Yetkili domainler) bölümünü bulun

### 3. Yetkili Domain Ekle

**Localhost için:**
- `localhost` (zaten olmalı)
- `127.0.0.1` (zaten olmalı)

**Dış erişim için (ÖNEMLİ):**
Eğer uygulamayı GitHub Pages, Netlify, Vercel veya başka bir hosting'de yayınladıysanız:
- Domain adınızı ekleyin (örn: `kitkit-app.netlify.app`)

**Geliştirme için:**
Eğer local network'te paylaşıyorsanız:
- **"Add domain"** butonuna tıklayın
- Local IP adresinizi ekleyin (örn: `192.168.1.100`)

### 4. Live Server / Local Host Ayarları

**VS Code Live Server kullanıyorsanız:**
1. VS Code'da `settings.json` dosyasını açın (Ctrl+Shift+P → "Preferences: Open Settings (JSON)")
2. Şu ayarı ekleyin:
```json
{
  "liveServer.settings.host": "0.0.0.0"
}
```
3. Live Server'ı yeniden başlatın

**Python SimpleHTTPServer kullanıyorsanız:**
```bash
python -m http.server 8000 --bind 0.0.0.0
```

**Node.js http-server kullanıyorsanız:**
```bash
http-server -p 8000 -a 0.0.0.0
```

### 5. Firewall ve Güvenlik

**Windows Firewall:**
1. Windows Defender Firewall açın
2. "Advanced settings" → "Inbound Rules"
3. Port 8000 (veya kullandığınız port) için izin verin

### 6. CORS Sorunu Varsa

Eğer CORS hatası alıyorsanız, Firebase Console'da:
1. **Firestore Database** → **Rules** kısmına gidin
2. Kuralları kontrol edin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi verilerini okuyup yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Kullanıcı adları koleksiyonu - herkes okuyabilir, sadece giriş yapanlar yazabilir
    match /usernames/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 7. Test Modundan Production'a Geçiş

**Firestore Database Rules (Üretim için - ÖNEMLİ!):**

Eğer uygulamayı gerçekten yayınlayacaksanız, Rules'u şu şekilde güncelleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcı verilerini sadece sahibi okuyup yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Stats sadece sahibi güncelleyebilir
      allow update: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.data.stats is map;
    }
    
    // Username kontrolü - herkes okuyabilir
    match /usernames/{username} {
      allow read: if true;
      // Sadece giriş yapanlar username oluşturabilir
      allow create: if request.auth != null &&
                       request.resource.data.uid == request.auth.uid;
      // Kimse silemez veya güncelleyemez
      allow update, delete: if false;
    }
  }
}
```

## Önerilen Hosting Seçenekleri

### GitHub Pages (Ücretsiz)
1. Repo'nuzu public yapın
2. Settings → Pages → Source: main branch
3. Domain: `username.github.io/repo-name`
4. Firebase'de bu domaini authorized domains'e ekleyin

### Netlify (Ücretsiz - Önerilen)
1. [Netlify](https://www.netlify.com/) hesabı oluşturun
2. "New site from Git" → GitHub repo'nuzu bağlayın
3. Deploy settings:
   - Build command: boş bırakın
   - Publish directory: `/` (root)
4. Deploy'a basın
5. Size verilen domain'i (örn: `kitkit-app.netlify.app`) Firebase'de authorized domains'e ekleyin

### Vercel (Ücretsiz)
1. [Vercel](https://vercel.com/) hesabı oluşturun
2. GitHub repo'nuzu import edin
3. Deploy
4. Verilen domain'i Firebase'de authorized domains'e ekleyin

## Hızlı Çözüm (Local Network için)

**Arkadaşlarınız aynı Wi-Fi ağındaysa:**

1. Bilgisayarınızın IP adresini öğrenin:
   ```bash
   # Windows'ta
   ipconfig
   # "IPv4 Address" kısmına bakın (örn: 192.168.1.100)
   ```

2. Firebase Console → Authentication → Settings → Authorized domains
   - Bu IP'yi ekleyin: `192.168.1.100`

3. Live Server'ı dış erişime açın (yukarıdaki ayarlar)

4. Arkadaşlarınıza şu linki verin:
   ```
   http://192.168.1.100:5500
   ```
   (5500 yerine kullandığınız portu yazın)

## Test Etme

1. Farklı bir bilgisayardan veya telefondan uygulamayı açın
2. Yeni hesap oluşturmayı deneyin
3. Eğer hata alırsanız:
   - Tarayıcı Console'u açın (F12)
   - Hata mesajını kontrol edin
   - Firebase Console → Authentication → Users kısmında kullanıcı oluşmuş mu kontrol edin

## Sık Karşılaşılan Hatalar

### "auth/unauthorized-domain"
- Firebase Console'da domain eklemeyi unutmuşsunuz
- Çözüm: Yukarıdaki adım 3'ü uygulayın

### "auth/network-request-failed"
- İnternet bağlantısı problemi
- Firewall Firebase'i engelliyor olabilir

### "Permission denied"
- Firestore Rules çok kısıtlayıcı
- Çözüm: Yukarıdaki Firestore Rules'u uygulayın

### "CORS policy error"
- Dosyayı doğrudan dosya sisteminden açıyorsunuz (file://)
- Çözüm: Mutlaka bir web server kullanın (Live Server, http-server, vb.)

## Öneriler

✅ **Yapılması Gerekenler:**
1. Uygulamayı bir hosting servise yükleyin (Netlify önerilir)
2. Firebase'de o domain'i yetkilendirin
3. Arkadaşlarınıza hosting URL'ini gönderin
4. Production için Firestore Rules'u güncelleyin

❌ **Yapılmaması Gerekenler:**
1. Firebase API anahtarlarını public repo'da paylaşmayın (güvenlik riski değil ama kötüye kullanılabilir)
2. Test mode'da uzun süre bırakmayın
3. Firestore'u herkese açık bırakmayın

## Yardım

Hala sorun yaşıyorsanız:
1. Tarayıcı Console'daki (F12) hata mesajını kontrol edin
2. Firebase Console → Authentication → Users kısmında kayıt oluşuyor mu bakın
3. Network sekmesinde hangi isteklerin başarısız olduğunu kontrol edin
