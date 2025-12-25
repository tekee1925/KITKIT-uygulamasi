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
    showImmediateFeedback: false, // Anında doğru/yanlış göster
    userAnswers: [], // Her soru için verilen cevaplar
    quizCompleted: false, // Test tamamlandı mı
    showQuestionDetails: false, // Soru detaylarını göster
    userStats: {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageScore: 0,
        quizHistory: [], // { date, score, total, percentage, duration }
        dailyGoal: 50,
        dailyProgress: 0,
        lastProgressDate: null,
        dailyStreak: 0,
        lastLoginDate: null,
        todoList: [], // { id, text, completed }
        completedTests: [], // { type, level, testNumber, topic, examNumber }
        wrongQuestions: [] // Yanlış yapılan sorular { question, options, correctAnswer, explanation, userAnswer, date, level, topic }
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

async function checkAndUpdateStreak(uid) {
    try {
        const { doc, updateDoc } = window.firebaseModules;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastLogin = state.userStats.lastLoginDate ? new Date(state.userStats.lastLoginDate) : null;
        if (lastLogin) {
            lastLogin.setHours(0, 0, 0, 0);
        }
        
        const daysDiff = lastLogin ? Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24)) : -1;
        
        let newStreak = state.userStats.dailyStreak || 0;
        
        if (daysDiff === 0) {
            // Bugün zaten giriş yapılmış
            return;
        } else if (daysDiff === 1) {
            // Dün giriş yapılmış, streak devam ediyor
            newStreak++;
        } else {
            // Streak kopmuş, yeniden başla
            newStreak = 1;
        }
        
        state.userStats.dailyStreak = newStreak;
        state.userStats.lastLoginDate = today.toISOString();
        
        await updateDoc(doc(window.firebaseDb, 'users', uid), {
            'stats.dailyStreak': newStreak,
            'stats.lastLoginDate': today.toISOString()
        });
    } catch (error) {
        console.error('Streak update error:', error);
    }
}

async function loadUserData(uid) {
    try {
        const { doc, getDoc, updateDoc } = window.firebaseModules;
        const userDoc = await getDoc(doc(window.firebaseDb, 'users', uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            state.user = {
                uid: uid,
                username: userData.username,
                name: userData.name,
                createdAt: userData.createdAt
            };
            state.userStats = userData.stats || {
                totalQuizzes: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                averageScore: 0,
                quizHistory: [],
                dailyGoal: 50,
                dailyProgress: 0,
                lastProgressDate: null
            };
            
            // Günlük hedef verilerini al veya default değerleri kullan
            if (!state.userStats.dailyGoal) state.userStats.dailyGoal = 50;
            if (!state.userStats.dailyProgress) state.userStats.dailyProgress = 0;
            if (!state.userStats.dailyStreak) state.userStats.dailyStreak = 0;
            if (!state.userStats.todoList) state.userStats.todoList = [];
            if (!state.userStats.completedTests) state.userStats.completedTests = [];
            
            // Yeni gün kontrolü - eğer son güncelleme bugün değilse progress'i sıfırla
            const today = new Date().toDateString();
            const lastDate = state.userStats.lastProgressDate ? new Date(state.userStats.lastProgressDate).toDateString() : null;
            
            if (lastDate !== today) {
                state.userStats.dailyProgress = 0;
                state.userStats.lastProgressDate = new Date().toISOString();
                await updateDoc(doc(window.firebaseDb, 'users', uid), {
                    'stats.dailyProgress': 0,
                    'stats.lastProgressDate': state.userStats.lastProgressDate
                });
            }
            
            // Streak kontrolü
            await checkAndUpdateStreak(uid);
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
            duration: duration,
            level: state.selectedLevel,
            topic: state.selectedTopic
        };
        
        // Yanlış yapılan soruları topla
        const wrongQuestions = [];
        state.currentTestQuestions.forEach((question, index) => {
            const userAnswer = state.userAnswers[index];
            if (userAnswer !== null && userAnswer !== question.correctAnswer) {
                wrongQuestions.push({
                    passage: question.passage || '',
                    question: question.question,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    userAnswer: userAnswer,
                    date: new Date().toISOString(),
                    level: question.level,
                    topic: question.topic
                });
            }
        });
        
        // İstatistikleri güncelle
        const newTotalQuizzes = state.userStats.totalQuizzes + 1;
        const newTotalQuestions = state.userStats.totalQuestions + total;
        const newCorrectAnswers = state.userStats.correctAnswers + score;
        const newWrongAnswers = state.userStats.wrongAnswers + (total - score);
        const newAverageScore = Math.round((newCorrectAnswers / newTotalQuestions) * 100);
        
        // Günlük ilerlemeyi güncelle
        const newDailyProgress = state.userStats.dailyProgress + total;
        const today = new Date().toISOString();
        
        // Tamamlanan testi kaydet
        const completedTest = {
            type: state.selectedLevel ? 'level' : (state.selectedTopic ? 'topic' : 'mock'),
            level: state.selectedLevel,
            topic: state.selectedTopic,
            testNumber: state.currentTestNumber,
            examNumber: state.currentExamNumber,
            date: today
        };
        
        // Firebase'e kaydet
        const updateData = {
            'stats.totalQuizzes': newTotalQuizzes,
            'stats.totalQuestions': newTotalQuestions,
            'stats.correctAnswers': newCorrectAnswers,
            'stats.wrongAnswers': newWrongAnswers,
            'stats.averageScore': newAverageScore,
            'stats.quizHistory': arrayUnion(quizResult),
            'stats.dailyProgress': newDailyProgress,
            'stats.lastProgressDate': today,
            'stats.completedTests': arrayUnion(completedTest)
        };
        
        // Yanlış soruları ekle
        if (wrongQuestions.length > 0) {
            wrongQuestions.forEach(wq => {
                updateData['stats.wrongQuestions'] = arrayUnion(wq);
            });
        }
        
        await updateDoc(doc(window.firebaseDb, 'users', state.user.uid), updateData);
        
        state.userStats.completedTests.push(completedTest);
        
        // State'i güncelle
        state.userStats.totalQuizzes = newTotalQuizzes;
        state.userStats.totalQuestions = newTotalQuestions;
        state.userStats.correctAnswers = newCorrectAnswers;
        state.userStats.wrongAnswers = newWrongAnswers;
        state.userStats.averageScore = newAverageScore;
        state.userStats.quizHistory.push(quizResult);
        state.userStats.dailyProgress = newDailyProgress;
        state.userStats.lastProgressDate = today;
        
        // Yanlış soruları state'e ekle
        if (wrongQuestions.length > 0) {
            if (!state.userStats.wrongQuestions) {
                state.userStats.wrongQuestions = [];
            }
            state.userStats.wrongQuestions.push(...wrongQuestions);
        }
        
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
        state.currentPage = 'home';
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
        state.currentPage = 'home';
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

async function updateDailyGoal() {
    const newGoal = parseInt(document.getElementById('daily-goal-input').value);
    
    if (!newGoal || newGoal < 10 || newGoal > 200) {
        alert('Günlük hedef 10-200 arasında olmalıdır');
        return;
    }
    
    try {
        const { doc, updateDoc } = window.firebaseModules;
        await updateDoc(doc(window.firebaseDb, 'users', state.user.uid), {
            'stats.dailyGoal': newGoal
        });
        
        state.userStats.dailyGoal = newGoal;
        render();
    } catch (error) {
        console.error('Günlük hedef güncelleme hatası:', error);
        alert('Hedef güncellenirken bir hata oluştu');
    }
}

async function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (!text) {
        alert('Lütfen bir görev yazın');
        return;
    }
    
    try {
        const { doc, updateDoc, arrayUnion } = window.firebaseModules;
        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false
        };
        
        await updateDoc(doc(window.firebaseDb, 'users', state.user.uid), {
            'stats.todoList': arrayUnion(newTodo)
        });
        
        state.userStats.todoList.push(newTodo);
        input.value = '';
        render();
    } catch (error) {
        console.error('Todo ekleme hatası:', error);
        alert('Görev eklenirken bir hata oluştu');
    }
}

async function toggleTodoComplete(id) {
    try {
        const { doc, setDoc } = window.firebaseModules;
        const todo = state.userStats.todoList.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            
            await setDoc(doc(window.firebaseDb, 'users', state.user.uid), {
                stats: state.userStats
            }, { merge: true });
            
            render();
        }
    } catch (error) {
        console.error('Todo güncelleme hatası:', error);
    }
}

async function deleteTodo(id) {
    try {
        const { doc, setDoc } = window.firebaseModules;
        state.userStats.todoList = state.userStats.todoList.filter(t => t.id !== id);
        
        await setDoc(doc(window.firebaseDb, 'users', state.user.uid), {
            stats: state.userStats
        }, { merge: true });
        
        render();
    } catch (error) {
        console.error('Todo silme hatası:', error);
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
        quizHistory: [],
        dailyGoal: 50,
        dailyProgress: 0,
        lastProgressDate: null,
        dailyStreak: 0,
        lastLoginDate: null,
        todoList: [],
        completedTests: [],
        wrongQuestions: []
    };
    state.currentPage = 'login';
    render();
}

async function updateUserName() {
    const newName = document.getElementById('nameInput').value.trim();
    
    if (!newName) {
        alert('Lütfen bir isim girin');
        return;
    }
    
    if (newName === state.user.name) {
        alert('Yeni isim mevcut isimle aynı');
        return;
    }
    
    try {
        const { doc, updateDoc } = window.firebaseModules;
        await updateDoc(doc(window.firebaseDb, 'users', state.user.uid), {
            name: newName
        });
        
        state.user.name = newName;
        document.getElementById('displayName').textContent = newName;
        alert('✅ İsim başarıyla güncellendi!');
    } catch (error) {
        console.error('Name update error:', error);
        alert('❌ İsim güncellenirken bir hata oluştu');
    }
}

function confirmDeleteAccount() {
    const confirmation = confirm(
        '⚠️ UYARI: Hesabınızı silmek üzeresiniz!\n\n' +
        'Bu işlem GERİ ALINAMAZ. Tüm verileriniz kalıcı olarak silinecektir:\n' +
        '• Test geçmişiniz\n' +
        '• İstatistikleriniz\n' +
        '• Yapılacaklar listeniz\n' +
        '• Tüm ilerlemeniz\n\n' +
        'Hesabınızı silmek istediğinizden emin misiniz?'
    );
    
    if (confirmation) {
        const secondConfirmation = confirm(
            '🔴 SON UYARI!\n\n' +
            'Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecek.\n\n' +
            'Devam etmek istediğinizden EMİN MİSİNİZ?'
        );
        
        if (secondConfirmation) {
            deleteUserAccount();
        }
    }
}

async function deleteUserAccount() {
    try {
        const { deleteUser } = window.firebaseModules;
        const { doc, deleteDoc } = window.firebaseModules;
        
        const username = state.user.username;
        const uid = state.user.uid;
        
        // Firestore verilerini sil
        await deleteDoc(doc(window.firebaseDb, 'users', uid));
        await deleteDoc(doc(window.firebaseDb, 'usernames', username.toLowerCase()));
        
        // Firebase Auth kullanıcısını sil
        const currentUser = window.firebaseAuth.currentUser;
        if (currentUser) {
            await deleteUser(currentUser);
        }
        
        alert('✅ Hesabınız başarıyla silindi. Bizi tercih ettiğiniz için teşekkürler.');
        
        // State'i temizle ve login sayfasına yönlendir
        state.user = null;
        state.userStats = {
            totalQuizzes: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            averageScore: 0,
            quizHistory: [],
            dailyGoal: 50,
            dailyProgress: 0,
            lastProgressDate: null,
            dailyStreak: 0,
            lastLoginDate: null,
            todoList: [],
            completedTests: [],
            wrongQuestions: []
        };
        state.currentPage = 'login';
        render();
        
    } catch (error) {
        console.error('Delete account error:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            alert('⚠️ Güvenlik nedeniyle hesap silme işlemi için yeniden giriş yapmanız gerekiyor.\n\nLütfen çıkış yapıp tekrar giriş yapın, ardından hesap silme işlemini tekrarlayın.');
        } else {
            alert('❌ Hesap silinirken bir hata oluştu: ' + error.message);
        }
    }
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
        state.currentPage = 'tests';
        state.selectedAnswer = null;
        state.currentQuestion = 0;
        state.currentTestQuestions = [];
        state.userAnswers = [];
        state.quizCompleted = false;
        render();
    }
}

function startMockExam(examNumber) {
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        alert('Sorular henüz yüklenmedi. Lütfen bekleyin.');
        return;
    }
    
    // Tamamen rastgele karıştır
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    
    // İlk 80 soruyu al
    state.currentTestQuestions = shuffled.slice(0, Math.min(80, shuffled.length));
    
    // State'i sıfırla
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.selectedAnswer = null;
    state.quizActive = true;
    state.quizCompleted = false;
    state.userAnswers = new Array(state.currentTestQuestions.length).fill(null);
    state.timer = 180 * 60; // 180 dakika (YDS süresi)
    state.startTime = Date.now();
    state.selectedLevel = null;
    state.selectedTopic = null;
    state.currentExamNumber = examNumber;
    state.currentTestNumber = null;
    
    // Timer başlat
    startTimer();
    
    // Quiz sayfasına geç
    state.currentPage = 'quiz';
    render();
}

function startLevelTest(level, testNumber) {
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        alert('Sorular henüz yüklenmedi. Lütfen bekleyin.');
        return;
    }
    
    // Belirli seviyedeki soruları filtrele
    const filteredQuestions = allQuestions.filter(q => q.level === level);
    
    if (filteredQuestions.length < 10) {
        alert(`${level} seviyesinde yeterli soru yok. En az 10 soru gerekli.`);
        return;
    }
    
    // Test numarasına göre seed bazlı sıralama
    const seed = level.charCodeAt(0) * 1000 + testNumber * 100;
    const seededRandom = (index) => {
        const x = Math.sin(seed + index) * 10000;
        return x - Math.floor(x);
    };
    
    const shuffled = [...filteredQuestions]
        .map((q, i) => ({ q, sort: seededRandom(i) }))
        .sort((a, b) => a.sort - b.sort)
        .map(item => item.q);
    
    // 10 soru seç
    state.currentTestQuestions = shuffled.slice(0, 10);
    
    // State'i sıfırla
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.selectedAnswer = null;
    state.quizActive = true;
    state.quizCompleted = false;
    state.userAnswers = new Array(state.currentTestQuestions.length).fill(null);
    state.timer = 600; // 10 dakika (10 soru için)
    state.startTime = Date.now();
    state.selectedLevel = level;
    state.selectedTopic = null;
    state.currentTestNumber = testNumber;
    state.currentExamNumber = null;
    
    // Timer başlat
    startTimer();
    
    // Quiz sayfasına geç
    state.currentPage = 'quiz';
    render();
}

function startTopicTest(topic, testNumber = 1) {
    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        alert('Sorular henüz yüklenmedi. Lütfen bekleyin.');
        return;
    }
    
    // Belirli konudaki soruları filtrele
    const filteredQuestions = allQuestions.filter(q => q.topic === topic);
    
    if (filteredQuestions.length < 10) {
        alert(`${topic} konusunda yeterli soru yok. En az 10 soru gerekli.`);
        return;
    }
    
    // Test numarasına göre soruları seç (her test farklı sorular)
    const startIndex = (testNumber - 1) * 10;
    const endIndex = startIndex + 10;
    
    if (filteredQuestions.length < endIndex) {
        alert(`${topic} konusunda Test ${testNumber} için yeterli soru yok.`);
        return;
    }
    
    state.currentTestQuestions = filteredQuestions.slice(startIndex, endIndex);
    
    // State'i sıfırla
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.selectedAnswer = null;
    state.quizActive = true;
    state.quizCompleted = false;
    state.userAnswers = new Array(state.currentTestQuestions.length).fill(null);
    state.timer = 600; // 10 dakika
    state.startTime = Date.now();
    state.selectedLevel = null;
    state.selectedTopic = topic;
    state.currentTestNumber = testNumber;
    state.currentExamNumber = null;
    
    // Timer başlat
    startTimer();
    
    // Quiz sayfasına geç
    state.currentPage = 'quiz';
    render();
}

function startPersonalizedTest(testNumber) {
    const wrongQuestions = state.userStats.wrongQuestions || [];
    
    if (wrongQuestions.length === 0) {
        alert('Henüz yanlış yapılan soru yok.');
        return;
    }
    
    // Test numarasına göre soruları seç (10'arlık gruplar)
    const startIndex = (testNumber - 1) * 10;
    const endIndex = Math.min(startIndex + 10, wrongQuestions.length);
    
    if (startIndex >= wrongQuestions.length) {
        alert('Bu test için yeterli soru yok.');
        return;
    }
    
    // Yanlış soruları test formatına dönüştür
    state.currentTestQuestions = wrongQuestions.slice(startIndex, endIndex);
    
    // State'i sıfırla
    state.currentQuestion = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.wrongAnswers = 0;
    state.selectedAnswer = null;
    state.quizActive = true;
    state.quizCompleted = false;
    state.userAnswers = new Array(state.currentTestQuestions.length).fill(null);
    state.timer = state.currentTestQuestions.length * 60; // Soru başına 1 dakika
    state.startTime = Date.now();
    state.selectedLevel = null;
    state.selectedTopic = 'Kişiselleştirilmiş';
    state.currentTestNumber = testNumber;
    state.currentExamNumber = null;
    state.isPersonalizedTest = true; // Kişiselleştirilmiş test işareti
    
    // Timer başlat
    startTimer();
    
    // Quiz sayfasına geç
    state.currentPage = 'quiz';
    render();
}

async function clearWrongQuestions() {
    if (!confirm('⚠️ Tüm yanlış soruları silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!')) {
        return;
    }
    
    if (!confirm('✋ Son bir kez soralım: Gerçekten tüm yanlış soruları silmek istiyor musunuz?')) {
        return;
    }
    
    try {
        const { doc, updateDoc } = window.firebaseModules;
        
        // Firebase'de sıfırla
        await updateDoc(doc(window.firebaseDb, 'users', state.user.uid), {
            'stats.wrongQuestions': []
        });
        
        // State'i güncelle
        state.userStats.wrongQuestions = [];
        
        alert('✅ Tüm yanlış sorular temizlendi!');
        
        // Ana sayfaya yönlendir
        state.currentPage = 'home';
        render();
        
    } catch (error) {
        console.error('Clear wrong questions error:', error);
        alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

// Accordion toggle fonksiyonu
function toggleAccordion(accordionId) {
    const content = document.getElementById(accordionId);
    const icon = document.getElementById(`${accordionId}-icon`);
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
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
    state.quizCompleted = false;
    state.userAnswers = new Array(questionCount).fill(null);
    state.timer = 1200; // 20 dakika
    state.startTime = Date.now();
    state.selectedLevel = level;
    state.selectedTopic = topic;
    state.currentTestNumber = null;
    state.currentExamNumber = null;
    
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
    if (!state.quizActive && !state.quizCompleted) return;
    
    // Eğer anında geri bildirim açıksa ve bu soru zaten cevaplandıysa, değiştirme
    if (state.showImmediateFeedback && state.userAnswers[state.currentQuestion] !== null) {
        return;
    }
    
    state.selectedAnswer = index;
    render();
}

function toggleImmediateFeedback() {
    state.showImmediateFeedback = !state.showImmediateFeedback;
    render();
}

function goToQuestion(questionIndex) {
    if (questionIndex < 0 || questionIndex >= state.currentTestQuestions.length) return;
    
    state.currentQuestion = questionIndex;
    state.selectedAnswer = state.userAnswers[questionIndex];
    render();
}

function nextQuestion() {
    if (state.currentQuestion < state.currentTestQuestions.length - 1) {
        state.currentQuestion++;
        state.selectedAnswer = state.userAnswers[state.currentQuestion];
        render();
    }
}

function previousQuestion() {
    if (state.currentQuestion > 0) {
        state.currentQuestion--;
        state.selectedAnswer = state.userAnswers[state.currentQuestion];
        render();
    }
}

function submitAnswer() {
    if (state.selectedAnswer === null) {
        alert('Lütfen bir cevap seçin');
        return;
    }
    
    // Cevabı kaydet
    state.userAnswers[state.currentQuestion] = state.selectedAnswer;
    
    // Eğer daha önce cevaplamadıysa skorları güncelle
    if (state.userAnswers[state.currentQuestion] === state.selectedAnswer) {
        const currentQ = state.currentTestQuestions[state.currentQuestion];
        const correct = currentQ.correctAnswer === state.selectedAnswer;
        
        if (correct) {
            state.score++;
            state.correctAnswers++;
        } else {
            state.wrongAnswers++;
        }
    }
    
    // Eğer anında geri bildirim kapalıysa, direkt sonraki soruya geç
    if (!state.showImmediateFeedback) {
        if (state.currentQuestion < state.currentTestQuestions.length - 1) {
            state.currentQuestion++;
            state.selectedAnswer = state.userAnswers[state.currentQuestion];
            render();
        } else {
            // Son soru - testi bitir
            finishQuiz();
        }
    } else {
        // Anında geri bildirim açık - sadece render et (doğru/yanlış gösterilecek)
        render();
    }
}

function finishQuiz() {
    state.quizCompleted = true;
    state.quizActive = false;
    clearInterval(state.timerInterval);
    render();
}

async function endQuiz() {
    clearInterval(state.timerInterval);
    finishQuiz();
}

async function saveAndShowResults() {
    const duration = Math.round((Date.now() - state.startTime) / 1000);
    
    // Firebase'e kaydet
    await saveQuizResult(state.score, state.currentTestQuestions.length, duration);
    
    state.showQuestionDetails = false;
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

function toggleQuestionDetails() {
    state.showQuestionDetails = !state.showQuestionDetails;
    render();
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
                    <img src="KİTKİTlogo.jpg" alt="KİTKİT Logo" width="120" height="120" style="border-radius: 50%; object-fit: cover; object-position: center 10%;">
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

function renderHome() {
    const recentQuizzes = state.userStats.quizHistory.slice(-3).reverse();
    
    // 2026 Sınav Tarihleri
    const exams = [
        { name: 'YDS', date: new Date('2026-02-22'), type: 'YDS' },
        { name: 'YÖKDİL', date: new Date('2026-03-15'), type: 'YÖKDİL' },
        { name: 'YDS', date: new Date('2026-05-17'), type: 'YDS' },
        { name: 'YÖKDİL', date: new Date('2026-06-14'), type: 'YÖKDİL' },
        { name: 'YDS', date: new Date('2026-08-16'), type: 'YDS' },
        { name: 'YÖKDİL', date: new Date('2026-09-20'), type: 'YÖKDİL' },
        { name: 'YDS', date: new Date('2026-11-15'), type: 'YDS' },
        { name: 'YÖKDİL', date: new Date('2026-12-13'), type: 'YÖKDİL' }
    ];
    
    const now = new Date();
    const upcomingExams = exams.filter(exam => exam.date > now).slice(0, 3);
    
    function getCountdown(examDate) {
        const diff = examDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days;
    }
    
    return `
        <div class="dashboard">
            ${renderNavbar('home')}
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>Hoş geldin, ${state.user.name}! 👋</h1>
                    <p>Bugün hangi konuya odaklanmak istersin?</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div class="card" style="background: linear-gradient(135deg, #FF572215 0%, #F0932415 100%); border: 2px solid #FF5722;">
                        <h2>🔥 Günlük Streak</h2>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-top: 20px;">
                            <div style="text-align: center;">
                                <div style="font-size: 72px; font-weight: bold; color: #FF5722;">${state.userStats.dailyStreak}</div>
                                <div style="font-size: 18px; color: #666; margin-top: 10px;">Gün Üst Üste Giriş!</div>
                            </div>
                            <div style="font-size: 80px;">🔥</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 20px; text-align: center;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Son Giriş</div>
                            <div style="font-size: 16px; font-weight: 600; color: #333;">
                                ${state.userStats.lastLoginDate ? new Date(state.userStats.lastLoginDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Bugün'}
                            </div>
                        </div>
                        ${state.userStats.dailyStreak >= 7 ? '<div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; margin-top: 15px;">🏆 Harika! 7 günlük streak\'i geçtin!</div>' : ''}
                        ${state.userStats.dailyStreak >= 30 ? '<div style="background: linear-gradient(135deg, #FF1493, #FF69B4); color: white; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; margin-top: 15px;">🎆 İnanılmaz! 30 günlük streak efsanesi!</div>' : ''}
                    </div>
                    
                    <div class="card" style="background: linear-gradient(135deg, #FF980015 0%, #FF572215 100%); border: 2px solid #FF9800;">
                        <h2>🎯 Günlük Hedef</h2>
                        <div style="display: flex; align-items: center; gap: 30px; margin-top: 20px;">
                            <div style="position: relative; width: 150px; height: 150px;">
                                <svg width="150" height="150" style="transform: rotate(-90deg);">
                                    <circle cx="75" cy="75" r="65" fill="none" stroke="#E0E0E0" stroke-width="12"></circle>
                                    <circle cx="75" cy="75" r="65" fill="none" stroke="#FF9800" stroke-width="12" 
                                        stroke-dasharray="${2 * Math.PI * 65}" 
                                        stroke-dashoffset="${2 * Math.PI * 65 * (1 - Math.min(state.userStats.dailyProgress / state.userStats.dailyGoal, 1))}"
                                        stroke-linecap="round"
                                        style="transition: stroke-dashoffset 0.5s ease;">
                                    </circle>
                                </svg>
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                    <div style="font-size: 32px; font-weight: bold; color: #FF9800;">${state.userStats.dailyProgress}</div>
                                    <div style="font-size: 14px; color: #666;">/ ${state.userStats.dailyGoal}</div>
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <div style="margin-bottom: 15px;">
                                    <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 5px;">Bugünkü İlerleme</div>
                                    <div style="font-size: 14px; color: #666;">${Math.round((state.userStats.dailyProgress / state.userStats.dailyGoal) * 100)}% tamamlandı</div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; font-size: 14px; color: #666; margin-bottom: 8px;">Günlük Hedef:</label>
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input type="number" id="daily-goal-input" value="${state.userStats.dailyGoal}" min="10" max="200" 
                                            style="padding: 8px 12px; border: 2px solid #E0E0E0; border-radius: 8px; font-size: 16px; width: 100px;">
                                        <button onclick="updateDailyGoal()" class="btn-secondary" style="padding: 8px 16px;">Güncelle</button>
                                    </div>
                                </div>
                                ${state.userStats.dailyProgress >= state.userStats.dailyGoal ? 
                                    '<div style="background: #4CAF50; color: white; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600;">🎉 Günlük hedefini tamamladın!</div>' : 
                                    `<div style="background: #FFF3E0; padding: 12px; border-radius: 8px; text-align: center; color: #FF9800; font-weight: 600;">💪 ${state.userStats.dailyGoal - state.userStats.dailyProgress} soru kaldı!</div>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div class="card" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea;">
                        <h2>📅 Yaklaşan Sınavlar (2026)</h2>
                        <div style="display: grid; gap: 15px; margin-top: 20px;">
                            ${upcomingExams.map(exam => {
                                const days = getCountdown(exam.date);
                                return `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-radius: 10px; border-left: 4px solid ${exam.type === 'YDS' ? '#2196F3' : '#FF9800'};">
                                        <div>
                                            <div style="font-size: 18px; font-weight: bold; color: #333;">${exam.name}</div>
                                            <div style="color: #666; margin-top: 5px;">${exam.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 32px; font-weight: bold; color: ${days <= 30 ? '#EF5350' : '#667eea'};">${days}</div>
                                            <div style="color: #666; font-size: 14px;">gün kaldı</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="card" style="background: linear-gradient(135deg, #4CAF5015 0%, #8BC34A15 100%); border: 2px solid #4CAF50;">
                        <h2>✅ Yapılacaklar Listesi</h2>
                    <div style="margin-top: 20px;">
                        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                            <input type="text" id="todo-input" placeholder="Yeni görev ekle (örn: A1 - Test 1 çözülecek)" 
                                style="flex: 1; padding: 12px; border: 2px solid #E0E0E0; border-radius: 8px; font-size: 15px;"
                                onkeypress="if(event.key==='Enter') addTodo()">
                            <button onclick="addTodo()" class="btn-primary" style="padding: 12px 24px;">➕ Ekle</button>
                        </div>
                        
                        ${state.userStats.todoList && state.userStats.todoList.length > 0 ? `
                            <div style="display: grid; gap: 10px;">
                                ${state.userStats.todoList.map(todo => `
                                    <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: white; border-radius: 10px; border-left: 4px solid ${todo.completed ? '#4CAF50' : '#2196F3'};">
                                        <button onclick="toggleTodoComplete(${todo.id})" 
                                            style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${todo.completed ? '#4CAF50' : '#E0E0E0'}; background: ${todo.completed ? '#4CAF50' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">
                                            ${todo.completed ? '✓' : ''}
                                        </button>
                                        <div style="flex: 1; ${todo.completed ? 'text-decoration: line-through; color: #999;' : 'color: #333;'}">
                                            ${todo.text}
                                        </div>
                                        <button onclick="deleteTodo(${todo.id})" 
                                            style="padding: 6px 12px; background: #EF5350; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                            🗑️ Sil
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div style="text-align: center; padding: 40px; color: #999;">
                                <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                                <div>Henüz görev eklemedin. Hemen ekle ve hedeflerine ulaş!</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStats() {
    const allQuizzes = state.userStats.quizHistory.slice().reverse();
    const successRate = state.userStats.totalQuestions > 0 ? Math.round((state.userStats.correctAnswers / state.userStats.totalQuestions) * 100) : 0;
    const failureRate = 100 - successRate;
    
    return `
        <div class="dashboard">
            ${renderNavbar('stats')}
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>📊 İstatistikler</h1>
                    <p>Performansını takip et ve gelişimini gör</p>
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
                        <h3>Yanlış Cevap</h3>
                        <div class="value">${state.userStats.wrongAnswers}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Ortalama Başarı</h3>
                        <div class="value">${state.userStats.averageScore}%</div>
                    </div>
                    <div class="stat-card">
                        <h3>En İyi Skor</h3>
                        <div class="value">${allQuizzes.length > 0 ? Math.max(...allQuizzes.map(q => q.percentage)) : 0}%</div>
                    </div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #4CAF5015 0%, #8BC34A15 100%); border: 2px solid #4CAF50;">
                    <h2>📊 Genel Başarı Grafiği</h2>
                    <div style="margin: 30px 0;">
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-weight: 600; color: #4CAF50;">✓ Doğru</span>
                                    <span style="font-weight: bold; color: #4CAF50;">${successRate}%</span>
                                </div>
                                <div style="height: 30px; background: #E0E0E0; border-radius: 15px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); width: ${successRate}%; transition: width 1s;"></div>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-weight: 600; color: #EF5350;">✗ Yanlış</span>
                                    <span style="font-weight: bold; color: #EF5350;">${failureRate}%</span>
                                </div>
                                <div style="height: 30px; background: #E0E0E0; border-radius: 15px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #EF5350, #FF9800); width: ${failureRate}%; transition: width 1s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #4CAF50;">
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Toplam Soru</div>
                            <div style="font-size: 28px; font-weight: bold; color: #2196F3;">${state.userStats.totalQuestions}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Doğru Sayısı</div>
                            <div style="font-size: 28px; font-weight: bold; color: #4CAF50;">${state.userStats.correctAnswers}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Yanlış Sayısı</div>
                            <div style="font-size: 28px; font-weight: bold; color: #EF5350;">${state.userStats.wrongAnswers}</div>
                        </div>
                    </div>
                </div>
                
                ${(() => {
                    // Son 7 günün tarihlerini oluştur
                    const last7Days = [];
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        last7Days.push({
                            date: date,
                            dateStr: date.toDateString(),
                            label: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                        });
                    }
                    
                    // Günlük soru sayılarını hesapla
                    const dailyQuestions = {};
                    last7Days.forEach(day => {
                        dailyQuestions[day.dateStr] = 0;
                    });
                    
                    allQuizzes.forEach(quiz => {
                        const quizDate = new Date(quiz.date).toDateString();
                        if (dailyQuestions.hasOwnProperty(quizDate)) {
                            dailyQuestions[quizDate] += quiz.total;
                        }
                    });
                    
                    const maxQuestions = Math.max(...Object.values(dailyQuestions), 1);
                    
                    return `
                        <div class="card" style="background: linear-gradient(135deg, #2196F315 0%, #00BCD415 100%); border: 2px solid #2196F3;">
                            <h2>📅 Son 7 Gün Soru Çözüm Grafiği</h2>
                            <div style="margin-top: 30px;">
                                <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; gap: 8px; padding: 0 10px;">
                                    ${last7Days.map(day => {
                                        const count = dailyQuestions[day.dateStr];
                                        const height = maxQuestions > 0 ? (count / maxQuestions) * 100 : 0;
                                        const isToday = day.dateStr === new Date().toDateString();
                                        
                                        return `
                                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; width: 100%;">
                                                    ${count > 0 ? `<div style="font-size: 12px; font-weight: bold; color: #2196F3; margin-bottom: 5px;">${count}</div>` : ''}
                                                    <div style="width: 100%; max-width: 60px; background: ${isToday ? 'linear-gradient(180deg, #FF9800, #FF5722)' : 'linear-gradient(180deg, #2196F3, #00BCD4)'}; height: ${height}%; min-height: ${count > 0 ? '20px' : '5px'}; border-radius: 8px 8px 0 0; transition: height 0.5s; box-shadow: 0 -2px 10px rgba(33, 150, 243, 0.3);"></div>
                                                </div>
                                                <div style="text-align: center; font-size: 11px; color: ${isToday ? '#FF9800' : '#666'}; font-weight: ${isToday ? 'bold' : 'normal'};">
                                                    ${day.label}
                                                    ${isToday ? '<br><span style="font-size: 10px;">Bugün</span>' : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Son 7 Gün Toplamı</div>
                                    <div style="font-size: 28px; font-weight: bold; color: #2196F3;">${Object.values(dailyQuestions).reduce((a, b) => a + b, 0)} Soru</div>
                                </div>
                            </div>
                        </div>
                    `;
                })()}
                
                ${(() => {
                    const topics = [
                        { id: 'Vocabulary', name: 'Kelime – Phrasal Verb', icon: '📖', color: '#2196F3' },
                        { id: 'Grammar', name: 'Tense – Preposition – Dilbilgisi', icon: '📚', color: '#9C27B0' },
                        { id: 'Cloze', name: 'Cloze Test', icon: '📝', color: '#FF9800' },
                        { id: 'Completion', name: 'Cümle Tamamlama', icon: '✍️', color: '#4CAF50' },
                        { id: 'Translation', name: 'Çeviri', icon: '🔄', color: '#00BCD4' },
                        { id: 'Dialog', name: 'Diyalog Tamamlama', icon: '💬', color: '#795548' },
                        { id: 'Paraphrase', name: 'Yakın Anlamlı Cümle', icon: '🔁', color: '#607D8B' },
                        { id: 'Paragraph-Completion', name: 'Paragraf Tamamlama', icon: '📄', color: '#E91E63' },
                        { id: 'Irrelevant', name: 'Anlatım Bütünlüğünü Bozan Cümle', icon: '❌', color: '#FF5722' }
                    ];
                    
                    // Konuya göre istatistikleri hesapla
                    const topicStats = {};
                    allQuizzes.forEach(quiz => {
                        if (quiz.topic) {
                            if (!topicStats[quiz.topic]) {
                                topicStats[quiz.topic] = { correct: 0, total: 0 };
                            }
                            topicStats[quiz.topic].correct += quiz.score;
                            topicStats[quiz.topic].total += quiz.total;
                        }
                    });
                    
                    // Sadece çözülmüş konuları göster
                    const solvedTopics = topics.filter(topic => topicStats[topic.id]);
                    
                    if (solvedTopics.length === 0) return '';
                    
                    return `
                        <div class="card">
                            <h2>🎯 Konuya Göre Başarı Grafikleri</h2>
                            <div style="display: grid; gap: 20px; margin-top: 20px;">
                                ${solvedTopics.map(topic => {
                                    const stats = topicStats[topic.id];
                                    const topicSuccessRate = Math.round((stats.correct / stats.total) * 100);
                                    const topicFailureRate = 100 - topicSuccessRate;
                                    
                                    return `
                                        <div style="padding: 20px; background: #F5F7FA; border-radius: 12px; border-left: 4px solid ${topic.color};">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                                                <span style="font-size: 24px;">${topic.icon}</span>
                                                <h3 style="margin: 0; color: #333;">${topic.name}</h3>
                                            </div>
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                                                <div>
                                                    <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Toplam Soru</div>
                                                    <div style="font-size: 20px; font-weight: bold; color: ${topic.color};">${stats.total}</div>
                                                </div>
                                                <div>
                                                    <div style="font-size: 12px; color: #666; margin-bottom: 3px;">Başarı Oranı</div>
                                                    <div style="font-size: 20px; font-weight: bold; color: ${topicSuccessRate >= 70 ? '#4CAF50' : topicSuccessRate >= 50 ? '#FF9800' : '#EF5350'};">${topicSuccessRate}%</div>
                                                </div>
                                            </div>
                                            <div style="margin-bottom: 10px;">
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                                                    <span style="color: #4CAF50; font-weight: 600;">✓ Doğru: ${stats.correct}</span>
                                                    <span style="color: #4CAF50; font-weight: bold;">${topicSuccessRate}%</span>
                                                </div>
                                                <div style="height: 20px; background: #E0E0E0; border-radius: 10px; overflow: hidden;">
                                                    <div style="height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); width: ${topicSuccessRate}%; transition: width 0.5s;"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                                                    <span style="color: #EF5350; font-weight: 600;">✗ Yanlış: ${stats.total - stats.correct}</span>
                                                    <span style="color: #EF5350; font-weight: bold;">${topicFailureRate}%</span>
                                                </div>
                                                <div style="height: 20px; background: #E0E0E0; border-radius: 10px; overflow: hidden;">
                                                    <div style="height: 100%; background: linear-gradient(90deg, #EF5350, #FF9800); width: ${topicFailureRate}%; transition: width 0.5s;"></div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                })()}
                
                <div class="card">
                    <h2>📈 Test Geçmişi</h2>
                    ${allQuizzes.length > 0 ? allQuizzes.map(quiz => `
                        <div class="quiz-history-item">
                            <div>
                                <div class="quiz-score">${quiz.score}/${quiz.total} Soru</div>
                                <div class="quiz-date">${new Date(quiz.date).toLocaleDateString('tr-TR', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</div>
                            </div>
                            <div class="quiz-percentage" style="color: ${quiz.percentage >= 70 ? '#4CAF50' : quiz.percentage >= 50 ? '#FF9800' : '#EF5350'}">
                                %${quiz.percentage}
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: #999; padding: 40px;">Henüz test çözmedin. İlk testini çöz ve istatistiklerini görmeye başla!</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderTests() {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const topics = [
        { id: 'Vocabulary', name: 'Vocabulary & Phrasal Verbs', icon: '📖' },
        { id: 'Grammar', name: 'Grammar & Tenses', icon: '📚' },
        { id: 'Cloze', name: 'Cloze Test', icon: '📝' },
        { id: 'Completion', name: 'Sentence Completion', icon: '✍️' },
        { id: 'Dialog', name: 'Dialogue Completion', icon: '💬' },
        { id: 'Paraphrase', name: 'Paraphrasing', icon: '🔁' },
        { id: 'Paragraph-Completion', name: 'Paragraph Completion', icon: '📄' },
        { id: 'Irrelevant', name: 'Finding Irrelevant Sentence', icon: '❌' }
    ];
    
    // Tamamlanan testleri kontrol et
    const isTestCompleted = (type, level, testNumber, topic) => {
        return state.userStats.completedTests && state.userStats.completedTests.some(t => 
            t.type === type && 
            (type === 'level' ? (t.level === level && t.testNumber === testNumber) : 
            (type === 'topic' ? (t.topic === topic && t.testNumber === testNumber) : false))
        );
    };
    
    return `
        <div class="dashboard">
            ${renderNavbar('tests')}
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>📝 Testler</h1>
                    <p>Seviyene ve konuya göre test çöz</p>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, rgba(0, 100, 255, 0.1), rgba(0, 212, 255, 0.05)); border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h2>⚙️ Test Ayarları</h2>
                    <div style="margin-top: 15px;">
                        <button onclick="toggleImmediateFeedback()" class="btn-secondary" style="width: 100%; padding: 15px; font-size: 16px;">
                            ${state.showImmediateFeedback ? '👁️ Cevabı Hemen Göster: AÇIK ✓' : '👁️ Cevabı Hemen Göster: KAPALI ✗'}
                        </button>
                        <p style="font-size: 13px; color: var(--text-muted); margin-top: 10px; text-align: center;">
                            ${state.showImmediateFeedback ? '✓ Cevap verince hemen doğru/yanlış gösterilecek' : '✗ Test sonunda sonuçlar gösterilecek'}
                        </p>
                    </div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #FF572215 0%, #F0932415 100%); border: 2px solid #FF5722;">
                    <h2>🎓 Kişiselleştirilmiş Testler</h2>
                    <p style="margin-bottom: 20px; color: #666;">Yanlış yaptığın sorulardan oluşan özel testler - Hatalarından öğren!</p>
                    ${(state.userStats.wrongQuestions && state.userStats.wrongQuestions.length > 0) ? `
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 36px; font-weight: bold; color: #FF5722;">${state.userStats.wrongQuestions.length}</div>
                                <div style="color: #666; margin-top: 5px;">Yanlış Soru</div>
                            </div>
                            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 36px; font-weight: bold; color: #2196F3;">${Math.floor(state.userStats.wrongQuestions.length / 10)}</div>
                                <div style="color: #666; margin-top: 5px;">Kişiselleştirilmiş Test</div>
                            </div>
                        </div>
                        ${state.userStats.wrongQuestions.length >= 10 ? `
                            <div class="level-buttons" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); margin-top: 20px;">
                                ${(() => {
                                    const testsCount = Math.floor(state.userStats.wrongQuestions.length / 10);
                                    const tests = [];
                                    for (let i = 0; i < testsCount; i++) {
                                        const testNumber = i + 1;
                                        const questionCount = 10;
                                        const colors = [
                                            ['#667eea', '#764ba2'],
                                            ['#f093fb', '#f5576c'],
                                            ['#4facfe', '#00f2fe'],
                                            ['#43e97b', '#38f9d7'],
                                            ['#fa709a', '#fee140'],
                                            ['#30cfd0', '#a044ff']
                                        ];
                                        const colorPair = colors[i % colors.length];
                                        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                                        
                                        tests.push(`
                                            <button onclick="startPersonalizedTest(${testNumber})" class="btn-level" 
                                                style="background: linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%); 
                                                color: white; border: none; padding: 25px; position: relative;">
                                                <div style="font-size: 32px; margin-bottom: 10px;">${emojis[i] || testNumber + '️⃣'}</div>
                                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">Test ${testNumber}</div>
                                                <div style="font-size: 14px; opacity: 0.9;">${questionCount} Soru</div>
                                            </button>
                                        `);
                                    }
                                    return tests.join('');
                                })()}
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 20px;">
                                <div style="color: #666; font-size: 14px; line-height: 1.6;">
                                    💡 <strong>İpucu:</strong> Bu testleri çözdükçe zayıf noktalarını güçlendirebilirsin. 
                                    Aynı soruları tekrar görmek için istediğin testi tekrar çözebilirsin.
                                </div>
                            </div>
                        ` : `
                            <div style="background: linear-gradient(135deg, #FFA72615 0%, #FF572215 100%); padding: 25px; border-radius: 10px; border: 2px dashed #FF9800; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
                                <div style="font-size: 18px; font-weight: bold; color: #FF5722; margin-bottom: 10px;">
                                    Henüz test oluşmadı
                                </div>
                                <div style="color: #666; line-height: 1.6;">
                                    İlk kişiselleştirilmiş testin için daha <strong>${10 - state.userStats.wrongQuestions.length} soru</strong> yanlış yapman gerekiyor!
                                    <br>
                                    Test çözmeye devam et, her 10 yanlış soruda yeni bir test oluşacak. 💪
                                </div>
                            </div>
                        `}
                    ` : `
                        <div style="text-align: center; padding: 30px; color: #999;">
                            <div style="font-size: 48px; margin-bottom: 15px;">✨</div>
                            <div>Henüz yanlış yapılan soru yok.</div>
                            <div style="margin-top: 10px;">Test çözmeye başladığında yanlış yaptığın sorular buraya eklenecek!</div>
                        </div>
                    `}
                </div>
                
                <div class="card">
                    <h2>🎯 Seviyeye Göre Testler</h2>
                    ${levels.map(level => {
                        const accordionId = `level-${level}`;
                        return `
                        <div style="margin-bottom: 15px; border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 0; overflow: hidden;">
                            <button 
                                onclick="toggleAccordion('${accordionId}')" 
                                class="accordion-header"
                                style="width: 100%; padding: 20px; background: rgba(0, 26, 51, 0.4); border: none; color: var(--text-light); font-size: 18px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s;">
                                <span>${level} Level</span>
                                <span id="${accordionId}-icon" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                            </button>
                            <div id="${accordionId}" class="accordion-content" style="display: none; padding: 20px; background: rgba(0, 26, 51, 0.2);">
                                <div class="level-buttons" style="grid-template-columns: repeat(3, 1fr);">
                                    <button onclick="startLevelTest('${level}', 1)" class="btn-level" style="position: relative;">
                                        ${isTestCompleted('level', level, 1, null) ? '<span style="position: absolute; top: 5px; right: 5px; background: #00ff88; color: #000; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);">✓</span>' : ''}
                                        Test 1
                                    </button>
                                    <button onclick="startLevelTest('${level}', 2)" class="btn-level" style="position: relative;">
                                        ${isTestCompleted('level', level, 2, null) ? '<span style="position: absolute; top: 5px; right: 5px; background: #00ff88; color: #000; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);">✓</span>' : ''}
                                        Test 2
                                    </button>
                                    <button onclick="startLevelTest('${level}', 3)" class="btn-level" style="position: relative;">
                                        ${isTestCompleted('level', level, 3, null) ? '<span style="position: absolute; top: 5px; right: 5px; background: #00ff88; color: #000; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);">✓</span>' : ''}
                                        Test 3
                                    </button>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="card">
                    <h2>📚 Konuya Göre Testler</h2>
                    ${topics.map(topic => {
                        const accordionId = `topic-${topic.id}`;
                        return `
                        <div style="margin-bottom: 15px; border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 0; overflow: hidden;">
                            <button 
                                onclick="toggleAccordion('${accordionId}')" 
                                class="accordion-header"
                                style="width: 100%; padding: 20px; background: rgba(0, 26, 51, 0.4); border: none; color: var(--text-light); font-size: 16px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s;">
                                <span><span style="font-size: 24px; margin-right: 10px;">${topic.icon}</span>${topic.name}</span>
                                <span id="${accordionId}-icon" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                            </button>
                            <div id="${accordionId}" class="accordion-content" style="display: none; padding: 20px; background: rgba(0, 26, 51, 0.2);">
                                <div class="level-buttons" style="grid-template-columns: repeat(2, 1fr);">
                                    <button onclick="startTopicTest('${topic.id}', 1)" class="btn-level" style="position: relative;">
                                        ${isTestCompleted('topic', null, 1, topic.id) ? '<span style="position: absolute; top: 5px; right: 5px; background: #00ff88; color: #000; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);">✓</span>' : ''}
                                        Test 1
                                    </button>
                                    <button onclick="startTopicTest('${topic.id}', 2)" class="btn-level" style="position: relative;">
                                        ${isTestCompleted('topic', null, 2, topic.id) ? '<span style="position: absolute; top: 5px; right: 5px; background: #00ff88; color: #000; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);">✓</span>' : ''}
                                        Test 2
                                    </button>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="card">
                    <h2>🎲 Rastgele Test</h2>
                    <p style="margin-bottom: 20px; color: var(--text-muted);">Tüm seviye ve konulardan karışık 20 soru</p>
                    <button onclick="startQuiz(null, null)" class="btn-random">🎲 Rastgele Test Başlat</button>
                </div>
            </div>
        </div>
    `;
}

function renderMockExams() {
    // Deneme sınavlarının tamamlanma durumunu kontrol et
    const isMockExamCompleted = (examNumber) => {
        return state.userStats.completedTests && state.userStats.completedTests.some(t => 
            t.type === 'mock' && t.examNumber === examNumber
        );
    };
    
    return `
        <div class="dashboard">
            ${renderNavbar('mock-exams')}
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>🎯 Deneme Sınavları</h1>
                    <p>Gerçek sınav formatında 80 soruluk tam denemeler</p>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea;">
                    <h2>⚙️ Sınav Ayarları</h2>
                    <div style="margin-top: 15px;">
                        <button onclick="toggleImmediateFeedback()" class="btn-secondary" style="width: 100%; padding: 15px; font-size: 16px;">
                            ${state.showImmediateFeedback ? '👁️ Cevabı Hemen Göster: AÇIK ✓' : '👁️ Cevabı Hemen Göster: KAPALI ✗'}
                        </button>
                        <p style="font-size: 13px; color: #666; margin-top: 10px; text-align: center;">
                            ${state.showImmediateFeedback ? '✓ Cevap verince hemen doğru/yanlış gösterilecek' : '✗ Test sonunda sonuçlar gösterilecek'}
                        </p>
                    </div>
                </div>
                
                <div class="card">
                    <h2>📝 Deneme Sınavları (80 Soru - 180 Dakika)</h2>
                    <p style="margin-bottom: 20px; color: #666;">
                        Her deneme tüm konular ve düzeylerden 80 soru içerir. Her deneme için 180 dakika süreniz var.
                        <br><strong>Not:</strong> Her deneme başlatıldığında farklı sorular gelir.
                    </p>
                    <div class="level-buttons" style="grid-template-columns: repeat(3, 1fr);">
                        <button onclick="startMockExam(1)" class="btn-level" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 20px; position: relative;">
                            ${isMockExamCompleted(1) ? '<span style="position: absolute; top: 10px; right: 10px; background: #4CAF50; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">✓</span>' : ''}
                            <div style="font-size: 24px; margin-bottom: 10px;">1️⃣</div>
                            <div>1. Deneme</div>
                        </button>
                        <button onclick="startMockExam(2)" class="btn-level" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 20px; position: relative;">
                            ${isMockExamCompleted(2) ? '<span style="position: absolute; top: 10px; right: 10px; background: #4CAF50; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">✓</span>' : ''}
                            <div style="font-size: 24px; margin-bottom: 10px;">2️⃣</div>
                            <div>2. Deneme</div>
                        </button>
                        <button onclick="startMockExam(3)" class="btn-level" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; padding: 20px; position: relative;">
                            ${isMockExamCompleted(3) ? '<span style="position: absolute; top: 10px; right: 10px; background: #4CAF50; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">✓</span>' : ''}
                            <div style="font-size: 24px; margin-bottom: 10px;">3️⃣</div>
                            <div>3. Deneme</div>
                        </button>
                    </div>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea;">
                    <h2>💡 İpuçları</h2>
                    <ul style="color: #666; line-height: 2;">
                        <li>✅ Deneme sınavlarını gerçek sınav gibi düşünün</li>
                        <li>⏱️ Süre yönetimini pratik edin (soru başına ~1 dakika)</li>
                        <li>📊 Her denemeden sonra sonuçlarınızı inceleyin</li>
                        <li>🎯 Zayıf olduğunuz konulara odaklanın</li>
                        <li>🔄 Aynı denemeyi tekrar çözerek ilerlemenizi ölçün</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function renderPersonalizedTests() {
    const wrongQuestions = state.userStats.wrongQuestions || [];
    
    // 10'arlık gruplara ayır
    const testsCount = Math.ceil(wrongQuestions.length / 10);
    const tests = [];
    
    for (let i = 0; i < testsCount; i++) {
        const startIndex = i * 10;
        const endIndex = Math.min(startIndex + 10, wrongQuestions.length);
        const questionCount = endIndex - startIndex;
        
        tests.push({
            testNumber: i + 1,
            questionCount: questionCount,
            questions: wrongQuestions.slice(startIndex, endIndex)
        });
    }
    
    return `
        <div class="dashboard">
            ${renderNavbar('home')}
            
            <div class="dashboard-content">
                <div class="welcome-section">
                    <h1>🎓 Kişiselleştirilmiş Testler</h1>
                    <p>Yanlış yaptığın sorulardan oluşan özel testler - Hatalarından öğren!</p>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #FF572215 0%, #F0932415 100%); border: 2px solid #FF5722;">
                    <h2>📊 İstatistikler</h2>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
                        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 36px; font-weight: bold; color: #FF5722;">${wrongQuestions.length}</div>
                            <div style="color: #666; margin-top: 5px;">Toplam Yanlış Soru</div>
                        </div>
                        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 36px; font-weight: bold; color: #2196F3;">${testsCount}</div>
                            <div style="color: #666; margin-top: 5px;">Oluşan Test</div>
                        </div>
                        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">%${wrongQuestions.length > 0 ? Math.round((wrongQuestions.length / (state.userStats.totalQuestions || 1)) * 100) : 0}</div>
                            <div style="color: #666; margin-top: 5px;">Hata Oranı</div>
                        </div>
                    </div>
                </div>
                
                ${wrongQuestions.length === 0 ? `
                    <div class="card">
                        <div style="text-align: center; padding: 60px 20px; color: #999;">
                            <div style="font-size: 72px; margin-bottom: 20px;">✨</div>
                            <h2 style="color: #333; margin-bottom: 15px;">Henüz yanlış yapılan soru yok!</h2>
                            <p style="font-size: 16px; line-height: 1.6;">
                                Test çözmeye başladığında yanlış yaptığın sorular buraya eklenecek.<br>
                                Böylece hatalarından öğrenerek ilerleme kaydedebileceksin! 💪
                            </p>
                            <button onclick="changePage(event, 'tests')" class="btn-primary" style="margin-top: 30px; padding: 15px 40px; font-size: 16px;">
                                🚀 Testlere Başla
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="card">
                        <h2>📝 Kişiselleştirilmiş Testlerim</h2>
                        <p style="margin-bottom: 20px; color: #666;">
                            Her test yanlış yaptığın sorulardan oluşuyor. Testleri çözdükçe o sorular listeden çıkacak.
                        </p>
                        
                        <div class="level-buttons" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">
                            ${tests.map((test, index) => `
                                <button onclick="startPersonalizedTest(${test.testNumber})" class="btn-level" 
                                    style="background: linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0'][index % 6]} 0%, ${['#764ba2', '#f5576c', '#00f2fe', '#38f9d7', '#fee140', '#a044ff'][index % 6]} 100%); 
                                    color: white; border: none; padding: 25px; position: relative;">
                                    <div style="font-size: 32px; margin-bottom: 10px;">${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index] || `${index + 1}️⃣`}</div>
                                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">Kişiselleştirilmiş Test ${test.testNumber}</div>
                                    <div style="font-size: 14px; opacity: 0.9;">${test.questionCount} Soru</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="card" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea;">
                        <h2>💡 Nasıl Çalışır?</h2>
                        <ul style="color: #666; line-height: 2;">
                            <li>✅ Testlerde yanlış yaptığın sorular otomatik olarak kaydediliyor</li>
                            <li>📚 Her 10 yanlış soru bir kişiselleştirilmiş test oluşturuyor</li>
                            <li>🎯 Bu testleri çözerek hatalarından öğrenebilirsin</li>
                            <li>🔄 Aynı soruları tekrar görmek için testleri yeniden çözebilirsin</li>
                            <li>📊 İlerlemeni takip et ve zayıf noktalarını güçlendir</li>
                        </ul>
                    </div>
                    
                    <div class="card" style="background: linear-gradient(135deg, #EF535015 0%, #FF572215 100%); border: 2px solid #EF5350;">
                        <h2>🗑️ Yanlış Soruları Temizle</h2>
                        <p style="margin-bottom: 15px; color: #666;">
                            Tüm yanlış soruları temizlemek isterseniz aşağıdaki butona tıklayın. 
                            <strong>Bu işlem geri alınamaz!</strong>
                        </p>
                        <button onclick="clearWrongQuestions()" class="btn-secondary" 
                            style="background: #EF5350; color: white; width: 100%; padding: 15px; font-size: 16px;">
                            🗑️ Tüm Yanlış Soruları Temizle
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderDashboard() {
    // Backward compatibility - redirect to home
    return renderHome();
}

function renderQuiz() {
    if (!state.quizActive && !state.quizCompleted) {
        return renderHome();
    }
    
    const currentQ = state.currentTestQuestions[state.currentQuestion];
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    
    // Bu soru cevaplandı mı?
    const isAnswered = state.userAnswers[state.currentQuestion] !== null;
    const userAnswer = state.userAnswers[state.currentQuestion];
    const correctAnswer = currentQ.correctAnswer;
    const showFeedback = state.showImmediateFeedback && isAnswered;
    
    // Test tamamlandı mı?
    const allAnswered = state.userAnswers.every(answer => answer !== null);
    
    return `
        <div class="quiz-container">
            <div class="quiz-header">
                <div class="quiz-progress">Soru ${state.currentQuestion + 1} / ${state.currentTestQuestions.length}</div>
                ${!state.quizCompleted ? `<div class="timer">⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}</div>` : ''}
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button onclick="toggleImmediateFeedback()" class="btn-secondary" style="padding: 8px 16px; font-size: 14px;" title="${state.showImmediateFeedback ? 'Cevabı hemen göstermeyi kapat' : 'Cevabı hemen göstermeyi aç'}">
                        ${state.showImmediateFeedback ? '👁️ Cevabı Hemen Göster: AÇIK' : '👁️ Cevabı Hemen Göster: KAPALI'}
                    </button>
                    <button onclick="exitQuiz()" class="btn-exit-quiz" title="Ana Sayfaya Dön">✕ Çıkış</button>
                </div>
            </div>
            
            <!-- Soru Navigasyon Paneli -->
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                    ${state.currentTestQuestions.map((q, index) => {
                        const answered = state.userAnswers[index] !== null;
                        const isCurrent = index === state.currentQuestion;
                        
                        // Doğru/Yanlış kontrolü (sadece cevaplandıysa ve anında geri bildirim açıksa)
                        let isCorrect = false;
                        if (answered && state.showImmediateFeedback) {
                            isCorrect = q.correctAnswer === state.userAnswers[index];
                        }
                        
                        // Renk belirleme
                        let borderColor, bgColor, textColor;
                        if (isCurrent) {
                            borderColor = '#2196F3';
                            bgColor = '#2196F3';
                            textColor = 'white';
                        } else if (answered && state.showImmediateFeedback) {
                            // Anında geri bildirim açıksa doğru/yanlış renklendir
                            borderColor = isCorrect ? '#4CAF50' : '#EF5350';
                            bgColor = isCorrect ? '#4CAF50' : '#EF5350';
                            textColor = 'white';
                        } else if (answered) {
                            // Sadece cevaplandı (anında geri bildirim kapalı)
                            borderColor = '#4CAF50';
                            bgColor = '#4CAF50';
                            textColor = 'white';
                        } else {
                            // Cevaplanmadı
                            borderColor = '#E0E0E0';
                            bgColor = 'white';
                            textColor = '#666';
                        }
                        
                        return `
                            <button 
                                onclick="goToQuestion(${index})" 
                                style="
                                    width: 40px; 
                                    height: 40px; 
                                    border-radius: 8px; 
                                    border: 2px solid ${borderColor}; 
                                    background: ${bgColor}; 
                                    color: ${textColor}; 
                                    font-weight: bold; 
                                    cursor: pointer;
                                    transition: all 0.3s;
                                "
                                onmouseover="this.style.transform='scale(1.1)'"
                                onmouseout="this.style.transform='scale(1)'"
                                title="${answered && state.showImmediateFeedback ? (isCorrect ? 'Doğru' : 'Yanlış') : (answered ? 'Cevaplandı' : 'Cevaplanmadı')}"
                            >
                                ${index + 1}
                            </button>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 15px; text-align: center; font-size: 14px; color: #666;">
                    <span style="color: #4CAF50; font-weight: bold;">${state.userAnswers.filter(a => a !== null).length}</span> / ${state.currentTestQuestions.length} soru cevaplandı
                </div>
            </div>
            
            <div class="question-card">
                <h2>${currentQ.question}</h2>
                
                ${showFeedback ? `
                    <div style="padding: 15px; margin-bottom: 20px; border-radius: 10px; background: ${userAnswer === correctAnswer ? '#4CAF5015' : '#EF535015'}; border: 2px solid ${userAnswer === correctAnswer ? '#4CAF50' : '#EF5350'};">
                        <div style="font-size: 18px; font-weight: bold; color: ${userAnswer === correctAnswer ? '#4CAF50' : '#EF5350'};">
                            ${userAnswer === correctAnswer ? '✓ Doğru Cevap!' : '✗ Yanlış Cevap'}
                        </div>
                        ${userAnswer !== correctAnswer ? `<div style="margin-top: 5px; color: #666;">Doğru cevap: <strong>${String.fromCharCode(65 + correctAnswer)}</strong></div>` : ''}
                    </div>
                ` : ''}
                
                <div class="answers-grid">
                    ${currentQ.options.map((option, index) => {
                        let className = 'answer-option';
                        let style = '';
                        
                        if (state.selectedAnswer === index) {
                            className += ' selected';
                        }
                        
                        // Anında geri bildirim varsa ve cevaplandıysa
                        if (showFeedback) {
                            if (index === correctAnswer) {
                                style = 'border: 3px solid #4CAF50; background: #4CAF5015;';
                            } else if (index === userAnswer && userAnswer !== correctAnswer) {
                                style = 'border: 3px solid #EF5350; background: #EF535015;';
                            }
                        }
                        
                        const disabled = showFeedback ? 'disabled' : '';
                        
                        return `
                            <button 
                                class="${className}"
                                onclick="selectAnswer(${index})"
                                style="${style}"
                                ${disabled}
                            >
                                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                                <span class="option-text">${option}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 30px; flex-wrap: wrap;">
                    ${state.currentQuestion > 0 ? `
                        <button onclick="previousQuestion()" class="btn-secondary" style="flex: 1; min-width: 120px;">
                            ← Önceki Soru
                        </button>
                    ` : ''}
                    
                    ${!isAnswered ? `
                        <button onclick="submitAnswer()" class="btn-primary" style="flex: 2; min-width: 150px;">
                            Cevapla
                        </button>
                    ` : state.showImmediateFeedback && state.currentQuestion < state.currentTestQuestions.length - 1 ? `
                        <button onclick="nextQuestion()" class="btn-primary" style="flex: 2; min-width: 150px;">
                            Sonraki Soru →
                        </button>
                    ` : ''}
                    
                    ${state.currentQuestion < state.currentTestQuestions.length - 1 && !state.showImmediateFeedback && isAnswered ? `
                        <button onclick="nextQuestion()" class="btn-secondary" style="flex: 1; min-width: 120px;">
                            Sonraki Soru →
                        </button>
                    ` : ''}
                    
                    ${allAnswered && !state.quizCompleted ? `
                        <button onclick="saveAndShowResults()" class="btn-primary" style="flex: 2; min-width: 150px; background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);">
                            ✓ Testi Bitir ve Sonuçları Gör
                        </button>
                    ` : ''}
                    
                    ${state.quizCompleted ? `
                        <button onclick="saveAndShowResults()" class="btn-primary" style="flex: 2; min-width: 150px;">
                            Sonuçları Gör
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderQuizResult() {
    const percentage = Math.round((state.score / state.currentTestQuestions.length) * 100);
    const performance = getPerformanceMessage(percentage);
    
    // Eğer soru detayları gösteriliyorsa
    if (state.showQuestionDetails) {
        return `
            <div class="result-container">
                <div class="result-card" style="max-width: 900px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h2>📋 Soru Detayları</h2>
                        <button onclick="toggleQuestionDetails()" class="btn-secondary">
                            ← Özete Dön
                        </button>
                    </div>
                    <div style="display: grid; gap: 15px;">
                        ${state.currentTestQuestions.map((q, index) => {
                            const userAnswer = state.userAnswers[index];
                            const isCorrect = userAnswer === q.correctAnswer;
                            
                            return `
                                <div style="padding: 20px; background: ${isCorrect ? '#4CAF5015' : '#EF535015'}; border-left: 5px solid ${isCorrect ? '#4CAF50' : '#EF5350'}; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 700; color: #1a1a1a; font-size: 17px; line-height: 1.6; margin-bottom: 8px;">
                                                ${index + 1}. ${q.question}
                                            </div>
                                        </div>
                                        <div style="margin-left: 15px;">
                                            <span style="font-size: 28px;">${isCorrect ? '✓' : '✗'}</span>
                                        </div>
                                    </div>
                                    <div style="display: grid; gap: 10px; margin-top: 12px;">
                                        ${q.options.map((option, optIndex) => {
                                            const isUserAnswer = userAnswer === optIndex;
                                            const isCorrectAnswer = q.correctAnswer === optIndex;
                                            
                                            let bgColor = 'transparent';
                                            let borderColor = '#E0E0E0';
                                            let fontWeight = 'normal';
                                            
                                            if (isCorrectAnswer) {
                                                bgColor = '#4CAF5025';
                                                borderColor = '#4CAF50';
                                                fontWeight = 'bold';
                                            } else if (isUserAnswer && !isCorrect) {
                                                bgColor = '#EF535025';
                                                borderColor = '#EF5350';
                                                fontWeight = 'bold';
                                            }
                                            
                                            return `
                                                <div style="padding: 14px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 8px; font-weight: ${fontWeight}; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                                                    <span style="margin-right: 12px; color: #555; font-weight: bold;">${String.fromCharCode(65 + optIndex)})</span>
                                                    ${option}
                                                    ${isCorrectAnswer ? '<span style="margin-left: 12px; color: #4CAF50; font-weight: bold;">✓ Doğru Cevap</span>' : ''}
                                                    ${isUserAnswer && !isCorrect ? '<span style="margin-left: 12px; color: #EF5350; font-weight: bold;">✗ Senin Cevabın</span>' : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Varsayılan özet görünümü
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
                    <button onclick="toggleQuestionDetails()" class="btn-primary" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">📋 Soru Detayları</button>
                </div>
                
                <div class="result-actions" style="margin-top: 10px;">
                    <button onclick="changePage(null, 'home')" class="btn-secondary">🏠 Ana Sayfa</button>
                    <button onclick="changePage(null, 'stats')" class="btn-secondary">📊 İstatistikler</button>
                    <button onclick="startQuiz(null, null)" class="btn-secondary">🔄 Yeni Test</button>
                </div>
            </div>
        </div>
    `;
}

function renderProfile() {
    const createdDate = state.user.createdAt ? new Date(state.user.createdAt).toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }) : 'Bilinmiyor';
    
    return `
        <div class="dashboard">
            ${renderNavbar('profile')}
            
            <div class="dashboard-content">
                <div class="card profile-card">
                    <h1>Profil</h1>
                    
                    <div class="profile-info">
                        <div class="profile-avatar">👤</div>
                        <h2 id="displayName">${state.user.name}</h2>
                        <p>@${state.user.username}</p>
                        <p style="color: var(--text-muted); font-size: 14px; margin-top: 10px;">
                            📅 Kayıt Tarihi: ${createdDate}
                        </p>
                    </div>
                    
                    <div style="max-width: 400px; margin: 30px auto;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 14px; font-weight: 600;">
                                Ad Soyad
                            </label>
                            <input 
                                type="text" 
                                id="nameInput" 
                                value="${state.user.name}"
                                style="width: 100%; padding: 12px; background: rgba(0, 26, 51, 0.5); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 2px; color: var(--text-light); font-size: 16px;"
                                placeholder="Ad Soyad"
                            />
                        </div>
                        
                        <button onclick="updateUserName()" class="btn-primary" style="width: 100%; margin-bottom: 15px;">
                            💾 İsmi Güncelle
                        </button>
                        
                        <button onclick="confirmDeleteAccount()" class="btn-secondary" style="width: 100%; background: rgba(255, 0, 80, 0.2); color: var(--pink-accent); border: 1px solid var(--pink-accent);">
                            🗑️ Hesabı Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderNavbar(activePage) {
    return `
        <nav class="navbar" style="position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div class="logo">
                <img src="KİTKİTlogo.jpg" alt="KİTKİT Logo" width="60" height="60" style="border-radius: 50%; object-fit: cover; object-position: center 10%;">
                <span style="font-weight: 900; font-size: 28px; margin-left: 10px; background: linear-gradient(135deg, #2196F3 0%, #00BCD4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 0 20px rgba(33, 150, 243, 0.5), 0 0 40px rgba(33, 150, 243, 0.3), 0 0 60px rgba(33, 150, 243, 0.2); filter: drop-shadow(0 0 10px rgba(33, 150, 243, 0.6));">KİTKİT</span>
            </div>
            <ul class="nav-links">
                <li><a href="#" class="${activePage === 'home' ? 'active' : ''}" onclick="changePage(event, 'home')">🏠 Anasayfa</a></li>
                <li><a href="#" class="${activePage === 'stats' ? 'active' : ''}" onclick="changePage(event, 'stats')">📊 İstatistikler</a></li>
                <li><a href="#" class="${activePage === 'tests' ? 'active' : ''}" onclick="changePage(event, 'tests')">📝 Testler</a></li>
                <li><a href="#" class="${activePage === 'mock-exams' ? 'active' : ''}" onclick="changePage(event, 'mock-exams')">🎯 Denemeler</a></li>
                <li><a href="#" class="${activePage === 'profile' ? 'active' : ''}" onclick="changePage(event, 'profile')">👤 Profil</a></li>
            </ul>
            <button onclick="logout()" class="btn-logout">Çıkış Yap</button>
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
        case 'home':
            content = renderHome();
            break;
        case 'stats':
            content = renderStats();
            break;
        case 'tests':
            content = renderTests();
            break;
        case 'mock-exams':
            content = renderMockExams();
            break;
        case 'personalized-tests':
            content = renderPersonalizedTests();
            break;
        case 'dashboard':
            content = renderHome(); // Redirect old dashboard to home
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
            content = renderHome();
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
