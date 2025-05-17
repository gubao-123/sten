// 预定义的用户账号和密码
const users = [
    { username: 'user1', password: 'pass1' },
    { username: 'user2', password: 'pass2' },
    { username: 'user3', password: 'pass3' },
    { username: 'user4', password: 'pass4' },
    { username: 'user5', password: 'pass5' },
    { username: 'user6', password: 'pass6' },
    { username: 'user7', password: 'pass7' },
    { username: 'user8', password: 'pass8' },
    { username: 'user9', password: 'pass9' },
    { username: 'user10', password: 'pass10' }
];

// 句子数据库和学习记录
let sentences = [];
let currentSentence = null;
let currentGroup = '';
let learningHistory = [];
let signaturePad = null;
let isInitialized = false;

// DOM元素
const loginSection = document.getElementById('loginSection');
const controlPanel = document.getElementById('controlPanel');
const exerciseArea = document.getElementById('exerciseArea');
const navigation = document.getElementById('navigation');
const learningHistorySection = document.getElementById('learningHistory');
const loginBtn = document.getElementById('loginBtn');
const startLearningBtn = document.getElementById('startLearningBtn');
const nextBtn = document.getElementById('nextBtn');
const resetGroupBtn = document.getElementById('resetGroupBtn');
const sentenceTypeSelect = document.getElementById('sentenceType');
const chineseSentence = document.getElementById('chineseSentence');
const englishAnswer = document.getElementById('englishAnswer');
const answerRow = document.getElementById('answerRow');
const historyList = document.getElementById('historyList');
const handwritingCanvas = document.getElementById('handwritingCanvas');
const clearHandwritingBtn = document.getElementById('clearHandwriting');
const submitTranslationBtn = document.getElementById('submitTranslation');

// 检测设备类型
function detectDeviceType() {
    const isLargeTouchDevice = window.innerWidth >= 1920 && 'ontouchstart' in window;
    const isWindows = navigator.platform.indexOf('Win') > -1;
    return { isLargeTouchDevice, isWindows };
}

// 大尺寸触摸屏特殊初始化
function initForLargeTouchScreen() {
    // 调整视口设置
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimum-scale=1.0';
    document.head.appendChild(viewportMeta);
    
    // 防止手势操作干扰
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
    
    // 防止双击缩放
    let lastTouchTime = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchTime < 300) {
            e.preventDefault();
        }
        lastTouchTime = now;
    }, { passive: false });
}

// 初始化应用
function initApp() {
    const { isLargeTouchDevice } = detectDeviceType();
    
    if (isLargeTouchDevice) {
        document.body.classList.add('large-touch-device');
        console.log('检测到大尺寸触摸设备，启用特殊优化');
        initForLargeTouchScreen();
    }

    // 加载学习记录和句子数据
    Promise.all([loadLearningHistory(), loadSentencesData()])
        .then(() => {
            initSentenceTypeSelect();
            updateStatsDisplay();
            setupEventListeners();
        })
        .catch(error => {
            console.error('初始化失败:', error);
            alert('系统初始化失败: ' + error.message);
        });
}

// 设置事件监听器
function setupEventListeners() {
    // 登录按钮特殊处理 - 三种事件类型确保兼容性
    ['click', 'pointerdown', 'touchstart'].forEach(eventType => {
        loginBtn.addEventListener(eventType, handleLogin, { 
            passive: false,
            capture: true 
        });
    });

    // 其他按钮事件
    const buttons = [
        startLearningBtn, nextBtn, resetGroupBtn,
        clearHandwritingBtn, submitTranslationBtn
    ];
    
    buttons.forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.target.dispatchEvent(new MouseEvent('click'));
        }, { passive: false });
        
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.target.dispatchEvent(new MouseEvent('click'));
        }, { passive: false });
    });

    // 输入框回车键支持
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    usernameInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin(e));
    passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin(e));
    
    // 输入框获得焦点时自动弹出虚拟键盘
    if ('ontouchstart' in window) {
        usernameInput.addEventListener('focus', () => {
            setTimeout(() => usernameInput.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        passwordInput.addEventListener('focus', () => {
            setTimeout(() => passwordInput.scrollIntoView({ behavior: 'smooth' }), 100);
        });
    }
}

// 处理登录
function handleLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    
    console.log('登录事件触发，类型:', e?.type || '直接调用');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showFeedback('请输入用户名和密码！', 'error');
        return;
    }

    // 模拟按钮按下效果
    loginBtn.classList.add('button-active');
    setTimeout(() => loginBtn.classList.remove('button-active'), 200);

    // 查找用户
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        showFeedback('登录成功！', 'success');
        setTimeout(() => {
            loginSection.style.display = 'none';
            controlPanel.style.display = 'block';
            updateStatsDisplay();
            
            // 强制布局重绘
            void loginSection.offsetHeight;
        }, 500);
    } else {
        showFeedback('用户名或密码错误', 'error');
        document.getElementById('password').value = '';
    }
}

// 显示反馈信息
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

// 加载学习记录
function loadLearningHistory() {
    return new Promise((resolve) => {
        const savedHistory = localStorage.getItem('learningHistory');
        learningHistory = savedHistory ? JSON.parse(savedHistory) : [];
        updateHistoryDisplay();
        resolve();
    });
}

// 加载句子数据
function loadSentencesData() {
    return fetch('words.json')
        .then(response => {
            if (!response.ok) throw new Error('网络响应不正常');
            return response.json();
        })
        .then(data => {
            const savedProgress = localStorage.getItem('sentenceProgress');
            if (savedProgress) {
                const savedData = JSON.parse(savedProgress);
                sentences = data.map(item => {
                    const savedItem = savedData.find(s => s.id === item.id);
                    return savedItem ? {...item, state: savedItem.state} : item;
                });
            } else {
                sentences = data;
            }
            saveToLocalStorage();
            return sentences;
        });
}

// 初始化句型选择下拉框
function initSentenceTypeSelect() {
    sentenceTypeSelect.innerHTML = '<option value="">--请选择句型--</option>';
    const groups = [...new Set(sentences.map(s => s.dalei))];
    
    groups.forEach(group => {
        if (group) {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            sentenceTypeSelect.appendChild(option);
        }
    });
}

// 更新统计显示
function updateStatsDisplay() {
    const statsContainer = document.querySelector('.stats');
    if (statsContainer) {
        statsContainer.innerHTML = '学习统计: 已学<span id="learnedCount">0</span>/未学<span id="unlearnedCount">0</span>/总数<span id="totalCount">0</span>';
    }
}

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('sentenceProgress', JSON.stringify(sentences));
    localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
}

// 更新学习记录显示
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    const recentHistory = learningHistory.slice(-10).reverse();
    
    recentHistory.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = `${record.date} - ${record.group}: ${record.action}`;
        historyList.appendChild(item);
    });
}

// 初始化手写板
function initHandwritingPad() {
    if (isInitialized) return;
    
    const canvas = document.getElementById('handwritingCanvas');
    const container = canvas.parentElement;
    
    setTimeout(() => {
        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = container.offsetWidth * ratio;
            canvas.height = container.offsetHeight * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        };
        
        signaturePad = new SignaturePad(canvas, {
            minWidth: 2,
            maxWidth: 6,
            penColor: "rgb(0, 0, 0)",
            backgroundColor: "rgb(255, 255, 255)",
            throttle: 16
        });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 增强的触摸支持
        if ('ontouchstart' in window) {
            const handleTouch = (e) => {
                if (e.cancelable) e.preventDefault();
                const touch = e.touches[0] || e.changedTouches[0];
                const mouseEventType = {
                    touchstart: 'mousedown',
                    touchmove: 'mousemove',
                    touchend: 'mouseup'
                }[e.type];
                
                if (mouseEventType) {
                    const mouseEvent = new MouseEvent(mouseEventType, {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        bubbles: true,
                        cancelable: true
                    });
                    canvas.dispatchEvent(mouseEvent);
                }
            };

            canvas.addEventListener('touchstart', handleTouch, { passive: false });
            canvas.addEventListener('touchmove', handleTouch, { passive: false });
            canvas.addEventListener('touchend', handleTouch, { passive: false });
        }
        
        isInitialized = true;
    }, 100);
}

// 其他原有功能函数保持不变...
// (showNextSentence, getUnlearnedSentences, showAnswer, markAsLearned等)

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', initApp);
