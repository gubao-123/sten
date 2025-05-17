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
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isWindows = navigator.platform.indexOf('Win') > -1;
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    return { isTouchDevice, isWindows, isChrome };
}

// 初始化应用
function initApp() {
    const { isTouchDevice, isWindows, isChrome } = detectDeviceType();
    
    // 为Windows触摸设备添加特殊处理
    if (isWindows && isTouchDevice) {
        document.body.classList.add('windows-touch-device');
        console.log('运行在Windows触摸设备上');
        
        // 针对Chrome浏览器的特殊处理
        if (isChrome) {
            document.body.classList.add('windows-chrome-touch');
            console.log('运行在Chrome浏览器上');
        }
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

    // 增强的事件监听 - 针对智能白板优化
    setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
    // 使用pointer事件代替click提高触摸设备兼容性
    const events = ['pointerdown', 'click']; // 同时监听两种事件
    
    events.forEach(eventType => {
        loginBtn.addEventListener(eventType, handleLogin, { passive: false });
        startLearningBtn.addEventListener(eventType, startLearning, { passive: false });
        nextBtn.addEventListener(eventType, handleNextButton, { passive: false });
        resetGroupBtn.addEventListener(eventType, handleResetGroup, { passive: false });
        clearHandwritingBtn.addEventListener(eventType, clearHandwriting, { passive: false });
        submitTranslationBtn.addEventListener(eventType, handleSubmitTranslation, { passive: false });
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
            minWidth: 1,
            maxWidth: 3,
            penColor: "rgb(0, 0, 0)",
            backgroundColor: "rgb(255, 255, 255)",
            throttle: 16
        });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 增强的触摸支持
        if ('ontouchstart' in window) {
            // 防止页面滚动
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            
            // 更可靠的触摸事件处理
            const handleTouch = (e) => {
                e.preventDefault();
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

// 清除手写内容
function clearHandwriting() {
    if (signaturePad) {
        signaturePad.clear();
    }
}

// 处理翻译提交
function handleSubmitTranslation(e) {
    if (e) e.preventDefault();
    if (!signaturePad || signaturePad.isEmpty()) {
        alert('请先手写输入您的翻译');
        return;
    }
    showAnswer();
}

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('sentenceProgress', JSON.stringify(sentences));
    localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
}

// 加载学习记录
function loadLearningHistory() {
    const savedHistory = localStorage.getItem('learningHistory');
    learningHistory = savedHistory ? JSON.parse(savedHistory) : [];
    updateHistoryDisplay();
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

// 添加学习记录
function addHistoryRecord(action) {
    if (!currentGroup) return;
    
    const now = new Date();
    const record = {
        date: now.toLocaleString(),
        group: currentGroup,
        action: action
    };
    
    learningHistory.push(record);
    saveToLocalStorage();
    updateHistoryDisplay();
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

// 处理登录
function handleLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('请输入用户名和密码！');
        return;
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        loginSection.style.display = 'none';
        controlPanel.style.display = 'block';
        updateStatsDisplay();
        
        // 添加触觉反馈（如果设备支持）
        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    } else {
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