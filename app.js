// App State
const state = {
    currentPage: 'login',
    user: null,
    currentQuestion: 0,
    selectedAnswer: null,
    score: 0,
    timer: 1200, // 20 dakika
    quizActive: false,
    quizStarted: false,
    showRegister: false,
    testType: null, // 'level' veya 'topic'
    selectedLevel: null,
    selectedTopic: null,
    currentTestQuestions: [],
    userStats: {
        generalProgress: 0,
        wordsLearned: 0,
        problemsSolved: 0,
        totalStudyTime: 0,
        vocabulary: 0,
        grammar: 0,
        reading: 0,
        sentenceCompletion: 0,
        dailyGoal: 50,
        dailyProgress: 0
    },
    settings: {
        emailNotifications: true,
        pushNotifications: false,
        language: 'Türkçe'
    },
    settingsActiveTab: 'profile',
    topicPerformance: {},
    quizHistory: [],
    testSelectionTab: 'level',
    completedTests: [] // { type: 'level'/'topic', id: 'A2-1'/'grammar-1' }
};

// Questions will be loaded from JSON file
let allQuestions = [];
let quizData = [];

// Firebase fonksiyonlarını bekle
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

// Firebase Authentication Functions
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

async function getUsernameByUid(uid) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const userDoc = await getDoc(doc(window.firebaseDb, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().username;
        }
        return null;
    } catch (error) {
        console.error('Get username error:', error);
        return null;
    }
}

async function getUidByUsername(username) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const usernameDoc = await getDoc(doc(window.firebaseDb, 'usernames', username.toLowerCase()));
        if (usernameDoc.exists()) {
            return usernameDoc.data().uid;
        }
        return null;
    } catch (error) {
        console.error('Get UID error:', error);
        return null;
    }
}

async function firebaseLogin(username, password) {
    try {
        const { signInWithEmailAndPassword } = window.firebaseModules;
        // Kullanıcı adından e-posta oluştur
        const email = `${username.toLowerCase()}@kitkit.app`;
        const userCredential = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Firebase login error:', error);
        throw error;
    }
}

async function firebaseRegister(username, password, fullname) {
    try {
        const { createUserWithEmailAndPassword, doc, setDoc } = window.firebaseModules;
        
        // Kullanıcı adı müsait mi kontrol et
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
            throw new Error('USERNAME_TAKEN');
        }
        
        // Kullanıcı adından e-posta oluştur
        const email = `${username.toLowerCase()}@kitkit.app`;
        const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Kullanıcı profilini Firestore'a kaydet
        const firstName = fullname.split(' ')[0];
        await setDoc(doc(window.firebaseDb, 'users', user.uid), {
            username: username.toLowerCase(),
            name: firstName,
            fullname: fullname,
            createdAt: new Date().toISOString(),
            completedTests: [],
            quizHistory: [],
            userStats: {
                generalProgress: 0,
                wordsLearned: 0,
                problemsSolved: 0,
                totalStudyTime: 0,
                vocabulary: 0,
                grammar: 0,
                reading: 0,
                sentenceCompletion: 0,
                dailyGoal: 50,
                dailyProgress: 0
            }
        });
        
        // Kullanıcı adını usernames koleksiyonuna kaydet (benzersizlik için)
        await setDoc(doc(window.firebaseDb, 'usernames', username.toLowerCase()), {
            uid: user.uid
        });
        
        return user;
    } catch (error) {
        console.error('Firebase register error:', error);
        throw error;
    }
}

async function firebaseLogout() {
    try {
        const { signOut } = window.firebaseModules;
        await signOut(window.firebaseAuth);
    } catch (error) {
        console.error('Firebase logout error:', error);
        throw error;
    }
}

async function saveUserData() {
    try {
        if (!window.firebaseAuth.currentUser) return;
        
        const { doc, updateDoc } = window.firebaseModules;
        const userRef = doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid);
        
        await updateDoc(userRef, {
            completedTests: state.completedTests,
            quizHistory: state.quizHistory,
            userStats: state.userStats,
            topicPerformance: state.topicPerformance,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

async function loadUserData() {
    try {
        if (!window.firebaseAuth.currentUser) return;
        
        const { doc, getDoc } = window.firebaseModules;
        const userRef = doc(window.firebaseDb, 'users', window.firebaseAuth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            state.user = { 
                username: data.username,
                name: data.name,
                uid: window.firebaseAuth.currentUser.uid
            };
            state.completedTests = data.completedTests || [];
            state.quizHistory = data.quizHistory || [];
            state.userStats = data.userStats || state.userStats;
            state.topicPerformance = data.topicPerformance || {};
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// LocalStorage Functions (Yedek olarak kalabilir)
function saveToLocalStorage() {
    try {
        const dataToSave = {
            user: state.user,
            completedTests: state.completedTests,
            quizHistory: state.quizHistory,
            userStats: state.userStats,
            topicPerformance: state.topicPerformance
        };
        localStorage.setItem('kitkit_data', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('LocalStorage kaydetme hatası:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('kitkit_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.user) state.user = data.user;
            if (data.completedTests) state.completedTests = data.completedTests;
            if (data.quizHistory) state.quizHistory = data.quizHistory;
            if (data.userStats) state.userStats = {...state.userStats, ...data.userStats};
            if (data.topicPerformance) state.topicPerformance = data.topicPerformance;
            
            // Eğer kullanıcı daha önce giriş yapmışsa direkt dashboard'a yönlendir
            if (data.user) {
                state.currentPage = 'dashboard';
            }
        }
    } catch (error) {
        console.error('LocalStorage yükleme hatası:', error);
    }
}

function clearLocalStorage() {
    localStorage.removeItem('kitkit_data');
}

// Load questions from JSON file
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        quizData = data.questions;
        allQuestions = [...quizData];
        
        console.log(`Loaded ${allQuestions.length} questions from JSON`);
        return allQuestions;
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Sorular yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        allQuestions = [];
        return [];
    }
}

const availableTopics = [
    { id: 'grammar', name: 'Grammar', icon: '📖', description: 'Tenses, conditionals, prepositions' },
    { id: 'vocabulary', name: 'Vocabulary', icon: '📚', description: 'Words, meanings, usage' },
    { id: 'reading', name: 'Reading Comprehension', icon: '📝', description: 'Passage understanding' },
    { id: 'phrasal-verbs', name: 'Phrasal Verbs', icon: '⚡', description: 'Multi-word verbs' },
    { id: 'prepositions', name: 'Prepositions', icon: '🔗', description: 'In, on, at, for, etc.' }
];

// Gerçek YDS ve YÖKDİL sınav tarihleri (2025)
const upcomingExams = [
    { name: 'YDS/1 (İlkbahar)', date: '2025-03-30', type: 'YDS' },
    { name: 'YÖKDİL Sosyal/1', date: '2025-05-11', type: 'YÖKDİL' },
    { name: 'YÖKDİL Fen/1', date: '2025-05-11', type: 'YÖKDİL' },
    { name: 'YÖKDİL Sağlık/1', date: '2025-05-11', type: 'YÖKDİL' },
    { name: 'YDS/2 (Sonbahar)', date: '2025-09-14', type: 'YDS' },
    { name: 'YÖKDİL Sosyal/2', date: '2025-11-09', type: 'YÖKDİL' },
    { name: 'YÖKDİL Fen/2', date: '2025-11-09', type: 'YÖKDİL' },
    { name: 'YÖKDİL Sağlık/2', date: '2025-11-09', type: 'YÖKDİL' }
];

// Yaklaşan sınavları hesapla (bugünden sonraki 3 sınav)
function getUpcomingExams() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return upcomingExams
        .map(exam => {
            const examDate = new Date(exam.date);
            const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
            
            return {
                name: exam.name,
                date: examDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                daysLeft: daysLeft,
                type: exam.type,
                isPast: daysLeft < 0
            };
        })
        .filter(exam => !exam.isPast) // Geçmiş sınavları filtrele
        .slice(0, 3); // İlk 3 yaklaşan sınav
}

const statsData = {
    generalProgress: 68,
    wordsLearned: 1240,
    problemsSolved: 2512,
    totalStudyTime: 25,
    vocabulary: 85,
    grammar: 62,
    reading: 71,
    sentenceCompletion: 55,
    correctAnswers: 967,
    wrongAnswers: 135,
    skipped: 111,
    upcomingExams: getUpcomingExams(),
    recentActivities: [
        { name: 'Kelime Alıştırması #12', date: '18 Mart 2024', score: 18, total: 20, percentage: 90 },
        { name: 'Tam Deneme Sınavı 3', date: '17 Mart 2024', score: 62, total: 80, percentage: 77 },
        { name: 'Dil Bilgisi: Zamanlar', date: '15 Mart 2024', score: 12, total: 20, percentage: 60 }
    ],
    performanceByTopic: {
        vocabulary: 80,
        grammar: 92,
        reading: 65,
        clozeTest: 75
    }
};

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Render Functions
function renderLogin() {
    return `
        <div class="login-container">
            <div class="login-left">
                <div class="logo">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="white" opacity="0.2"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <span>KİTKİT</span>
                </div>
                <h1>Öğrenme Macerana<br>Başla</h1>
                <p>İngilizce Sınav Başarısı için Dijital Asistanın</p>
            </div>
            <div class="login-right">
                <div class="login-form">
                    <h2>Giriş Yap</h2>
                    <p class="subtitle">Hesabın yok mu? <a href="#" onclick="showRegisterPage(event)">Hemen Kaydol</a></p>
                    
                    <form onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label>Kullanıcı Adı</label>
                            <input type="text" id="username" placeholder="kullaniciadi" required pattern="[a-zA-Z0-9_]{3,20}" title="3-20 karakter, sadece harf, rakam ve alt çizgi">
                            <small style="color: #666; font-size: 12px;">Sadece harf, rakam ve alt çizgi kullanabilirsiniz</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Şifre</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="password" placeholder="Şifrenizi girin" required>
                                <button type="button" class="password-toggle" onclick="togglePassword()">
                                    👁️
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-options">
                            <label class="remember-me">
                                <input type="checkbox" id="remember">
                                <span>Beni Hatırla</span>
                            </label>
                            <a href="#" class="forgot-password">Şifremi Unuttum</a>
                        </div>
                        
                        <button type="submit" class="btn-primary">Giriş Yap</button>
                    </form>
                    
                    <div class="divider">veya</div>
                    
                    <div class="social-login">
                        <button class="btn-social" onclick="handleSocialLogin('google')">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <rect width="20" height="20" fill="black"/>
                            </svg>
                            Google ile Devam Et
                        </button>
                        <button class="btn-social" onclick="handleSocialLogin('apple')">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <rect width="20" height="20" fill="#A3A3A3"/>
                            </svg>
                            Apple ile Devam Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderRegister() {
    return `
        <div class="login-container">
            <div class="login-left">
                <div class="logo">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="white" opacity="0.2"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <span>KİTKİT</span>
                </div>
                <h1>Öğrenme Macerana<br>Başla</h1>
                <p>İngilizce Sınav Başarısı için Dijital Asistanın</p>
            </div>
            <div class="login-right">
                <div class="login-form">
                    <h2>Kayıt Ol</h2>
                    <p class="subtitle">Zaten hesabın var mı? <a href="#" onclick="showLoginPage(event)">Giriş Yap</a></p>
                    
                    <form onsubmit="handleRegisterSubmit(event)">
                        <div class="form-group">
                            <label>Adın ve Soyadın</label>
                            <input type="text" id="fullname" placeholder="Adınız Soyadınız" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Kullanıcı Adı</label>
                            <input type="text" id="reg-username" placeholder="kullaniciadi" required pattern="[a-zA-Z0-9_]{3,20}" title="3-20 karakter, sadece harf, rakam ve alt çizgi">
                            <small style="color: #666; font-size: 12px;">3-20 karakter, sadece harf, rakam ve alt çizgi</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Şifre</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="reg-password" placeholder="En az 8 karakter" required minlength="8">
                                <button type="button" class="password-toggle" onclick="togglePasswordField('reg-password')">
                                    👁️
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Şifre Tekrar</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="reg-password-confirm" placeholder="Şifrenizi tekrar girin" required minlength="8">
                                <button type="button" class="password-toggle" onclick="togglePasswordField('reg-password-confirm')">
                                    👁️
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-options">
                            <label class="remember-me">
                                <input type="checkbox" id="terms" required>
                                <span>Kullanım koşullarını kabul ediyorum</span>
                            </label>
                        </div>
                        
                        <button type="submit" class="btn-primary">Kayıt Ol</button>
                    </form>
                    
                    <div class="divider">veya</div>
                    
                    <div class="social-login">
                        <button class="btn-social" onclick="handleSocialLogin('google')">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <rect width="20" height="20" fill="black"/>
                            </svg>
                            Google ile Devam Et
                        </button>
                        <button class="btn-social" onclick="handleSocialLogin('apple')">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <rect width="20" height="20" fill="#A3A3A3"/>
                            </svg>
                            Apple ile Devam Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const userName = state.user ? state.user.name : 'Kullanıcı';
    return `
        <div class="dashboard">
            <nav class="navbar">
                <div class="logo">
                    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="#2196F3"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <span style="font-weight: bold; font-size: 20px; margin-left: 10px;">KİTKİT</span>
                </div>
                <ul class="nav-links">
                    <li><a href="#" class="active" onclick="changePage(event, 'dashboard')">Ana Sayfa</a></li>
                    <li><a href="#" onclick="changePage(event, 'practice')">Kelime Çalış</a></li>
                    <li><a href="#" onclick="changePage(event, 'quiz')">Soru Çöz</a></li>
                    <li><a href="#" onclick="changePage(event, 'tests')">Denemeler</a></li>
                </ul>
                <div class="user-profile" onclick="changePage(event, 'settings')" style="cursor: pointer;" title="Ayarlar">
                    👤
                </div>
            </nav>
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>Tekrar hoş geldin, ${userName}!</h1>
                    <p>Öğrenmeye devam etmeye hazır mısın?</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Genel İlerleme</h3>
                        <div class="value">${state.userStats.generalProgress}%</div>
                    </div>
                    <div class="stat-card">
                        <h3>Öğrenilen Kelime</h3>
                        <div class="value">${state.userStats.wordsLearned.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Çözülen Soru</h3>
                        <div class="value">${state.userStats.problemsSolved.toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="cards-grid">
                    <div class="card">
                        <h2>Öğrenmeye Devam Et</h2>
                        <div class="continue-learning">
                            <div class="lesson-icon">📚</div>
                            <div class="lesson-info">
                                <h3>Phrasal Verbs - Ünite 3</h3>
                                <p>En son 2 gün önce çalışıldı.</p>
                            </div>
                            <button class="btn-continue" onclick="startLesson()">Devam Et →</button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2>Günlük Hedef
                            <button onclick="editDailyGoal()" style="float: right; background: none; border: 1px solid #2196F3; color: #2196F3; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">✏️ Düzenle</button>
                        </h2>
                        <div class="daily-goal">
                            <div class="progress-circle">
                                <svg width="120" height="120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#E3F2FD" stroke-width="12"/>
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#2196F3" stroke-width="12"
                                        stroke-dasharray="339.292" stroke-dashoffset="${339.292 * (1 - state.userStats.dailyProgress/state.userStats.dailyGoal)}"
                                        stroke-linecap="round"/>
                                </svg>
                                <div class="progress-value">${state.userStats.dailyProgress}/${state.userStats.dailyGoal}</div>
                            </div>
                            <div style="margin-top: 20px;">
                                ${state.userStats.dailyProgress === 0 ? 
                                    '<strong>Haydi başla!</strong><p class="goal-message">Bugünkü hedefinize ulaşmak için soru çözmeye başlayın.</p>' :
                                    state.userStats.dailyProgress >= state.userStats.dailyGoal ?
                                    '<strong>🎉 Tebrikler!</strong><p class="goal-message">Günlük hedefinizi tamamladınız!</p>' :
                                    `<strong>Harika gidiyorsun!</strong><p class="goal-message">Hedefe ${state.userStats.dailyGoal - state.userStats.dailyProgress} soru kaldı.</p>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="cards-grid">
                    <div class="card progress-section">
                        <h2>İlerlemen</h2>
                        ${renderProgressBars()}
                    </div>
                    
                    <div class="card upcoming-exams">
                        <h2>Yaklaşan Sınavlar</h2>
                        ${statsData.upcomingExams.length > 0 ? statsData.upcomingExams.map(exam => `
                            <div class="exam-item ${exam.type === 'YDS' ? 'yds-exam' : 'yokdil-exam'}">
                                <div class="exam-header">
                                    <span class="exam-badge ${exam.type === 'YDS' ? 'badge-yds' : 'badge-yokdil'}">${exam.type}</span>
                                    <div class="exam-name">${exam.name}</div>
                                </div>
                                <div class="exam-date">📅 ${exam.date}</div>
                                <div class="days-left ${exam.daysLeft <= 30 ? 'urgent' : ''}">${exam.daysLeft > 0 ? `⏳ ${exam.daysLeft} gün kaldı` : '🎯 Bugün!'}</div>
                            </div>
                        `).join('') : '<p style="text-align: center; color: #999; padding: 20px;">Yaklaşan sınav bulunmuyor</p>'}
                    </div>
                </div>
                
                <div class="card tips-section">
                    <h2>Sana Özel Öneriler</h2>
                    ${getWeakTopics().length > 0 ? `
                        <div class="tip-item" style="background: #FFEBEE;">
                            <div class="tip-icon" style="background: #EF5350;">📉</div>
                            <div class="tip-content">
                                <h4>Zayıf Olduğun Konular</h4>
                                <p>${getWeakTopics().map(([topic, data]) => 
                                    `${topic} (%${data.percentage})`
                                ).join(', ')}</p>
                            </div>
                        </div>
                    ` : ''}
                    <div class="tip-item">
                        <div class="tip-icon">💡</div>
                        <div class="tip-content">
                            <h4>Bu Hafta Odaklan: Bağlaçlar</h4>
                            <p>Tense sorularında zorlanıyorsun. Bu konuyu çalışmanı öneriyor.</p>
                        </div>
                    </div>
                    <div class="tip-item">
                        <div class="tip-icon">📊</div>
                        <div class="tip-content">
                            <h4>En Çok Yanlış Yaptığın Kelimeler</h4>
                            <p>"Concede", "elaborate", "justify" kelimelerini tekrar et.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderProgressBars() {
    const topics = [
        { name: 'Kelime', value: state.userStats.vocabulary },
        { name: 'Gramer', value: state.userStats.grammar },
        { name: 'Okuma Parçaları', value: state.userStats.reading },
        { name: 'Cümle Tamamlama', value: state.userStats.sentenceCompletion }
    ];
    
    return topics.map(topic => `
        <div class="progress-item">
            <div class="progress-header">
                <span>${topic.name}</span>
                <span>${topic.value}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${topic.value}%"></div>
            </div>
        </div>
    `).join('');
}

function renderQuiz() {
    // Quiz başladıysa soru ekranını göster
    if (state.quizStarted) {
        return renderQuizQuestions();
    }
    
    // Test seçim ekranı
    return `
        <div class="dashboard">
            <nav class="navbar">
                <div class="logo">
                    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="#2196F3"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <span style="font-weight: bold; font-size: 20px; margin-left: 10px;">KİTKİT</span>
                </div>
                <ul class="nav-links">
                    <li><a href="#" onclick="changePage(event, 'dashboard')">Ana Sayfa</a></li>
                    <li><a href="#" onclick="changePage(event, 'practice')">Kelime Çalış</a></li>
                    <li><a href="#" class="active">Testler</a></li>
                    <li><a href="#" onclick="changePage(event, 'stats')">İstatistikler</a></li>
                </ul>
                <div class="user-profile" onclick="changePage(event, 'settings')" style="cursor: pointer;">👤</div>
            </nav>
            
            <div class="test-selection-container">
                <div class="test-selection-header">
                    <h1>Testler</h1>
                    <p>Hemen test çözmeye başla! Zorluk seviyene veya konuya göre seçim yap.</p>
                </div>
                
                <div class="test-tabs">
                    <button class="test-tab ${state.testSelectionTab === 'level' ? 'active' : ''}" onclick="changeTestTab('level')">
                        🎯 Zorluk Düzeyine Göre
                    </button>
                    <button class="test-tab ${state.testSelectionTab === 'topic' ? 'active' : ''}" onclick="changeTestTab('topic')">
                        📚 Konuya Göre
                    </button>
                </div>
                
                ${state.testSelectionTab === 'level' ? `
                    <div class="test-content">
                        ${!state.selectedLevel ? `
                            <h2>Zorluk Seviyeni Seç</h2>
                            <p class="test-description">Her seviyede 5 farklı test var. Her test 10 sorudan oluşuyor.</p>
                            
                            <div class="test-cards-grid">
                                ${['A2', 'B1', 'B2', 'C1'].map(level => `
                                    <div class="test-card" onclick="showLevelTests('${level}')">
                                        <div class="test-card-icon level-${level.toLowerCase()}">${level}</div>
                                        <h3>${level}</h3>
                                        <p>${level === 'A2' ? 'Temel Seviye' : level === 'B1' ? 'Orta Seviye' : level === 'B2' ? 'İleri Orta' : 'İleri Seviye'}</p>
                                        <div class="test-card-stats">
                                            <span>📊 5 test</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="test-sub-header">
                                <button class="btn-back" onclick="backToLevelSelection()">← Geri</button>
                                <h2>${state.selectedLevel} - Test Seç</h2>
                            </div>
                            <p class="test-description">Her test 10 sorudan oluşuyor.</p>
                            
                            <div class="test-cards-grid">
                                ${[1, 2, 3, 4, 5].map(testNum => {
                                    const testId = `${state.selectedLevel}-${testNum}`;
                                    const isCompleted = state.completedTests.some(t => t.type === 'level' && t.id === testId);
                                    return `
                                    <div class="test-card ${isCompleted ? 'completed' : ''}" onclick="selectLevelTest('${state.selectedLevel}', ${testNum})">
                                        ${isCompleted ? '<div class="test-completed-badge">✓</div>' : ''}
                                        <div class="test-card-icon level-${state.selectedLevel.toLowerCase()}">${testNum}</div>
                                        <h3>Test ${testNum}</h3>
                                        <p>${state.selectedLevel === 'A2' ? 'Temel Seviye' : state.selectedLevel === 'B1' ? 'Orta Seviye' : state.selectedLevel === 'B2' ? 'İleri Orta' : 'İleri Seviye'}</p>
                                        <div class="test-card-stats">
                                            <span>📊 10 soru</span>
                                        </div>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                ` : `
                    <div class="test-content">
                        ${!state.selectedTopic ? `
                            <h2>Konu Seç</h2>
                            <p class="test-description">Her konuda 5 farklı test var. Her test 10 sorudan oluşuyor.</p>
                            
                            <div class="test-cards-grid">
                                ${availableTopics.map(topic => `
                                    <div class="test-card" onclick="showTopicTests('${topic.id}')">
                                        <div class="test-card-icon topic-icon">${topic.icon}</div>
                                        <h3>${topic.name}</h3>
                                        <p>${topic.description}</p>
                                        <div class="test-card-stats">
                                            <span>📊 5 test</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="test-sub-header">
                                <button class="btn-back" onclick="backToTopicSelection()">← Geri</button>
                                <h2>${availableTopics.find(t => t.id === state.selectedTopic)?.name} - Test Seç</h2>
                            </div>
                            <p class="test-description">Her test 10 sorudan oluşuyor.</p>
                            
                            <div class="test-cards-grid">
                                ${[1, 2, 3, 4, 5].map(testNum => {
                                    const testId = `${state.selectedTopic}-${testNum}`;
                                    const isCompleted = state.completedTests.some(t => t.type === 'topic' && t.id === testId);
                                    return `
                                    <div class="test-card ${isCompleted ? 'completed' : ''}" onclick="selectTopicTest('${state.selectedTopic}', ${testNum})">
                                        ${isCompleted ? '<div class="test-completed-badge">✓</div>' : ''}
                                        <div class="test-card-icon topic-icon">${availableTopics.find(t => t.id === state.selectedTopic)?.icon}</div>
                                        <h3>Test ${testNum}</h3>
                                        <p>${availableTopics.find(t => t.id === state.selectedTopic)?.description}</p>
                                        <div class="test-card-stats">
                                            <span>📊 10 soru</span>
                                        </div>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderQuizQuestions() {
    const question = state.currentTestQuestions[state.currentQuestion];
    
    return `
        <div class="dashboard">
            <nav class="navbar">
                <div class="logo">
                    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="#2196F3"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <span style="font-weight: bold; font-size: 20px; margin-left: 10px;">KİTKİT</span>
                </div>
                <ul class="nav-links">
                    <li><a href="#" onclick="changePage(event, 'dashboard')">Ana Sayfa</a></li>
                    <li><a href="#" onclick="changePage(event, 'practice')">Alıştırma</a></li>
                    <li><a href="#" class="active">Testler</a></li>
                    <li><a href="#" onclick="changePage(event, 'stats')">İstatistikler</a></li>
                </ul>
                <div class="user-profile" onclick="changePage(event, 'settings')" style="cursor: pointer;">👤</div>
            </nav>
            
            <div class="quiz-container">
                <div class="quiz-header">
                    <div class="quiz-title">${state.testType === 'level' ? state.selectedLevel + ' Seviye Testi' : state.selectedTopic + ' Testi'}</div>
                    <div class="quiz-info">
                        <div class="quiz-progress">Soru ${state.currentQuestion + 1}/${state.currentTestQuestions.length}</div>
                        <div class="quiz-timer">⏱️ Kalan Süre: ${formatTime(state.timer)}</div>
                        <button class="btn-finish" onclick="finishQuiz()">Testi Bitir</button>
                    </div>
                </div>
                
                <div class="quiz-body">
                    <div class="question-section">
                        <div class="question-meta">
                            <span class="level-badge level-${question.level.toLowerCase()}">${question.level}</span>
                            <span class="topic-badge">📚 ${question.topic}</span>
                        </div>
                        
                        ${question.passage ? `
                            <div class="question-text">
                                ${question.passage}
                            </div>
                        ` : ''}
                        
                        <div class="question-main">
                            ${question.question}
                        </div>
                        
                        <div class="options">
                            ${question.options.map((option, index) => `
                                <div class="option ${state.selectedAnswer === index ? 'selected' : ''}" 
                                     onclick="selectAnswer(${index})">
                                    <div class="option-label">${String.fromCharCode(65 + index)}</div>
                                    <div>${option}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="quiz-actions">
                            <button class="btn-hint">💡 İpucu Göster</button>
                            <button class="btn-answer" onclick="checkAnswer()">Cevapla</button>
                        </div>
                    </div>
                    
                    <div class="solution-panel">
                        <div class="solution-header">
                            <div class="solution-icon">📝</div>
                            <h3>Çözüm Alanı</h3>
                            <p>Cevabını seçtikten sonra çözüm burada görünecek.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function changeTestTab(tab) {
    state.testSelectionTab = tab;
    state.selectedLevel = null;
    state.selectedTopic = null;
    render();
}

function showLevelTests(level) {
    state.selectedLevel = level;
    render();
}

function showTopicTests(topicId) {
    state.selectedTopic = topicId;
    render();
}

function backToLevelSelection() {
    state.selectedLevel = null;
    render();
}

function backToTopicSelection() {
    state.selectedTopic = null;
    render();
}

function getQuestionCountByLevel(level) {
    return allQuestions.filter(q => q.level === level).length;
}

function getQuestionCountByTopic(topicId) {
    const topicMap = {
        'grammar': ['Grammar', 'Grammar - Tenses', 'Grammar - Conditionals'],
        'vocabulary': ['Vocabulary', 'Vocabulary - Adverbs'],
        'reading': ['Reading Comprehension'],
        'phrasal-verbs': ['Phrasal Verbs'],
        'prepositions': ['Prepositions']
    };
    
    const topics = topicMap[topicId] || [];
    return allQuestions.filter(q => topics.includes(q.topic)).length;
}

function selectLevelTest(level, testNumber = 1) {
    state.testType = 'level';
    state.selectedLevel = level;
    state.currentTestNumber = testNumber;
    
    // Seçilen seviyedeki soruları filtrele
    const levelQuestions = allQuestions.filter(q => q.level === level);
    
    if (levelQuestions.length < 10) {
        alert(`Bu seviyede yeterli soru bulunmuyor. Mevcut: ${levelQuestions.length} soru`);
        return;
    }
    
    // Karıştır ve test numarasına göre 10'ar soruluk gruplara ayır
    const shuffled = shuffleArray([...levelQuestions]);
    const startIdx = (testNumber - 1) * 10;
    const endIdx = startIdx + 10;
    
    state.currentTestQuestions = shuffled.slice(startIdx, endIdx);
    
    // Eğer yeterli soru yoksa baştan al
    if (state.currentTestQuestions.length < 10) {
        state.currentTestQuestions = shuffleArray([...levelQuestions]).slice(0, 10);
    }
    
    showTestPreview(`${level} - Test ${testNumber}`, 'level');
}

function selectTopicTest(topicId, testNumber = 1) {
    state.testType = 'topic';
    state.selectedTopic = topicId;
    state.currentTestNumber = testNumber;
    
    const topicMap = {
        'grammar': ['Grammar', 'Grammar - Tenses', 'Grammar - Conditionals'],
        'vocabulary': ['Vocabulary', 'Vocabulary - Adverbs'],
        'reading': ['Reading Comprehension'],
        'phrasal-verbs': ['Phrasal Verbs'],
        'prepositions': ['Prepositions']
    };
    
    const topics = topicMap[topicId] || [];
    const topicQuestions = allQuestions.filter(q => topics.includes(q.topic));
    
    if (topicQuestions.length < 10) {
        alert(`Bu konuda yeterli soru bulunmuyor. Mevcut: ${topicQuestions.length} soru`);
        return;
    }
    
    // Karıştır ve test numarasına göre 10'ar soruluk gruplara ayır
    const shuffled = shuffleArray([...topicQuestions]);
    const startIdx = (testNumber - 1) * 10;
    const endIdx = startIdx + 10;
    
    state.currentTestQuestions = shuffled.slice(startIdx, endIdx);
    
    // Eğer yeterli soru yoksa baştan al
    if (state.currentTestQuestions.length < 10) {
        state.currentTestQuestions = shuffleArray([...topicQuestions]).slice(0, 10);
    }
    
    const topic = availableTopics.find(t => t.id === topicId);
    showTestPreview(`${topic.name} - Test ${testNumber}`, 'topic');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showTestPreview(selection, type) {
    const typeName = type === 'level' ? 'Zorluk Seviyesi' : 'Konu';
    const confirmed = confirm(
        `${typeName}: ${selection}\n` +
        `Soru Sayısı: 10\n` +
        `Süre: 20 dakika\n\n` +
        `Teste başlamak istiyor musun?`
    );
    
    if (confirmed) {
        startQuiz();
    }
}

function selectAnswer(index) {
    state.selectedAnswer = index;
    render();
}

function startQuiz() {
    if (state.currentTestQuestions.length === 0) {
        alert('Lütfen önce bir test seçin!');
        return;
    }
    
    state.quizStarted = true;
    state.currentQuestion = 0;
    state.selectedAnswer = null;
    state.score = 0;
    state.timer = 1200; // 20 dakika
    render();
    startTimer();
}

function renderStats() {
    return `
        <div class="dashboard">
            <nav class="navbar">
                <div class="logo">
                    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="8" fill="#2196F3"/>
                        <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                    </svg>
                    <span style="font-weight: bold; font-size: 20px; margin-left: 10px;">KİTKİT</span>
                </div>
                <ul class="nav-links">
                    <li><a href="#" onclick="changePage(event, 'dashboard')">Ana Sayfa</a></li>
                    <li><a href="#" onclick="changePage(event, 'practice')">Alıştırma</a></li>
                    <li><a href="#" onclick="changePage(event, 'quiz')">Soru Çöz</a></li>
                    <li><a href="#" class="active">İstatistikler</a></li>
                </ul>
                <div class="user-profile">👤</div>
            </nav>
            
            <div class="stats-container">
                <h1 style="margin: 20px 0;">İstatistiklerim</h1>
                
                <div class="stats-tabs">
                    <div class="tab active">Son 7 Gün</div>
                    <div class="tab">Son 30 Gün</div>
                    <div class="tab">Tüm Zamanlar</div>
                </div>
                
                <div class="stats-main-grid">
                    <div class="stat-card">
                        <h3>Genel Başarı Oranı</h3>
                        <div class="value">78%</div>
                    </div>
                    <div class="stat-card">
                        <h3>Toplam Çözülen Soru</h3>
                        <div class="value">1,240</div>
                    </div>
                    <div class="stat-card">
                        <h3>Toplam Çalışma Süresi</h3>
                        <div class="value">25 Saat</div>
                    </div>
                </div>
                
                <div class="performance-grid">
                    <div class="card">
                        <h2>Doğru / Yanlış Dağılımı</h2>
                        <div class="donut-chart">
                            <div class="chart-container">
                                <svg width="200" height="200">
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#4DD0E1" stroke-width="40"
                                        stroke-dasharray="${2 * Math.PI * 80 * 0.78} ${2 * Math.PI * 80 * 0.22}"/>
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#FFB74D" stroke-width="40"
                                        stroke-dasharray="${2 * Math.PI * 80 * 0.12} ${2 * Math.PI * 80 * 0.88}"
                                        stroke-dashoffset="${-2 * Math.PI * 80 * 0.78}"/>
                                </svg>
                                <div class="chart-center">
                                    <div class="value">967</div>
                                    <div class="label">Doğru</div>
                                </div>
                            </div>
                            <div class="chart-legend">
                                <div class="legend-item">
                                    <div class="legend-color" style="background: #4DD0E1;"></div>
                                    <span>Doğru 78%</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color" style="background: #FFB74D;"></div>
                                    <span>Yanlış 12%</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color" style="background: #E0E0E0;"></div>
                                    <span>Boş 10%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2>Konulara Göre Performans</h2>
                        <div class="performance-bars">
                            ${Object.entries(statsData.performanceByTopic).map(([key, value]) => {
                                const names = {
                                    vocabulary: 'Kelime Bilgisi',
                                    grammar: 'Dil Bilgisi',
                                    reading: 'Okuduğunu Anlama',
                                    clozeTest: 'Cloze Test'
                                };
                                return `
                                    <div class="progress-item">
                                        <div class="progress-header">
                                            <span>${names[key]}</span>
                                            <span>${value}%</span>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${value}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="chart-section">
                    <div class="chart-header">
                        <h2>Zaman İçindeki Gelişim</h2>
                        <div class="growth-indicator">Genel Ortalama +12%</div>
                    </div>
                    <div class="line-chart">
                        <svg width="100%" height="200" style="background: #F9FAFB; border-radius: 8px;">
                            <polyline points="50,150 120,120 190,140 260,100 330,110 400,80 470,60 540,90 610,50 680,70"
                                fill="none" stroke="#2196F3" stroke-width="3"/>
                            <circle cx="50" cy="150" r="4" fill="#2196F3"/>
                            <circle cx="120" cy="120" r="4" fill="#2196F3"/>
                            <circle cx="190" cy="140" r="4" fill="#2196F3"/>
                            <circle cx="260" cy="100" r="4" fill="#2196F3"/>
                            <circle cx="330" cy="110" r="4" fill="#2196F3"/>
                            <circle cx="400" cy="80" r="4" fill="#2196F3"/>
                            <circle cx="470" cy="60" r="4" fill="#2196F3"/>
                            <circle cx="540" cy="90" r="4" fill="#2196F3"/>
                            <circle cx="610" cy="50" r="4" fill="#2196F3"/>
                            <circle cx="680" cy="70" r="4" fill="#2196F3"/>
                        </svg>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Son Aktiviteler</h2>
                    <table class="activities-table">
                        <thead>
                            <tr>
                                <th>TARİH</th>
                                <th>TEST ADI</th>
                                <th>SKOR</th>
                                <th>BAŞARI ORANI</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${statsData.recentActivities.map(activity => `
                                <tr>
                                    <td>
                                        <div class="activity-date">${activity.date}</div>
                                    </td>
                                    <td>
                                        <div class="activity-name">${activity.name}</div>
                                    </td>
                                    <td>${activity.score}/${activity.total}</td>
                                    <td>
                                        <span class="score-badge ${activity.percentage >= 80 ? 'high' : activity.percentage >= 60 ? 'medium' : 'low'}">
                                            ${activity.percentage}%
                                        </span>
                                    </td>
                                    <td>...</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Event Handlers
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Firebase ile giriş yap
        await firebaseLogin(username, password);
        
        // Kullanıcı verilerini yükle
        await loadUserData();
        
        state.currentPage = 'dashboard';
        render();
    } catch (error) {
        let errorMessage = 'Giriş başarısız!';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Bu kullanıcı adı ile kayıtlı kullanıcı bulunamadı!';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Şifre yanlış!';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Geçersiz kullanıcı adı!';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
        }
        
        alert(errorMessage);
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    // Şifre kontrolü
    if (password !== confirmPassword) {
        alert('Şifreler eşleşmiyor! Lütfen aynı şifreyi girin.');
        return;
    }
    
    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır!');
        return;
    }
    
    if (!termsAccepted) {
        alert('Kullanım koşullarını kabul etmelisiniz!');
        return;
    }
    
    // Kullanıcı adı format kontrolü
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        alert('Kullanıcı adı 3-20 karakter olmalı ve sadece harf, rakam ve alt çizgi içerebilir!');
        return;
    }
    
    try {
        // Firebase ile kayıt ol
        await firebaseRegister(username, password, fullname);
        
        // Kullanıcı verilerini yükle
        await loadUserData();
        
        const firstName = fullname.split(' ')[0];
        state.currentPage = 'dashboard';
        alert(`Hoş geldin ${firstName}! Hesabın başarıyla oluşturuldu. 🎉`);
        render();
    } catch (error) {
        let errorMessage = 'Kayıt başarısız!';
        
        if (error.message === 'USERNAME_TAKEN') {
            errorMessage = 'Bu kullanıcı adı zaten alınmış! Lütfen başka bir kullanıcı adı deneyin.';
        } else if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Bu kullanıcı adı zaten kayıtlı! Lütfen giriş yapın.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Geçersiz kullanıcı adı!';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Şifre çok zayıf! En az 6 karakter kullanın.';
        }
        
        alert(errorMessage);
    }
}

function showRegisterPage(event) {
    event.preventDefault();
    state.currentPage = 'register';
    render();
}

function showLoginPage(event) {
    event.preventDefault();
    state.currentPage = 'login';
    render();
}

function handleRegister(event) {
    event.preventDefault();
    showRegisterPage(event);
}

function handleSocialLogin(provider) {
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} ile giriş yakında eklenecek!`);
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
}

function togglePasswordField(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
}

function changePage(event, page) {
    event.preventDefault();
    state.currentPage = page;
    render();
}

function selectAnswer(index) {
    state.selectedAnswer = index;
    render();
}

function startQuiz() {
    state.quizStarted = true;
    state.currentQuestion = 0;
    state.selectedAnswer = null;
    state.score = 0;
    state.timer = 1200; // 20 dakika
    render();
    startTimer();
}

function checkAnswer() {
    if (state.selectedAnswer === null) {
        alert('Lütfen bir cevap seçin!');
        return;
    }
    
    const question = state.currentTestQuestions[state.currentQuestion];
    const isCorrect = state.selectedAnswer === question.correctAnswer;
    
    // İstatistikleri güncelle
    updateTopicPerformance(question.topic, isCorrect);
    
    if (isCorrect) {
        state.score++;
        alert('🎉 Doğru cevap!');
    } else {
        alert(`❌ Yanlış cevap! Doğru cevap: ${String.fromCharCode(65 + question.correctAnswer)}\n\nAçıklama: ${question.explanation}`);
    }
    
    // Günlük ilerlemeyi güncelle
    state.userStats.dailyProgress++;
    state.userStats.problemsSolved++;
    
    // Next question or finish
    if (state.currentQuestion < state.currentTestQuestions.length - 1) {
        state.currentQuestion++;
        state.selectedAnswer = null;
        render();
    } else {
        finishQuiz();
    }
}

function updateTopicPerformance(topic, isCorrect) {
    if (!state.topicPerformance[topic]) {
        state.topicPerformance[topic] = {
            correct: 0,
            total: 0,
            percentage: 0
        };
    }
    
    state.topicPerformance[topic].total++;
    if (isCorrect) {
        state.topicPerformance[topic].correct++;
    }
    state.topicPerformance[topic].percentage = Math.round(
        (state.topicPerformance[topic].correct / state.topicPerformance[topic].total) * 100
    );
    
    // LocalStorage'a kaydet
    if (state.user) {
        const userEmail = state.user.email;
        const perfKey = `kitkit_performance_${userEmail}`;
        localStorage.setItem(perfKey, JSON.stringify(state.topicPerformance));
    }
}

function getWeakTopics() {
    const topics = Object.entries(state.topicPerformance)
        .filter(([_, data]) => data.total >= 2) // En az 2 soru çözülmüş
        .sort((a, b) => a[1].percentage - b[1].percentage)
        .slice(0, 3); // En zayıf 3 konu
    
    return topics;
}

function startLesson() {
    alert('Ders modülü yakında eklenecek!');
}

function editDailyGoal() {
    const newGoal = prompt(`Günlük hedefini belirle (şu an: ${state.userStats.dailyGoal} soru):`, state.userStats.dailyGoal);
    if (newGoal && !isNaN(newGoal) && newGoal > 0) {
        state.userStats.dailyGoal = parseInt(newGoal);
        render();
    } else if (newGoal !== null) {
        alert('Lütfen geçerli bir sayı girin!');
    }
}

function finishQuiz() {
    const successRate = Math.round((state.score / state.currentTestQuestions.length) * 100);
    
    // Tamamlanan testi kaydet
    if (state.testType && state.currentTestNumber) {
        const testId = state.testType === 'level' 
            ? `${state.selectedLevel}-${state.currentTestNumber}`
            : `${state.selectedTopic}-${state.currentTestNumber}`;
        
        if (!state.completedTests.some(t => t.type === state.testType && t.id === testId)) {
            state.completedTests.push({
                type: state.testType,
                id: testId,
                score: state.score,
                total: state.currentTestQuestions.length,
                percentage: successRate,
                date: new Date().toISOString()
            });
        }
    }
    
    // Quiz sonuçlarını kaydet
    const quizResult = {
        date: new Date().toISOString(),
        score: state.score,
        total: state.currentTestQuestions.length,
        percentage: successRate,
        topics: {...state.topicPerformance}
    };
    
    state.quizHistory.push(quizResult);
    
    // Firebase'e kaydet
    saveUserData();
    
    // Genel istatistikleri güncelle
    if (Object.keys(state.topicPerformance).length > 0) {
        state.userStats.generalProgress = Math.round(
            Object.values(state.topicPerformance).reduce((sum, t) => sum + t.percentage, 0) / 
            Object.keys(state.topicPerformance).length
        );
    }
    
    alert(`Test tamamlandı!\n\nDoğru: ${state.score}\nToplam: ${state.currentTestQuestions.length}\nBaşarı Oranı: ${successRate}%`);
    
    state.currentPage = 'dashboard';
    state.currentQuestion = 0;
    state.selectedAnswer = null;
    state.score = 0;
    state.quizStarted = false;
    state.quizActive = false;
    state.currentTestQuestions = [];
    state.testType = null;
    state.selectedLevel = null;
    state.selectedTopic = null;
    state.currentTestNumber = null;
    render();
}

function renderSettings() {
    const userName = state.user ? state.user.name : 'Kullanıcı';
    const userEmail = state.user ? state.user.email : '';
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return `
        <div class="settings-container">
            <div class="settings-sidebar">
                <div class="settings-logo" onclick="changePage(event, 'dashboard')" style="cursor: pointer;">
                    <div class="logo" style="margin-bottom: 10px;">
                        <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="8" fill="#2196F3"/>
                            <path d="M12 10h8v4h-8v-4zm0 8h8v4h-8v-4zm12-8h4v20h-4v-20z" fill="white"/>
                        </svg>
                    </div>
                    <h3>Ayarlar</h3>
                    <p>KİTKİT Öğrenme Asistanı</p>
                </div>
                <div class="settings-menu">
                    <div class="settings-menu-item" onclick="changePage(event, 'dashboard')" style="background: #F5F9FF; color: #2196F3; margin-bottom: 20px;">
                        🏠 Ana Sayfa
                    </div>
                    <div class="settings-menu-item ${state.settingsActiveTab === 'profile' ? 'active' : ''}" onclick="changeSettingsTab('profile')">
                        👤 Profil
                    </div>
                    <div class="settings-menu-item ${state.settingsActiveTab === 'notifications' ? 'active' : ''}" onclick="changeSettingsTab('notifications')">
                        🔔 Bildirimler
                    </div>
                    <div class="settings-menu-item ${state.settingsActiveTab === 'language' ? 'active' : ''}" onclick="changeSettingsTab('language')">
                        🌐 Dil
                    </div>
                </div>
                <div class="settings-logout" onclick="handleLogout()">
                    ⬅️ Çıkış Yap
                </div>
            </div>
            
            <div class="settings-content">
                ${state.settingsActiveTab === 'profile' ? `
                    <div class="settings-section">
                        <h2>Profil</h2>
                        <p class="settings-subtitle">Profil bilgilerinizi buradan düzenleyin.</p>
                        
                        <div class="profile-card">
                            <div class="profile-header">
                                <div class="profile-avatar">
                                    <div class="avatar-circle">
                                        ${userName.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div class="profile-info">
                                    <h3>${userName}</h3>
                                    <p>${userEmail}</p>
                                </div>
                                <button class="btn-secondary" onclick="changeProfilePicture()">Resmi Değiştir</button>
                            </div>
                            
                            <form onsubmit="saveProfileSettings(event)" class="settings-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Ad</label>
                                        <input type="text" id="profile-firstname" value="${firstName}" placeholder="Ad">
                                    </div>
                                    <div class="form-group">
                                        <label>Soyad</label>
                                        <input type="text" id="profile-lastname" value="${lastName}" placeholder="Soyad">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>E-posta</label>
                                    <input type="email" id="profile-email" value="${userEmail}" placeholder="kullanici@email.com">
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" class="btn-secondary" onclick="changePassword()">Şifre Değiştir</button>
                                    <button type="submit" class="btn-primary">Değişiklikleri Kaydet</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ` : state.settingsActiveTab === 'notifications' ? `
                    <div class="settings-section">
                        <h2>Bildirimler</h2>
                        <p class="settings-subtitle">Bildirim tercihlerinizi yönetin.</p>
                        
                        <div class="settings-card">
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <h4>E-posta Bildirimleri</h4>
                                    <p>Haftalık ilerleme raporlarınızı e-posta ile alın.</p>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" ${state.settings.emailNotifications ? 'checked' : ''} onchange="toggleEmailNotifications()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <h4>Anlık Bildirimler</h4>
                                    <p>Günlük hatırlatmalar ve yeni özellikleri anında öğrenin.</p>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" ${state.settings.pushNotifications ? 'checked' : ''} onchange="togglePushNotifications()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="settings-section">
                        <h2>Dil Seçenekleri</h2>
                        <p class="settings-subtitle">Uygulama arayüz dilini değiştirin.</p>
                        
                        <div class="settings-card">
                            <div class="settings-item">
                                <div class="settings-item-info">
                                    <h4>🌐 Arayüz Dili</h4>
                                </div>
                                <select class="language-select" onchange="changeLanguage(this.value)">
                                    <option value="Türkçe" ${state.settings.language === 'Türkçe' ? 'selected' : ''}>Türkçe</option>
                                    <option value="English" ${state.settings.language === 'English' ? 'selected' : ''}>English</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}

function changeSettingsTab(tab) {
    state.settingsActiveTab = tab;
    render();
}

function saveProfileSettings(event) {
    event.preventDefault();
    const firstName = document.getElementById('profile-firstname').value;
    const lastName = document.getElementById('profile-lastname').value;
    const email = document.getElementById('profile-email').value;
    
    state.user.name = firstName + (lastName ? ' ' + lastName : '');
    state.user.email = email;
    
    alert('Profil bilgileriniz başarıyla güncellendi! ✅');
    render();
}

function changeProfilePicture() {
    alert('Profil resmi değiştirme özelliği yakında eklenecek!');
}

function changePassword() {
    const newPassword = prompt('Yeni şifrenizi girin:');
    if (newPassword && newPassword.length >= 8) {
        alert('Şifreniz başarıyla değiştirildi! ✅');
    } else if (newPassword !== null) {
        alert('Şifre en az 8 karakter olmalıdır!');
    }
}

function toggleEmailNotifications() {
    state.settings.emailNotifications = !state.settings.emailNotifications;
}

function togglePushNotifications() {
    state.settings.pushNotifications = !state.settings.pushNotifications;
}

function changeLanguage(lang) {
    state.settings.language = lang;
    alert(`Dil ${lang} olarak değiştirildi. Uygulama yeniden başlatılıyor...`);
}

async function handleLogout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        try {
            await firebaseLogout();
            state.user = null;
            state.completedTests = [];
            state.quizHistory = [];
            state.topicPerformance = {};
            clearLocalStorage();
            state.currentPage = 'login';
            render();
        } catch (error) {
            console.error('Logout error:', error);
            alert('Çıkış yaparken bir hata oluştu!');
        }
    }
}

// Main Render
function render() {
    const app = document.getElementById('app');
    
    switch(state.currentPage) {
        case 'login':
            app.innerHTML = renderLogin();
            break;
        case 'register':
            app.innerHTML = renderRegister();
            break;
        case 'dashboard':
            app.innerHTML = renderDashboard();
            break;
        case 'quiz':
            app.innerHTML = renderQuiz();
            break;
        case 'stats':
            app.innerHTML = renderStats();
            break;
        case 'settings':
            app.innerHTML = renderSettings();
            break;
        default:
            app.innerHTML = renderDashboard();
    }
}

function startTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    
    state.timerInterval = setInterval(() => {
        if (state.quizStarted && state.timer > 0) {
            state.timer--;
            const timerElement = document.querySelector('.quiz-timer');
            if (timerElement) {
                timerElement.innerHTML = `⏱️ Kalan Süre: ${formatTime(state.timer)}`;
            }
            
            if (state.timer === 0) {
                clearInterval(state.timerInterval);
                alert('Süre doldu! Test otomatik olarak sonlandırılıyor.');
                finishQuiz();
            }
        }
    }, 1000);
}

// Initialize app
async function initApp() {
    try {
        // Firebase hazır olmasını bekle
        await waitForFirebase();
        
        // Soruları yükle
        await loadQuestions();
        
        // Firebase auth state listener
        const { onAuthStateChanged } = window.firebaseModules;
        onAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                // Kullanıcı giriş yapmış
                await loadUserData();
                if (state.currentPage === 'login' || state.currentPage === 'register') {
                    state.currentPage = 'dashboard';
                }
            } else {
                // Kullanıcı çıkış yapmış
                if (state.currentPage !== 'login' && state.currentPage !== 'register') {
                    state.currentPage = 'login';
                }
            }
            render();
        });
        
    } catch (error) {
        console.error('App initialization error:', error);
        render();
    }
}

initApp();
