// ============================================
// YDS HAZIRLIK UYGULAMASI - REFACTORED VERSION
// ============================================

// App State - Simplified & Clean
const state = {
    currentPage: 'login',
    user: null,
    currentQuestion: 0,
    selectedAnswer: null,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timer: null,
    timerInterval: null,
    quizActive: false,
    currentTestQuestions: [],
    showRegister: false,
    selectedLevel: null, // A2, B1, B2, C1, C2
    selectedTopic: null, // Grammar, Vocabulary, Reading, etc.
    userStats: {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageScore: 0,
        quizHistory: [] // { date, score, total, percentage, duration }
    }
};

let allQuestions = [];

// ============================================
// FIREBASE FUNCTIONS
// ============================================

function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseAuth && window.firebaseDb) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.firebaseAuth && window.firebaseDb) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }
    });
}

async function checkUsernameAvailability(username) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const usernameDoc = await getDoc(doc(window.firebaseDb, 'usernames', username.toLowerCase()));
        return !usernameDoc.exists();
    } catch (error) {
        console.error('Username check error:', error);
        return false;
    }
}

async function firebaseLogin(username, password) {
    const { signInWithEmailAndPassword } = window.firebaseModules;
    const email = `${username.toLowerCase()}@kitkit.app`;
    
    try {
        const userCredential = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

async function firebaseRegister(username, password, fullname) {
    const { createUserWithEmailAndPassword, doc, setDoc } = window.firebaseModules;
    const email = `${username.toLowerCase()}@kitkit.app`;
    
    try {
        // Kullanıcı adı müsait mi kontrol et
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
            throw new Error('Bu kullanıcı adı zaten kullanılıyor');
        }
        
        // Firebase Auth ile kullanıcı oluştur
        const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Firestore'da kullanıcı verisi oluştur
        await setDoc(doc(window.firebaseDb, 'users', user.uid), {
            username: username.toLowerCase(),
            name: fullname,
            createdAt: new Date().toISOString(),
            stats: {
                totalQuizzes: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                averageScore: 0,
                quizHistory: []
            }
        });
        
        // Username mapping oluştur
        await setDoc(doc(window.firebaseDb, 'usernames', username.toLowerCase()), {
            uid: user.uid
        });
        
        return user;
    } catch (error) {
        throw error;
    }
}

async function loadUserData(uid) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const userDoc = await getDoc(doc(window.firebaseDb, 'users', uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            state.user = {
                uid: uid,
                username: userData.username,
                name: userData.name
            };
            state.userStats = userData.stats || {
                totalQuizzes: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                averageScore: 0,
                quizHistory: []
            };
        }
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

async function saveQuizResult(score, total, duration) {
    if (!state.user) return;
    
    try {
        const { doc, updateDoc, arrayUnion } = window.firebaseModules;
        
        const percentage = Math.round((score / total) * 100);
        const quizResult = {
            date: new Date().toISOString(),
            score: score,
            total: total,
            percentage: percentage,
            duration: duration
        };
        
        // İstatistikleri güncelle
        const newTotalQuizzes = state.userStats.totalQuizzes + 1;
        const newTotalQuestions = state.userStats.totalQuestions + total;
        const newCorrectAnswers = state.userStats.correctAnswers + score;
        const newWrongAnswers = state.userStats.wrongAnswers + (total - score);
        const newAverageScore = Math.round((newCorrectAnswers / newTotalQuestions) * 100);
        
        await updateDoc(doc(window.firebaseDb, 'users', state.user.uid), {
            'stats.totalQuizzes': newTotalQuizzes,
            'stats.totalQuestions': newTotalQuestions,
            'stats.correctAnswers': newCorrectAnswers,
            'stats.wrongAnswers': newWrongAnswers,
            'stats.averageScore': newAverageScore,
            'stats.quizHistory': arrayUnion(quizResult)
        });
        
        // State'i güncelle
        state.userStats.totalQuizzes = newTotalQuizzes;
        state.userStats.totalQuestions = newTotalQuestions;
        state.userStats.correctAnswers = newCorrectAnswers;
        state.userStats.wrongAnswers = newWrongAnswers;
        state.userStats.averageScore = newAverageScore;
        state.userStats.quizHistory.push(quizResult);
        
    } catch (error) {
        console.error('Save quiz result error:', error);
    }
}

// ============================================
// AUTH HANDLERS
// ============================================

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Lütfen tüm alanları doldurun');
        return;
    }
    
    try {
        await waitForFirebase();
        const user = await firebaseLogin(username, password);
        await loadUserData(user.uid);
        state.currentPage = 'dashboard';
        render();
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            alert('Kullanıcı adı veya şifre hatalı');
        } else {
            alert('Giriş yapılırken bir hata oluştu: ' + error.message);
        }
    }
}

async function handleRegisterSubmit() {
    const username = document.getElementById('reg-username').value.trim();
    const fullname = document.getElementById('reg-fullname').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    // Validasyon
    if (!username || !fullname || !password || !confirmPassword) {
        alert('Lütfen tüm alanları doldurun');
        return;
    }
    
    if (username.length < 3 || username.length > 20) {
        alert('Kullanıcı adı 3-20 karakter arasında olmalıdır');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        alert('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
        return;
    }
    
    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Şifreler eşleşmiyor');
        return;
    }
    
    try {
        await waitForFirebase();
        const user = await firebaseRegister(username, password, fullname);
        await loadUserData(user.uid);
        state.currentPage = 'dashboard';
        render();
    } catch (error) {
        if (error.message === 'Bu kullanıcı adı zaten kullanılıyor') {
            alert(error.message);
        } else if (error.code === 'auth/email-already-in-use') {
            alert('Bu kullanıcı adı zaten kullanılıyor');
        } else if (error.code === 'auth/weak-password') {
            alert('Şifre çok zayıf. Daha güçlü bir şifre seçin');
        } else {
            alert('Kayıt olurken bir hata oluştu: ' + error.message);
        }
    }
}

function logout() {
    const { signOut } = window.firebaseModules;
    signOut(window.firebaseAuth);
    state.user = null;
    state.userStats = {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageScore: 0,
        quizHistory: []
    };
    state.currentPage = 'login';
    render();
}

// ============================================
// QUIZ FUNCTIONS
// ============================================

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        // JSON dosyası { questions: [...] } formatında
        allQuestions = Array.isArray(data) ? data : (data.questions || []);
    } catch (error) {
        console.error('Sorular yüklenemedi:', error);
        alert('Sorular yüklenemedi. Lütfen sayfayı yenileyin.');
    }
}

function exitQuiz() {
    if (confirm('Testi sonlandırmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecek.')) {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }
        state.quizActive = false;
        state.currentPage = 'dashboard';
        state.selectedAnswer = null;
        state.currentQuestion = 0;
        state.currentTestQuestions = [];
        render();
    }
}

function startMockExam(examNumber) {
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        alert('Sorular henüz yüklenmedi. Lütfen bekleyin.');
        return;
    }
    
    // Seed bazlı rastgele sıralama için basit hash fonksiyonu
    const seed = examNumber * 12345;
    const seededRandom = (index) => {
        const x = Math.sin(seed + index) * 10000;
        return x - Math.floor(x);
    };
    
    // Soruları kopyala ve seed bazlı karıştır
    const shuffled = [...allQuestions]
        .map((q, i) => ({ q, sort: seededRandom(i) }))
        .sort((a, b) => a.sort - b.sort)
        .map(item => item.q);
    
    // İlk 80 soruyu al
    state.currentTestQuestions = shuffled.slice(0, Math.min(80, shuffled.length));
    
    // State'i sıfırla
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.selectedAnswer = null;
    state.quizActive = true;
    state.timer = 80 * 60; // 80 dakika (soru başına 1 dakika)
    state.startTime = Date.now();
    state.selectedLevel = null;
    state.selectedTopic = null;
    
    // Timer başlat
    startTimer();
    
    // Quiz sayfasına geç
    state.currentPage = 'quiz';
    render();
}

function startQuiz(level = null, topic = null) {
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        alert('Sorular henüz yüklenmedi. Lütfen bekleyin.');
        return;
    }
    
    // Filtrele: level veya topic seçildiyse
    let filteredQuestions = allQuestions;
    if (level) {
        filteredQuestions = filteredQuestions.filter(q => q.level === level);
    }
    if (topic) {
        filteredQuestions = filteredQuestions.filter(q => q.topic === topic);
    }
    
    if (filteredQuestions.length === 0) {
        alert('Bu kategoride soru bulunamadı.');
        return;
    }
    
    // Random 20 soru seç (veya mevcut kadar)
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const questionCount = Math.min(20, shuffled.length);
    state.currentTestQuestions = shuffled.slice(0, questionCount);
    
    // State'i sıfırla
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.selectedAnswer = null;
    state.quizActive = true;
    state.timer = 1200; // 20 dakika
    state.startTime = Date.now();
    state.selectedLevel = level;
    state.selectedTopic = topic;
    
    // Timer başlat
    startTimer();
    
    // Quiz sayfasına geç
    state.currentPage = 'quiz';
    render();
}

function startTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    
    state.timerInterval = setInterval(() => {
        state.timer--;
        
        // Timer'ı güncelle
        const timerElement = document.querySelector('.timer');
        if (timerElement) {
            const minutes = Math.floor(state.timer / 60);
            const seconds = state.timer % 60;
            timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (state.timer <= 0) {
            clearInterval(state.timerInterval);
            endQuiz();
        }
    }, 1000);
}

function selectAnswer(index) {
    if (!state.quizActive) return;
    state.selectedAnswer = index;
    render();
}

function submitAnswer() {
    if (state.selectedAnswer === null) {
        alert('Lütfen bir cevap seçin');
        return;
    }
    
    const currentQ = state.currentTestQuestions[state.currentQuestion];
    const correct = currentQ.correctAnswer === state.selectedAnswer;
    
    if (correct) {
        state.score++;
        state.correctAnswers++;
    } else {
        state.wrongAnswers++;
    }
    
    // Sonraki soruya geç
    if (state.currentQuestion < state.currentTestQuestions.length - 1) {
        state.currentQuestion++;
        state.selectedAnswer = null;
        render();
    } else {
        endQuiz();
    }
}

async function endQuiz() {
    clearInterval(state.timerInterval);
    state.quizActive = false;
    
    const duration = Math.round((Date.now() - state.startTime) / 1000);
    
    // Firebase'e kaydet
    await saveQuizResult(state.score, state.currentTestQuestions.length, duration);
    
    state.currentPage = 'quiz-result';
    render();
}

function getPerformanceMessage(percentage) {
    if (percentage >= 90) return { emoji: '🎉', message: 'Mükemmel!', color: '#4CAF50' };
    if (percentage >= 80) return { emoji: '⭐', message: 'Çok İyi!', color: '#66BB6A' };
    if (percentage >= 70) return { emoji: '👍', message: 'İyi!', color: '#FFA726' };
    if (percentage >= 60) return { emoji: '📚', message: 'Fena değil', color: '#FF9800' };
    return { emoji: '💪', message: 'Daha çok çalışmalısın', color: '#EF5350' };
}

// ============================================
// NAVIGATION
// ============================================

function changePage(event, page) {
    if (event) event.preventDefault();
    state.currentPage = page;
    render();
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderLogin() {
    return `
        <div class="login-container">
            <div class="login-box">
                <div class="logo-section">
                    <svg width="60" height="60" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="#2196F3"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <h1>KİTKİT</h1>
                    <p>İngilizce Sınav Başarısı için Dijital Asistanın</p>
                </div>
                
                ${state.showRegister ? `
                    <div class="form-container">
                        <h2>Kayıt Ol</h2>
                        <input type="text" id="reg-username" placeholder="Kullanıcı Adı" maxlength="20">
                        <input type="text" id="reg-fullname" placeholder="Ad Soyad">
                        <input type="password" id="reg-password" placeholder="Şifre" minlength="6">
                        <input type="password" id="reg-confirm-password" placeholder="Şifre Tekrar">
                        <button onclick="handleRegisterSubmit()" class="btn-primary">Kayıt Ol</button>
                        <p style="text-align: center; margin-top: 20px;">
                            Hesabın var mı? 
                            <a href="#" onclick="state.showRegister = false; render();" style="color: #2196F3;">Giriş Yap</a>
                        </p>
                    </div>
                ` : `
                    <div class="form-container">
                        <h2>Giriş Yap</h2>
                        <input type="text" id="username" placeholder="Kullanıcı Adı" onkeypress="if(event.key==='Enter') handleLogin()">
                        <input type="password" id="password" placeholder="Şifre" onkeypress="if(event.key==='Enter') handleLogin()">
                        <button onclick="handleLogin()" class="btn-primary">Giriş Yap</button>
                        <p style="text-align: center; margin-top: 20px;">
                            Hesabın yok mu? 
                            <a href="#" onclick="state.showRegister = true; render();" style="color: #2196F3;">Kayıt Ol</a>
                        </p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderDashboard() {
    const recentQuizzes = state.userStats.quizHistory.slice(-5).reverse();
    
    return `
        <div class="dashboard">
            ${renderNavbar('dashboard')}
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>Hoş geldin, ${state.user.name}!</h1>
                    <p>Hemen bir test çözmeye başla</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Çözülen Test</h3>
                        <div class="value">${state.userStats.totalQuizzes}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Toplam Soru</h3>
                        <div class="value">${state.userStats.totalQuestions}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Doğru Cevap</h3>
                        <div class="value">${state.userStats.correctAnswers}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Ortalama Başarı</h3>
                        <div class="value">${state.userStats.averageScore}%</div>
                    </div>
                </div>
                
                <div class="card" style="grid-column: 1 / -1;">
                    <h2>📝 Deneme Sınavları (80 Soru)</h2>
                    <p style="margin-bottom: 20px; color: #666;">Gerçek sınav formatında tam deneme testleri</p>
                    <div class="level-buttons">
                        <button onclick="startMockExam(1)" class="btn-level" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">1. Deneme</button>
                        <button onclick="startMockExam(2)" class="btn-level" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none;">2. Deneme</button>
                        <button onclick="startMockExam(3)" class="btn-level" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none;">3. Deneme</button>
                    </div>
                </div>
                
                <div class="cards-grid">
                    <div class="card">
                        <h2>🎯 Seviyeye Göre Test</h2>
                        <div class="level-buttons" style="grid-template-columns: repeat(6, 1fr);">
                            <button onclick="startQuiz('A1', null)" class="btn-level">A1</button>
                            <button onclick="startQuiz('A2', null)" class="btn-level">A2</button>
                            <button onclick="startQuiz('B1', null)" class="btn-level">B1</button>
                            <button onclick="startQuiz('B2', null)" class="btn-level">B2</button>
                            <button onclick="startQuiz('C1', null)" class="btn-level">C1</button>
                            <button onclick="startQuiz('C2', null)" class="btn-level">C2</button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2>📚 Konuya Göre Test</h2>
                        <div class="topic-buttons">
                            <button onclick="startQuiz(null, 'Grammar')" class="btn-topic">Grammar</button>
                            <button onclick="startQuiz(null, 'Vocabulary')" class="btn-topic">Vocabulary</button>
                            <button onclick="startQuiz(null, 'Reading')" class="btn-topic">Reading</button>
                            <button onclick="startQuiz(null, 'Prepositions')" class="btn-topic">Prepositions</button>
                        </div>
                        <button onclick="startQuiz(null, null)" class="btn-random">🎲 Rastgele Test Başlat</button>
                    </div>
                </div>
                
                <div class="card">
                        <h2>Son Testlerin</h2>
                        ${recentQuizzes.length > 0 ? recentQuizzes.map(quiz => `
                            <div class="quiz-history-item">
                                <div>
                                    <div class="quiz-score">${quiz.score}/${quiz.total}</div>
                                    <div class="quiz-date">${new Date(quiz.date).toLocaleDateString('tr-TR')}</div>
                                </div>
                                <div class="quiz-percentage" style="color: ${quiz.percentage >= 70 ? '#4CAF50' : '#FF9800'}">
                                    %${quiz.percentage}
                                </div>
                            </div>
                        `).join('') : '<p style="text-align: center; color: #999;">Henüz test çözmedin</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderQuiz() {
    if (!state.quizActive) {
        return renderDashboard();
    }
    
    const currentQ = state.currentTestQuestions[state.currentQuestion];
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    
    return `
        <div class="quiz-container">
            <div class="quiz-header">
                <div class="quiz-progress">Soru ${state.currentQuestion + 1} / ${state.currentTestQuestions.length}</div>
                <div class="timer">⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}</div>
                <button onclick="exitQuiz()" class="btn-exit-quiz" title="Ana Sayfaya Dön">✕ Çıkış</button>
            </div>
            
            <div class="question-card">
                <h2>${currentQ.question}</h2>
                
                <div class="answers-grid">
                    ${currentQ.options.map((option, index) => `
                        <button 
                            class="answer-option ${state.selectedAnswer === index ? 'selected' : ''}"
                            onclick="selectAnswer(${index})"
                        >
                            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                            <span class="option-text">${option}</span>
                        </button>
                    `).join('')}
                </div>
                
                <button onclick="submitAnswer()" class="btn-primary" style="margin-top: 30px;">
                    ${state.currentQuestion === state.currentTestQuestions.length - 1 ? 'Testi Bitir' : 'Sonraki Soru'}
                </button>
            </div>
        </div>
    `;
}

function renderQuizResult() {
    const percentage = Math.round((state.score / state.currentTestQuestions.length) * 100);
    const performance = getPerformanceMessage(percentage);
    
    return `
        <div class="result-container">
            <div class="result-card">
                <div class="result-emoji">${performance.emoji}</div>
                <h1>${performance.message}</h1>
                
                <div class="result-score" style="color: ${performance.color}">
                    ${state.score} / ${state.currentTestQuestions.length}
                </div>
                
                <div class="result-percentage">
                    %${percentage} Başarı
                </div>
                
                <div class="result-stats">
                    <div class="result-stat">
                        <span class="stat-label">Doğru</span>
                        <span class="stat-value correct">${state.correctAnswers}</span>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">Yanlış</span>
                        <span class="stat-value wrong">${state.wrongAnswers}</span>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button onclick="changePage(null, 'dashboard')" class="btn-secondary">Ana Sayfa</button>
                    <button onclick="startQuiz()" class="btn-primary">Yeni Test</button>
                </div>
            </div>
        </div>
    `;
}

function renderProfile() {
    return `
        <div class="dashboard">
            ${renderNavbar('profile')}
            
            <div class="dashboard-content">
                <div class="card profile-card">
                    <h1>Profil</h1>
                    
                    <div class="profile-info">
                        <div class="profile-avatar">👤</div>
                        <h2>${state.user.name}</h2>
                        <p>@${state.user.username}</p>
                    </div>
                    
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="stat-value">${state.userStats.totalQuizzes}</div>
                            <div class="stat-label">Çözülen Test</div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-value">${state.userStats.averageScore}%</div>
                            <div class="stat-label">Ortalama Başarı</div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-value">${state.userStats.totalQuestions}</div>
                            <div class="stat-label">Toplam Soru</div>
                        </div>
                    </div>
                    
                    <button onclick="logout()" class="btn-secondary" style="margin-top: 30px;">Çıkış Yap</button>
                </div>
            </div>
        </div>
    `;
}

function renderNavbar(activePage) {
    return `
        <nav class="navbar">
            <div class="logo">
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill="#2196F3"/>
                    <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                </svg>
                <span style="font-weight: bold; font-size: 20px; margin-left: 10px;">KİTKİT</span>
            </div>
            <ul class="nav-links">
                <li><a href="#" class="${activePage === 'dashboard' ? 'active' : ''}" onclick="changePage(event, 'dashboard')">Ana Sayfa</a></li>
                <li><a href="#" class="${activePage === 'profile' ? 'active' : ''}" onclick="changePage(event, 'profile')">Profil</a></li>
            </ul>
            <div class="user-profile" onclick="changePage(event, 'profile')" style="cursor: pointer;" title="Profil">
                👤
            </div>
        </nav>
    `;
}

// ============================================
// MAIN RENDER
// ============================================

function render() {
    const app = document.getElementById('app');
    
    let content = '';
    
    switch (state.currentPage) {
        case 'login':
            content = renderLogin();
            break;
        case 'dashboard':
            content = renderDashboard();
            break;
        case 'quiz':
            content = renderQuiz();
            break;
        case 'quiz-result':
            content = renderQuizResult();
            break;
        case 'profile':
            content = renderProfile();
            break;
        default:
            content = renderDashboard();
    }
    
    app.innerHTML = content;
}

// ============================================
// INITIALIZATION
// ============================================

(async function init() {
    try {
        // İlk ekranı hemen göster (giriş)
        render();

        // Soruları yükle
        await loadQuestions();

        // Firebase hazır olduğunda auth dinleyicisini bağla
        await waitForFirebase();
        const { onAuthStateChanged } = window.firebaseModules;
        onAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                await loadUserData(user.uid);
                state.currentPage = 'dashboard';
                render();
            } else {
                state.currentPage = 'login';
                render();
            }
        });
    } catch (e) {
        console.error('Uygulama başlatma hatası:', e);
    }
})();
