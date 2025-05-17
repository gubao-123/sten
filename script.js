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

// 初始化应用
function initApp() {
    const { isLargeTouchDevice, isWindows } = detectDeviceType();
    
    if (isLargeTouchDevice) {
        document.body.classList.add('large-touch-device');
        console.log('运行在大尺寸触摸设备上');
        
        // 针对65英寸白板的特殊初始化
        initForLargeTouchScreen();
    }

    loadLearningHistory();
    updateStatsDisplay();
    
    // 加载句子数据
    loadSentencesData().then(() => {
        initSentenceTypeSelect();
    }).catch(error => {
        console.error('初始化失败:', error);
        alert('初始化失败: ' + error.message);
    });

    // 增强的事件监听
    setupEventListeners();
}

// 大尺寸触摸屏特殊初始化
function initForLargeTouchScreen() {
    // 调整视口缩放
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimum-scale=1.0';
    document.head.appendChild(viewportMeta);
    
    // 防止双击缩放
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// 设置事件监听器
function setupEventListeners() {
    // 使用pointer和touch事件组合
    const addEnhancedListener = (element, event, handler) => {
        element.addEventListener(event, handler, { passive: false });
        element.addEventListener(event.replace('mouse', 'touch'), handler, { passive: false });
    };
    
    // 登录按钮特殊处理
    loginBtn.addEventListener('pointerdown', handleLogin, { passive: false });
    loginBtn.addEventListener('touchstart', handleLogin, { passive: false });
    loginBtn.addEventListener('click', handleLogin);
    
    // 其他按钮
    const buttons = [
        startLearningBtn, nextBtn, resetGroupBtn, 
        clearHandwritingBtn, submitTranslationBtn
    ];
    
    buttons.forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.target.click();
        }, { passive: false });
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.target.click();
        }, { passive: false });
    });

    // 输入框回车键支持
    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin(e);
    });
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin(e);
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

// 处理登录
function handleLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    
    console.log('登录按钮被点击');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('请输入用户名和密码！');
        return;
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        console.log('登录成功');
        loginSection.style.display = 'none';
        controlPanel.style.display = 'block';
        updateStatsDisplay();
        
        // 强制重绘以解决某些设备的渲染问题
        setTimeout(() => {
            document.body.style.display = 'none';
            document.body.offsetHeight; // 触发重绘
            document.body.style.display = '';
        }, 50);
    } else {
        console.log('登录失败');
        alert('用户名或密码错误，请重试！');
        document.getElementById('password').value = '';
    }
}

// 开始学习
function startLearning(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    currentGroup = sentenceTypeSelect.value;
    
    if (!currentGroup) {
        alert('请先选择一个句型');
        return;
    }

    const groupSentences = sentences.filter(s => s.dalei === currentGroup);
    const unlearnedSentences = groupSentences.filter(s => s.state !== '已学');
    
    if (unlearnedSentences.length === 0) {
        alert('您已经学完本组所有句子！');
        return;
    }

    exerciseArea.style.display = 'block';
    navigation.style.display = 'block';
    learningHistorySection.style.display = 'block';
    
    initHandwritingPad();
    
    addHistoryRecord('开始学习');
    updateStats();
    showNextSentence();
}

// 处理重置组别
function handleResetGroup(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (!currentGroup) {
        alert('请先选择一个句型');
        return;
    }

    if (confirm(`确定要重置"${currentGroup}"组的学习进度吗？所有句子将标记为未学。`)) {
        resetGroupProgress(currentGroup);
        addHistoryRecord('重置学习进度');
    }
}

// 重置指定组的学习进度
function resetGroupProgress(group) {
    sentences.forEach(sentence => {
        if (sentence.dalei === group) {
            sentence.state = '未学';
        }
    });
    
    saveToLocalStorage();
    alert(`"${group}"组的学习进度已重置！`);
    updateStats();
}

// 显示下一个句子
function showNextSentence() {
    answerRow.style.display = 'none';
    clearHandwriting();
    
    const unlearnedSentences = getUnlearnedSentences();

    if (unlearnedSentences.length === 0) {
        addHistoryRecord('完成学习');
        alert('恭喜！您已经学完了本组所有句子！');
        exerciseArea.style.display = 'none';
        navigation.style.display = 'none';
        return;
    }

    const randomIndex = Math.floor(Math.random() * unlearnedSentences.length);
    currentSentence = unlearnedSentences[randomIndex];
    chineseSentence.textContent = currentSentence.chinese;
}

// 获取未学习句子
function getUnlearnedSentences() {
    return sentences.filter(s => 
        s.dalei === currentGroup && s.state !== '已学'
    );
}

// 显示答案
function showAnswer() {
    englishAnswer.textContent = currentSentence.english;
    answerRow.style.display = 'flex';
}

// 更新学习统计
function updateStats() {
    if (!currentGroup) return;
    
    const groupSentences = sentences.filter(s => s.dalei === currentGroup);
    const learnedSentences = groupSentences.filter(s => s.state === '已学').length;
    const unlearnedSentences = groupSentences.length - learnedSentences;
    
    document.getElementById('totalCount').textContent = groupSentences.length;
    document.getElementById('learnedCount').textContent = learnedSentences;
    document.getElementById('unlearnedCount').textContent = unlearnedSentences;
}

// 标记当前句子为已学
function markAsLearned() {
    if (!currentSentence) return;

    const index = sentences.findIndex(s => s.id === currentSentence.id);
    if (index !== -1) {
        sentences[index].state = '已学';
        saveToLocalStorage();
        addHistoryRecord(`学习了: ${currentSentence.chinese}`);
    }
}

// 处理下一个按钮
function handleNextButton(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    markAsLearned();
    showNextSentence();
    updateStats();
}

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', initApp);
