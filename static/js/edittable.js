/**
 * 编辑考核表的功能
 */

// 全局变量存储考核表数据
let evaluationTableData = null;

document.addEventListener("DOMContentLoaded", async function () {
    // 获取URL中的version参数
    const urlParams = new URLSearchParams(window.location.search);
    const version = urlParams.get('version');

    if (!version) {
        alert('缺少必要的版本参数');
        window.location.href = "/table_index";
        return;
    }

    console.log(`正在加载版本 ${version} 的考核表...`);

    // 初始化年份和季度选择器
    initializeYearQuarterSelectors();
    console.log('年份和季度选择器初始化完成');
    // 加载部门数据
    await loadDepartments();
    console.log('部门数据加载完成');
    // 加载考核表数据
    loadEvaluationTable(version);
    console.log('考核表数据加载完成');
    // 设置取消按钮事件
    document.getElementById('backButton')?.addEventListener('click', function () {
        if (confirm('确定要取消编辑吗？所有未保存的更改将丢失。')) {
            window.location.href = "/table_index";
        }
    });
});

// 初始化年份和季度选择器
function initializeYearQuarterSelectors() {
    const yearSelect = document.getElementById('year-select');
    const quarterSelect = document.getElementById('quarter-select');

    const currentYear = new Date().getFullYear();
    const numberOfYears = 5; // 生成未来 5 年的选项

    // 动态生成年份选项
    for (let year = currentYear - 1; year < currentYear + numberOfYears; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // 生成季度选项
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    quarters.forEach(quarter => {
        const option = document.createElement('option');
        option.value = quarter;
        option.textContent = quarter;
        quarterSelect.appendChild(option);
    });
}

// 获取Token
function getToken() {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

// 加载部门数据
async function loadDepartments() {
    // 显示加载状态
    const departmentSelect = document.getElementById('department-select');
    departmentSelect.innerHTML = '';
    departmentSelect.disabled = true;
    const token = getToken();

    try {
        // 发起AJAX请求获取部门数据
        const response = await fetch('/showalldepartment', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error('网络响应不正常，状态码: ' + response.status);
        }

        // 获取响应数据
        const data = await response.json();

        // 清空下拉框并添加默认提示
        departmentSelect.innerHTML = '<option value="">请选择部门</option>';

        // 检查返回的数据格式并填充下拉框
        if (Array.isArray(data)) {
            // 假设返回的是数组格式
            data.forEach(department => {
                const option = document.createElement('option');
                option.value = department.id;
                option.textContent = department.name;
                departmentSelect.appendChild(option);
            });
        } else if (data.data && Array.isArray(data.data)) {
            // 假设返回的是 {data: [...]} 格式
            data.data.forEach(department => {
                const option = document.createElement('option');
                option.value = department.id;
                option.textContent = department.name;
                departmentSelect.appendChild(option);
            });
        } else {
            throw new Error('返回的数据格式不正确');
        }

        // 启用下拉框
        departmentSelect.disabled = false;

        // 如果下拉框为空，显示提示信息
        if (departmentSelect.options.length <= 1) {
            departmentSelect.innerHTML = '<option value="">暂无部门数据</option>';
        }
    } catch (error) {
        console.error('获取部门数据失败:', error);
        departmentSelect.innerHTML = '<option value="">加载失败，请重试</option>';
        departmentSelect.disabled = false;

        // 可选：显示错误提示
        alert('获取部门数据失败: ' + error.message);
    }
}


// 加载考核表数据
function loadEvaluationTable(version) {
    const token = getToken();

    // 显示加载状态
    showLoadingIndicator();

    // 发起请求获取考核表数据
    fetch(`/viewtable`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({version: version})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应不正常，状态码: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        // 存储数据到全局变量
        evaluationTableData = data;

        // 填充表单数据
        fillEvaluationForm(data);

        // 隐藏加载状态
        hideLoadingIndicator();
    })
    .catch(error => {
        console.error('获取考核表数据失败:', error);
        alert('获取考核表数据失败: ' + error.message);
        hideLoadingIndicator();
    });
}

// 显示加载指示器
function showLoadingIndicator() {
    // 可以在这里实现加载中的UI显示
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '0';
    loadingIndicator.style.left = '0';
    loadingIndicator.style.width = '100%';
    loadingIndicator.style.height = '100%';
    loadingIndicator.style.background = 'rgba(255, 255, 255, 0.8)';
    loadingIndicator.style.display = 'flex';
    loadingIndicator.style.justifyContent = 'center';
    loadingIndicator.style.alignItems = 'center';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = '<div>加载中，请稍候...</div>';
    document.body.appendChild(loadingIndicator);
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// 填充考核表表单
function fillEvaluationForm(data) {
    console.log("填充考核表表单:", evaluationTableData);
    // 提取标题中的部门、年份和季度
    if (data.name) {
        console.log("提取标题中的部门、年份和季度:", data.name);
        // 新的解析逻辑:
        // 季度是后两个字符
        const quarter = data.name.substring(data.name.length - 2);
        // 年份是季度前的4个字符
        const year = data.name.substring(data.name.length - 6, data.name.length - 2);
        // 部门名称是剩余的前部分（不包括"年 "）
        const departmentName = data.name.substring(0, data.name.length - 6);

        console.log("提取的部门:", departmentName);
        console.log("提取的年份:", year);
        console.log("提取的季度:", quarter);

        // 设置年份和季度
        document.getElementById('year-select').value = year;
        document.getElementById('quarter-select').value = quarter;

        // 设置部门
        const departmentSelect = document.getElementById('department-select');
        console.log("部门下拉框:", departmentSelect.options);
        for (let i = 0; i < departmentSelect.options.length; i++) {
            console.log("部门选项:", departmentSelect.options[i].text);
            if (departmentSelect.options[i].text == departmentName) {
                console.log("找到匹配的部门选项");
                departmentSelect.selectedIndex = i;
                break;
            }
        }
    }

    // 设置截止日期（evaluationPeriod）
    // 假设有一个日期输入框

    // 填充描述数据
    fillDescriptionData(data.description);

    // 填充评级数据
    fillGradesData(data.grades);

    // 填充考勤规则
    fillAttendanceRules(data.attendanceRules);
}

// 填充描述数据
function fillDescriptionData(description) {
    // 处理专业职能
    const dimensionSections = document.querySelectorAll('.dimension-section');

    description = JSON.parse(description)
    if (description["专业职能"]) {
        console.log("专业职能:", description["专业职能"]);
        const professionalSection = dimensionSections[0];
        console.log("professionalSection:", professionalSection);
        if (professionalSection) {
            // 设置分数
            const scoreDisplay = professionalSection.querySelector('.dimension-score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = description["专业职能"]["分数"] || 0;
            }

            // 设置评分方式
            const modeSelect = professionalSection.querySelector('.evaluation-mode-select');
            if (modeSelect) {
                modeSelect.value = description["专业职能"]["评分方式"] === "打分" ? "scoring" : "rating";
            }

            // 清空现有评分项
            const criteriaList = professionalSection.querySelector('.criteria-list');
            if (criteriaList) {
                const addButton = criteriaList.querySelector('.add-criteria');
                criteriaList.innerHTML = '';
                if (addButton) {
                    criteriaList.appendChild(addButton);
                }

                // 添加评分项
                if (description["专业职能"]["评分项"] && Array.isArray(description["专业职能"]["评分项"])) {
                    description["专业职能"]["评分项"].forEach(item => {
                        const criteriaName = Object.keys(item)[0];
                        const criteriaData = item[criteriaName];
                        addCriteriaItem(criteriaList, criteriaName, criteriaData, description["专业职能"]["评分方式"] === "打分" ? "scoring" : "rating");
                    });
                }
            }
        }
    }

    // 处理通用职能
    if (description["通用职能"]) {
        const genericSection = dimensionSections[1]
        if (genericSection) {
            // 设置分数
            const scoreDisplay = genericSection.querySelector('.dimension-score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = description["通用职能"]["分数"] || 0;
            }

            // 清空现有评分项
            const criteriaList = genericSection.querySelector('.criteria-list');
            if (criteriaList) {
                const addButton = criteriaList.querySelector('.add-criteria');
                criteriaList.innerHTML = '';
                if (addButton) {
                    criteriaList.appendChild(addButton);
                }

                // 添加评分项
                if (description["通用职能"]["评分项"] && Array.isArray(description["通用职能"]["评分项"])) {
                    description["通用职能"]["评分项"].forEach(item => {
                        const criteriaName = Object.keys(item)[0];
                        const criteriaData = item[criteriaName];
                        addCriteriaItem(criteriaList, criteriaName, criteriaData, "rating"); // 通用职能默认为评级模式
                    });
                }
            }
        }
    }

    // 处理产品表现
    if (description["产品表现"]) {
        const productSection = dimensionSections[2]
        if (productSection) {
            // 设置分数
            const scoreDisplay = productSection.querySelector('.dimension-score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = description["产品表现"]["分数"] || 0;
            }
        }
    }
}

// 向列表中添加评分项
function addCriteriaItem(criteriaList, name, data, mode) {
    // 创建新的评分项
    const newItem = document.createElement("div");
    newItem.classList.add("criteria-item", "cursor-hover");

    // 根据模式设置不同的HTML内容
    if (mode === 'rating') {
        newItem.innerHTML = `
            <span class="criteria-text pointer-hover" title="点击编辑">${name}</span>
            <span class="remove pointer-hover" title="删除此评分项">✖</span>
            <div class="criteria-detail-container">
                <textarea class="criteria-detail" placeholder="请输入详细信息..." rows="2">${data.描述 || ''}</textarea>
                <div class="more-detail-container">
                    <span class="more-detail-icon pointer-hover ${data.详细 ? 'has-content' : ''}" title="更多详细说明" data-content="${data.详细 || ''}" style="${data.详细 ? 'color: #2196F3' : ''}">
                        <i class="fas fa-info-circle"></i>📝
                    </span>
                    <div class="bubble-editor" style="display: none;">
                        <div class="bubble-arrow arrow-left"></div>
                        <div class="bubble-editor-header">
                            <span>详细说明</span>
                            <span class="close-bubble pointer-hover">✖</span>
                        </div>
                        <textarea class="more-detail-content" placeholder="请输入更多详细说明..." rows="8">${data.详细 || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    } else {
        newItem.innerHTML = `
            <span class="criteria-text pointer-hover" title="点击编辑">${name}</span>
            <span class="score-value-container">
                <span class="score-value-display" title="点击编辑">${data.分数 || 0}</span>分
            </span>
            <span class="remove pointer-hover" title="删除此评分项">✖</span>
            <div class="criteria-detail-container">
                <textarea class="criteria-detail" placeholder="请输入详细信息..." rows="2">${data.描述 || ''}</textarea>
                <div class="more-detail-container">
                    <span class="more-detail-icon pointer-hover ${data.详细 ? 'has-content' : ''}" title="更多详细说明" data-content="${data.详细 || ''}" style="${data.详细 ? 'color: #2196F3' : ''}">
                        <i class="fas fa-info-circle"></i>📝
                    </span>
                    <div class="bubble-editor" style="display: none;">
                        <div class="bubble-arrow arrow-left"></div>
                        <div class="bubble-editor-header">
                            <span>详细说明</span>
                            <span class="close-bubble pointer-hover">✖</span>
                        </div>
                        <textarea class="more-detail-content" placeholder="请输入更多详细说明..." rows="8">${data.详细 || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    // 在添加按钮前插入新评分项
    const addButton = criteriaList.querySelector('.add-criteria');
    criteriaList.insertBefore(newItem, addButton);

    // 给评分项文本添加点击编辑功能
    const criteriaText = newItem.querySelector('.criteria-text');
    criteriaText.addEventListener('click', function () {
        this.contentEditable = true;
        this.focus(); // 让元素进入编辑模式

        // 监听键盘事件
        this.addEventListener(
            'keydown',
            function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    // 按下 Enter 结束编辑
                    e.preventDefault();
                    this.blur();
                }
                if (e.key === 'Enter' && e.shiftKey) {
                    // Shift + Enter 插入换行
                    e.preventDefault();
                    document.execCommand('insertLineBreak'); // 兼容性较好
                }
            },
            { once: true }
        );

        // 失去焦点时停止编辑
        this.addEventListener(
            'blur',
            function () {
                this.contentEditable = false;
            },
            { once: true }
        );
    });

    const detailContainer = newItem.querySelector('.criteria-detail-container');
    detailContainer.style.display = 'block';

    // 给删除按钮添加功能 - 删除整个评分项
    const removeBtn = newItem.querySelector('.remove');
    removeBtn.addEventListener('click', function() {
        // 直接删除整个评分项元素
        newItem.remove();
    });

    // 根据模式添加不同的编辑功能
    if (mode === 'scoring') {
        // 打分模式：给分值添加点击编辑功能
        const scoreValueDisplay = newItem.querySelector('.score-value-display');
        if (scoreValueDisplay) {
            scoreValueDisplay.addEventListener('click', function() {
                this.contentEditable = true;
                this.focus();

                // 选中所有文本
                const range = document.createRange();
                range.selectNodeContents(this);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                // 失去焦点时停止编辑并格式化
                this.addEventListener('blur', function() {
                    this.contentEditable = false;
                    // 确保是有效的数字
                    let value = parseInt(this.textContent) || 0;
                    if (value < 0) value = 0;
                    this.textContent = value;
                }, { once: true });

                // 按下回车键也停止编辑
                this.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.blur();
                    }
                });
            });
        }
    }

    // 添加气泡编辑器的功能
    setupBubbleEditor(newItem);
}

// 填充评级数据
function fillGradesData(grades) {
    if (!grades || !Array.isArray(grades)) return;

    const gradeElements = document.querySelectorAll('.grade-pair');
    grades.forEach((grade, index) => {
        if (index < gradeElements.length) {
            const inputElement = gradeElements[index].querySelector('.grade-input');
            if (inputElement) {
                inputElement.value = grade.value || '';
            }
        }
    });
}

// 填充考勤规则
function fillAttendanceRules(rules) {
    if (!rules || !Array.isArray(rules)) return;

    const ruleElements = document.querySelectorAll('.score-item');
    rules.forEach((rule, index) => {
        if (index < ruleElements.length) {
            const inputElement = ruleElements[index].querySelector('.score-input');
            if (inputElement) {
                inputElement.value = rule.score || '';
            }
        }
    });
}

// 设置气泡编辑器功能
function setupBubbleEditor(criteriaItem) {
    const moreDetailIcon = criteriaItem.querySelector('.more-detail-icon');
    const bubbleEditor = criteriaItem.querySelector('.bubble-editor');
    const closeBubble = criteriaItem.querySelector('.close-bubble');
    const moreDetailContent = criteriaItem.querySelector('.more-detail-content');

    // 点击图标显示气泡编辑器
    moreDetailIcon.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡

        // 获取图标的位置信息
        const rect = moreDetailIcon.getBoundingClientRect();

        // 计算相对于父元素的位置
        const criteriaRect = criteriaItem.getBoundingClientRect();

        // 设置位置 - 简化定位逻辑
        // 1. 垂直位置：与图标顶部对齐
        const topPosition = rect.top - criteriaRect.top - 187;

        // 2. 水平位置：图标右侧加上偏移量
        const leftPosition = (rect.right - criteriaRect.left + 20);

        // 应用位置
        bubbleEditor.style.position = 'absolute';
        bubbleEditor.style.top = topPosition + 'px';
        bubbleEditor.style.left = leftPosition + 'px';
        bubbleEditor.style.zIndex = '1000';
        bubbleEditor.style.display = 'block';

        // 设置文本框样式并确保内边距
        moreDetailContent.style.width = 'calc(100% - 30px)';
        moreDetailContent.style.margin = '15px';
        moreDetailContent.style.marginBottom = '25px';
        moreDetailContent.style.resize = 'vertical';
        moreDetailContent.style.minHeight = '150px';
        moreDetailContent.focus();

        // 监听文本框尺寸变化，同步调整气泡编辑器大小
        const resizeObserver = new ResizeObserver(() => {
            const textAreaHeight = moreDetailContent.offsetHeight;
            const textAreaWidth = moreDetailContent.offsetWidth;
            const headerHeight = bubbleEditor.querySelector('.bubble-editor-header').offsetHeight;
            const horizontalPadding = 30;
            const verticalPadding = 30 + headerHeight + 25;

            // 设置气泡编辑器的尺寸，确保同步缩放
            bubbleEditor.style.width = (textAreaWidth + horizontalPadding) + 'px';
            bubbleEditor.style.height = (textAreaHeight + verticalPadding) + 'px';
        });

        // 手动触发一次调整以确保初始大小正确
        setTimeout(() => {
            resizeObserver.observe(moreDetailContent);

            // 手动触发一次调整
            const textAreaHeight = moreDetailContent.offsetHeight;
            const textAreaWidth = moreDetailContent.offsetWidth;
            const headerHeight = bubbleEditor.querySelector('.bubble-editor-header').offsetHeight;
            const horizontalPadding = 30;
            const verticalPadding = 30 + headerHeight + 25;

            bubbleEditor.style.width = (textAreaWidth + horizontalPadding) + 'px';
            bubbleEditor.style.height = (textAreaHeight + verticalPadding) + 'px';

            // 确保在视窗内
            const bubbleRect = bubbleEditor.getBoundingClientRect();
            const arrow = bubbleEditor.querySelector('.bubble-arrow');

            // 如果超出右边界
            if (bubbleRect.right > window.innerWidth - 20) {
                // 尝试放在左侧
                bubbleEditor.style.left = 'auto';
                bubbleEditor.style.right = (window.innerWidth - rect.left + 15) + 'px';

                // 调整箭头
                if (arrow) {
                    arrow.classList.remove('arrow-left');
                    arrow.classList.add('arrow-right');
                }
            }

            // 如果超出底部
            if (bubbleRect.bottom > window.innerHeight - 20) {
                const overflow = bubbleRect.bottom - window.innerHeight + 30;
                bubbleEditor.style.top = (parseFloat(bubbleEditor.style.top) - overflow) + 'px';
            }

            // 如果超出顶部
            if (bubbleRect.top < 20) {
                bubbleEditor.style.top = (parseFloat(bubbleEditor.style.top) + (20 - bubbleRect.top)) + 'px';
            }
        }, 10);

        // 添加点击外部关闭气泡的事件
        document.addEventListener('click', closeOnClickOutside);

        // 存储 ResizeObserver，以便在关闭时断开连接
        bubbleEditor._resizeObserver = resizeObserver;
    });

    // 添加文本框内容变化事件 - 自动保存
    moreDetailContent.addEventListener('input', function() {
        // 自动保存逻辑
        moreDetailIcon.setAttribute('data-content', moreDetailContent.value);
        if (moreDetailContent.value.trim()) {
            moreDetailIcon.classList.add('has-content');
            moreDetailIcon.style.color = '#2196F3';
        } else {
            moreDetailIcon.classList.remove('has-content');
            moreDetailIcon.style.color = '';
        }
    });

    // 关闭气泡
    function closeBubbleEditor() {
        // 断开 ResizeObserver 连接
        if (bubbleEditor._resizeObserver) {
            bubbleEditor._resizeObserver.disconnect();
            bubbleEditor._resizeObserver = null;
        }

        bubbleEditor.style.display = 'none';
        document.removeEventListener('click', closeOnClickOutside);
    }

    // 点击气泡外部关闭气泡
    function closeOnClickOutside(e) {
        if (!bubbleEditor.contains(e.target) && e.target !== moreDetailIcon) {
            closeBubbleEditor();
        }
    }

    // 关闭按钮事件
    closeBubble.addEventListener('click', function() {
        closeBubbleEditor();
    });
}
/**
 * 编辑考核表功能 - 第二部分
 */

// 页面加载完成后初始化编辑功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化维度分数点击事件
    document.querySelectorAll('.dimension-score-display').forEach(scoreElement => {
        scoreElement.addEventListener('click', handleDimensionScoreClick);
    });

    // 初始化添加评分项按钮事件
    initializeAddCriteriaButtons();
});

// 维度分数点击事件处理函数
function handleDimensionScoreClick() {
    const currentValue = parseInt(this.textContent) || 0;
    const inputElement = document.createElement('input');
    inputElement.type = 'number';
    inputElement.min = 0;
    // 可以根据需要设置最大值，比如10分制或100分制
    inputElement.value = currentValue;
    inputElement.classList.add('dimension-score-input');

    // 替换文本为输入框
    this.parentNode.replaceChild(inputElement, this);
    inputElement.focus();

    // 失去焦点时保存内容并恢复为文本显示
    inputElement.addEventListener('blur', function() {
        const newScore = document.createElement('span');
        newScore.classList.add('dimension-score-display');
        newScore.textContent = this.value || 0;
        newScore.title = '点击编辑';
        this.parentNode.replaceChild(newScore, this);

        // 重新添加点击事件
        newScore.addEventListener('click', handleDimensionScoreClick);
    });

    // 按下回车键也保存内容
    inputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
}

// 初始化添加评分项按钮
function initializeAddCriteriaButtons() {
    document.querySelectorAll('.add-criteria').forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前维度区域
            const dimensionSection = this.closest('.dimension-section');

            // 获取评级/打分模式
            const modeSelect = dimensionSection.querySelector('.evaluation-mode-select');
            const mode = modeSelect ? modeSelect.value : 'rating'; // 默认为评级模式

            // 创建新的评分项
            const newItem = document.createElement("div");
            newItem.classList.add("criteria-item", "cursor-hover");

            // 根据模式设置不同的HTML内容
            if (mode === 'rating') {
                newItem.innerHTML = `
                    <span class="criteria-text pointer-hover" title="点击编辑">新评分项</span>
                    <span class="remove pointer-hover" title="删除此评分项">✖</span>
                    <div class="criteria-detail-container">
                        <textarea class="criteria-detail" placeholder="请输入详细信息..." rows="2"></textarea>
                        <div class="more-detail-container">
                            <span class="more-detail-icon pointer-hover" title="更多详细说明">
                                <i class="fas fa-info-circle"></i>📝
                            </span>
                            <div class="bubble-editor" style="display: none;">
                                <div class="bubble-arrow arrow-left"></div>
                                <div class="bubble-editor-header">
                                    <span>详细说明</span>
                                    <span class="close-bubble pointer-hover">✖</span>
                                </div>
                                <textarea class="more-detail-content" placeholder="请输入更多详细说明..." rows="8"></textarea>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                newItem.innerHTML = `
                    <span class="criteria-text pointer-hover" title="点击编辑">新评分项</span>
                    <span class="score-value-container">
                        <span class="score-value-display" title="点击编辑">0</span>分
                    </span>
                    <span class="remove pointer-hover" title="删除此评分项">✖</span>
                    <div class="criteria-detail-container">
                        <textarea class="criteria-detail" placeholder="请输入详细信息..." rows="2"></textarea>
                        <div class="more-detail-container">
                            <span class="more-detail-icon pointer-hover" title="更多详细说明">
                                <i class="fas fa-info-circle"></i>📝
                            </span>
                            <div class="bubble-editor" style="display: none;">
                                <div class="bubble-arrow arrow-left"></div>
                                <div class="bubble-editor-header">
                                    <span>详细说明</span>
                                    <span class="close-bubble pointer-hover">✖</span>
                                </div>
                                <textarea class="more-detail-content" placeholder="请输入更多详细说明..." rows="8"></textarea>
                            </div>
                        </div>
                    </div>
                `;
            }

            // 在添加按钮前插入新评分项
            this.parentNode.insertBefore(newItem, this);

            // 给评分项文本添加点击编辑功能
            const criteriaText = newItem.querySelector('.criteria-text');
            criteriaText.addEventListener('click', function() {
                this.contentEditable = true;
                this.focus(); // 让元素进入编辑模式

                // 监听键盘事件
                this.addEventListener(
                    'keydown',
                    function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            // 按下 Enter 结束编辑
                            e.preventDefault();
                            this.blur();
                        }
                        if (e.key === 'Enter' && e.shiftKey) {
                            // Shift + Enter 插入换行
                            e.preventDefault();
                            document.execCommand('insertLineBreak'); // 兼容性较好
                        }
                    },
                    { once: true }
                );

                // 失去焦点时停止编辑
                this.addEventListener(
                    'blur',
                    function() {
                        this.contentEditable = false;
                    },
                    { once: true }
                );
            });

            const detailContainer = newItem.querySelector('.criteria-detail-container');
            detailContainer.style.display = 'block';

            // 给删除按钮添加功能 - 删除整个评分项
            const removeBtn = newItem.querySelector('.remove');
            removeBtn.addEventListener('click', function() {
                // 直接删除整个评分项元素
                newItem.remove();
            });

            // 根据模式添加不同的编辑功能
            if (mode === 'scoring') {
                // 打分模式：给分值添加点击编辑功能
                const scoreValueDisplay = newItem.querySelector('.score-value-display');
                if (scoreValueDisplay) {
                    scoreValueDisplay.addEventListener('click', function() {
                        this.contentEditable = true;
                        this.focus();

                        // 选中所有文本
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);

                        // 失去焦点时停止编辑并格式化
                        this.addEventListener('blur', function() {
                            this.contentEditable = false;
                            // 确保是有效的数字
                            let value = parseInt(this.textContent) || 0;
                            if (value < 0) value = 0;
                            this.textContent = value;
                        }, { once: true });

                        // 按下回车键也停止编辑
                        this.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                this.blur();
                            }
                        });
                    });
                }
            }

            // 添加气泡编辑器的功能
            setupBubbleEditor(newItem);
        });
    });

    // 监听模式选择变化，可以选择是否清空现有评分项
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('evaluation-mode-select')) {
            const dimensionSection = e.target.closest('.dimension-section');
            const criteriaList = dimensionSection.querySelector('.criteria-list');
            const mode = e.target.value;

            // 询问用户是否要清空现有评分项
            if (confirm('切换评分模式会清空现有评分项，是否继续？')) {
                // 清空现有评分项，只保留添加按钮
                const addButton = criteriaList.querySelector('.add-criteria');
                criteriaList.innerHTML = '';
                criteriaList.appendChild(addButton);
            }
        }
    });

    // 全局删除按钮事件处理
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove')) {
            e.target.parentNode.remove();
        }
    });
}

// 提交编辑后的表单
document.getElementById('submitForm')?.addEventListener('click', async function() {
    // 首先验证表单数据
    if (!validateForm()) {
        return;
    }

    // 显示加载状态
    showLoadingIndicator();

    try {
        // 收集表单数据
        const formData = collectFormData();

        // 获取版本号，用于提交更新
        const urlParams = new URLSearchParams(window.location.search);
        const version = urlParams.get('version');

        if (!version) {
            throw new Error('缺少必要的版本参数');
        }

        formData.version = version;  // 添加版本信息到表单数据

        const token = getToken();

        const response = await fetch('/edittable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('考核表更新成功！');
            window.location.href = "/table_index";
        } else {
            throw new Error(data.error || '提交失败，请稍后重试');
        }
    } catch (error) {
        console.error('提交出错：', error);
        alert(error.message || '提交出错，请检查网络连接后重试');
    } finally {
        // 隐藏加载状态
        hideLoadingIndicator();
    }
});

// 验证表单数据
function validateForm() {
    // 检查部门选择
    const departmentSelect = document.getElementById('department-select');
    if (!departmentSelect.value) {
        alert('请选择部门');
        departmentSelect.focus();
        return false;
    }

    // 检查年份选择
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect.value) {
        alert('请选择年份');
        yearSelect.focus();
        return false;
    }

    // 检查季度选择
    const quarterSelect = document.getElementById('quarter-select');
    if (!quarterSelect.value) {
        alert('请选择季度');
        quarterSelect.focus();
        return false;
    }

    return true;
}

// 收集表单数据
function collectFormData() {
    const departmentSelect = document.getElementById('department-select');
    const departmentname = departmentSelect.options[departmentSelect.selectedIndex].text;
    const year = document.querySelector('#year-select')?.value;
    const quarter = document.querySelector('#quarter-select')?.value;

    // 组装 title
    const title = `${departmentname}${year}年 ${quarter}`;

    // 获取 evaluationPeriod（如果有日期输入框）或保持原值
    let evaluationPeriod = '';
    if (evaluationTableData && evaluationTableData.evaluationPeriod) {
        // 如果没有日期输入框，保持原日期
        evaluationPeriod = evaluationTableData.ddl;
    } else {
        // 如果都没有，创建默认值（当前日期加15天）
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);
        evaluationPeriod = futureDate.toISOString().split('T')[0];
    }

    const formData = {
        oldversion : evaluationTableData ? evaluationTableData.name : null,
        title: title,
        evaluationPeriod: evaluationPeriod,
        departmentId: departmentSelect.value,

        // 重组评分项为新的description格式
        description: collectDescriptionData(),

        // 收集评级数据
        grades: collectGradesData(),


        // 保持原有的强制分布百分比
        forcedDistributionPercentage: evaluationTableData ?
            evaluationTableData.forcedDistributionPercentage || 0 : 0
    };

    return formData;
}

// 收集描述数据
function collectDescriptionData() {
    // 创建结果对象
    const result = {
        "专业职能": {
            "分数": 0,
            "评分方式": "评级", // 默认为评级方式
            "评分项": []
        },
        "通用职能": {
            "分数": 0,
            "评分项": []
        },
        "产品表现": {
            "分数": 0
        }
    };

    // 遍历所有维度区域
    document.querySelectorAll('.dimension-section').forEach(section => {
        // 获取维度标题和分数
        const dimensionTitle = section.querySelector('.dimension-title')?.textContent?.trim();
        const dimensionScore = section.querySelector('.dimension-score-display')?.textContent;

        // 根据维度标题选择对应的对象
        let targetObj;
        if (dimensionTitle === "专业职能") {
            targetObj = result["专业职能"];

            // 获取专业职能的评分方式
            const modeSelect = section.querySelector('.evaluation-mode-select');
            if (modeSelect) {
                targetObj["评分方式"] = modeSelect.value === "scoring" ? "打分" : "评级";
            }

        } else if (dimensionTitle === "通用职能") {
            targetObj = result["通用职能"];
        } else if (dimensionTitle === "产品表现" || dimensionTitle === "项目表现" || dimensionTitle === "产品/项目表现") {
            targetObj = result["产品表现"];
        } else {
            return; // 如果不是预期的维度，跳过
        }

        // 设置分数
        targetObj["分数"] = parseFloat(dimensionScore) || 0;

        // 只有专业职能和通用职能需要处理评分项
        if (dimensionTitle === "专业职能" || dimensionTitle === "通用职能") {
            // 获取该维度下的所有评分项
            const criteriaItems = section.querySelectorAll('.criteria-list .criteria-item');

            criteriaItems.forEach(item => {
                const itemText = item.querySelector('.criteria-text')?.textContent?.trim();

                if (itemText) {
                    // 创建包含评分项的对象
                    const criteriaObj = {};

                    // 根据维度和评分方式获取不同的值
                    if (dimensionTitle === "专业职能" && targetObj["评分方式"] === "打分") {
                        // 打分模式：获取分数值
                        const scoreValue = item.querySelector('.score-value-display')?.textContent;

                        // 获取气泡文本框中的内容
                        const moreDetailIcon = item.querySelector('.more-detail-icon');
                        const detailContent = moreDetailIcon?.getAttribute('data-content') || '';

                        criteriaObj[itemText] = {
                            "分数": parseInt(scoreValue) || 0,
                            "描述": item.querySelector('.criteria-detail')?.value?.trim() || '',
                            "详细": detailContent  // 详细说明
                        }
                    } else {
                        // 评级模式或通用职能
                        // 获取气泡文本框中的内容
                        const moreDetailIcon = item.querySelector('.more-detail-icon');
                        const detailContent = moreDetailIcon?.getAttribute('data-content') || '';

                        criteriaObj[itemText] = {
                            "分数": 0, // 评级模式下这个值不重要
                            "描述": item.querySelector('.criteria-detail')?.value?.trim() || '',
                            "详细": detailContent  // 详细说明
                        }
                    }

                    targetObj["评分项"].push(criteriaObj);
                }
            });
        }
    });

    return result;
}

// 收集评级数据
function collectGradesData() {
    return Array.from(document.querySelectorAll('.grade-pair')).map(pair => {
        const grade = pair.querySelector('span')?.textContent.trim(); // 获取等级名称
        const value = pair.querySelector('.grade-input')?.value; // 获取分数值
        return { "grade": grade, "value": value }; // 返回对象形式
    });
}

// 收集考勤规则

// 页面卸载前提示保存
window.addEventListener('beforeunload', function(e) {
    // 检查表单是否有修改
    if (isFormModified()) {
        // 标准方式，显示提示信息
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return e.returnValue;
    }
});

// 检查表单是否被修改
function isFormModified() {
    // 这里可以实现一个简单的检测机制，例如：
    // 1. 使用表单元素的 defaultValue 与 value 比较
    // 2. 维护一个全局变量记录是否有修改
    // 3. 对表单进行序列化比较

    // 简化版本，假设表单总是被修改过
    // 在实际应用中应该实现更精确的检测机制
    return true;
}

// 在每次表单元素变化时设置修改标志
document.addEventListener('change', function(e) {
    if (e.target.closest('form') || e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        // 在这里可以设置一个全局变量标记表单已被修改
        // formModified = true;
    }
});

// 监听文本内容编辑事件
document.addEventListener('input', function(e) {
    if (e.target.contentEditable === 'true' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'INPUT') {
        // 在这里可以设置一个全局变量标记表单已被修改
        // formModified = true;
    }
});