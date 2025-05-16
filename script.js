// 预定义的用户账号和密码
const users = [
    { username: 'ym', password: 'ym' },
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

// 初始化应用
function initApp() {
    // 加载学习记录
    loadLearningHistory();
    // 初始化统计显示
    updateStatsDisplay();
    
    // 加载句子数据
    fetch('words.json')
        .then(response => {
            if (!response.ok) throw new Error('网络响应不正常');
            return response.json();
        })
        .then(data => {
            // 尝试从本地存储加载学习进度
            const savedProgress = localStorage.getItem('sentenceProgress');
            sentences = savedProgress ? JSON.parse(savedProgress) : data;
            
            // 如果没有保存的进度，使用原始数据
            if (!savedProgress) {
                saveToLocalStorage();
            }
            
            initSentenceTypeSelect();
        })
        .catch(error => {
            console.error('加载句子数据失败:', error);
            alert('加载句子数据失败: ' + error.message);
        });

    // 事件监听
    loginBtn.addEventListener('click', handleLogin);
    startLearningBtn.addEventListener('click', startLearning);
    nextBtn.addEventListener('click', handleNextButton);
    resetGroupBtn.addEventListener('click', handleResetGroup);
    clearHandwritingBtn.addEventListener('click', clearHandwriting);
    submitTranslationBtn.addEventListener('click', handleSubmitTranslation);
}

// 初始化手写板（修复版）
function initHandwritingPad() {
    const canvas = document.getElementById('handwritingCanvas');
    const container = canvas.parentElement;
    
    // 设置canvas的物理尺寸
    const resizeCanvas = () => {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = container.offsetWidth * ratio;
        canvas.height = container.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        
        // 保持canvas显示尺寸与容器一致
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    };
    
    // 初始化签名板
    signaturePad = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 3,
        penColor: "rgb(0, 0, 0)",
        backgroundColor: "rgb(255, 255, 255)",
        throttle: 16 // 优化绘制性能
    });

    // 首次调整大小
    resizeCanvas();
    
    // 处理窗口大小变化
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // 禁用页面滚动（仅针对触摸设备）
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 确保手写板可用
    setTimeout(() => {
        signaturePad.clear();
    }, 100);
}

// 清除手写内容
function clearHandwriting() {
    if (signaturePad) {
        signaturePad.clear();
    }
}

// 处理翻译提交
function handleSubmitTranslation() {
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
    // 只显示最近的10条记录
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
        
        learnedCountSpan = document.getElementById('learnedCount');
        unlearnedCountSpan = document.getElementById('unlearnedCount');
        totalCountSpan = document.getElementById('totalCount');
    }
}

// 处理登录
function handleLogin() {
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
    } else {
        alert('用户名或密码错误，请重试！');
        document.getElementById('password').value = '';
    }
}

// 开始学习
function startLearning() {
    currentGroup = sentenceTypeSelect.value;
    
    if (!currentGroup) {
        alert('请先选择一个句型');
        return;
    }

    // 检查该组是否已学完
    const groupSentences = sentences.filter(s => s.dalei === currentGroup);
    const unlearnedSentences = groupSentences.filter(s => s.state !== '已学');
    
    if (unlearnedSentences.length === 0) {
        alert('您已经学完本组所有句子！');
        return;
    }

    // 初始化手写板（确保在显示后初始化）
    initHandwritingPad();
    
    addHistoryRecord('开始学习');
    updateStats();
    showNextSentence();
    exerciseArea.style.display = 'block';
    navigation.style.display = 'block';
    learningHistorySection.style.display = 'block';
}

// 处理重置组别
function handleResetGroup() {
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
    
    totalCountSpan.textContent = groupSentences.length;
    learnedCountSpan.textContent = learnedSentences;
    unlearnedCountSpan.textContent = unlearnedSentences;
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
function handleNextButton() {
    markAsLearned();
    showNextSentence();
    updateStats();
}

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', initApp);