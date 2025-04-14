function getToken() {
    // 从localStorage或sessionStorage获取令牌
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}
document.addEventListener('DOMContentLoaded', async function() {
    // 从URL获取参数
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('emp_id');
    const tableId = urlParams.get('table_id');

    if (!employeeId || !tableId) {
        alert('缺少必要参数');
        window.location.href = '/score_evaluation'; // 返回评分列表页
        return;
    }

    // 加载员工信息和评分表
    try {
        // 获取当前用户权限
        let currentUser = await fetchCurrentUser();
        console.log(currentUser);

        // 加载员工信息
        const employeeInfo = await fetchEmployeeInfo(employeeId);
        displayEmployeeInfo(employeeInfo);

        // 加载评分表
        const evaluationTable = await fetchEvaluationTable(tableId, employeeInfo.emp_id);
        console.log("historyScore",evaluationTable.historyScore);
        if (evaluationTable.historyScore) {
            const notification = document.createElement('div');
            notification.className = 'history-score-notification';
            notification.textContent = '以下显示的是之前的评分结果，您可以直接修改再提交。';
            notification.style.backgroundColor = '#fffde7';
            notification.style.padding = '10px';
            notification.style.marginBottom = '15px';
            notification.style.borderLeft = '4px solid #fbc02d';
            document.querySelector('.evaluation-form-container').prepend(notification);
        }
        // 渲染评分表并应用权限控制
        renderEvaluationForm(evaluationTable, currentUser, employeeInfo);

        // 绑定提交按钮事件
        document.getElementById('submit-score').addEventListener('click', function() {
            submitScore(employeeId, tableId, currentUser, employeeInfo);
        });
    } catch (error) {
        console.error('初始化评分页面失败:', error);
        alert('加载评分信息失败，请返回重试');
    }
});

// 获取当前用户信息
async function fetchCurrentUser() {
    try {
        // 获取存储的 JWT token
        const token = localStorage.getItem('access_token');

        const response = await fetch('/api/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('获取当前用户信息失败');

        const data = await response.json();
        // 从返回数据中提取 userinfo
        return data.userinfo;
    } catch (error) {
        console.error('获取当前用户信息错误:', error);
        throw error;
    }
}

// 获取员工信息
async function fetchEmployeeInfo(employeeId) {
    try {
        const response = await fetch(`/get_employee_info?emp_id=${employeeId}`);
        if (!response.ok) throw new Error('获取员工信息失败');
        return await response.json();
    } catch (error) {
        console.error('获取员工信息错误:', error);
        throw error;
    }
}

// 获取评分表详情
// 获取评分表详情
async function fetchEvaluationTable(tableId,employeeId) {
    try {
        const response = await fetch(`/get_evaluation_table?table_id=${tableId}`);
        if (!response.ok) throw new Error('获取评分表失败');

        // 获取评分表数据
        const tableData = await response.json();
        token = getToken()
        // 获取历史评分数据
        const historyResponse = await fetch(`/api/performance_detail?userId=${employeeId}&tableId=${tableId}`,{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            tableData.historyScore = historyData;
        }

        return tableData;
    } catch (error) {
        console.error('获取评分表错误:', error);
        throw error;
    }
}

// 显示员工信息
function displayEmployeeInfo(employeeInfo) {
    document.getElementById('employee-id').textContent = employeeInfo.emp_id || '-';
    document.getElementById('employee-name').textContent = employeeInfo.emp_name || '-';
    document.getElementById('employee-department').textContent = employeeInfo.department || '-';
    document.getElementById('employee-position').textContent = employeeInfo.position || '-';
}

// 渲染评分表
function renderEvaluationForm(evaluationTable, currentUser, employeeInfo) {
    // 设置表单标题
    document.getElementById('form-title').textContent = evaluationTable.name || '员工评分表';

    // 解析description数据
    let description;
    try {
        description = typeof evaluationTable.description === 'string'
            ? JSON.parse(evaluationTable.description)
            : evaluationTable.description;
    } catch (e) {
        console.error('解析description数据失败:', e);
        description = {};
    }
    const historyScore = evaluationTable.historyScore || null;
    // 检查权限
    const canScoreProfessionalAndGeneral =
        (currentUser.isRJ && employeeInfo.immediate_leader === currentUser.emp_id);

    const canScoreProduct =
        (currentUser.isPJ && (employeeInfo.directJudgeid === currentUser.emp_id));
    console.log("employeeInfo.directJudgeid:",employeeInfo.directJudgeid)
    console.log("currentUser.emp_id:",currentUser.emp_id)
    console.log("")
    console.log("flag:",employeeInfo.directJudgeid === currentUser.emp_id)
    console.log("currentUser:",currentUser.emp_id)
    console.log("employeeinfoid:",employeeInfo.directJudgeid)
    console.log("canScoreProduct:,",canScoreProduct)
    console.log("employeeeinfo:,",employeeInfo)


    // 渲染专业职能部分
    renderProfessionalDimension(description["专业职能"], evaluationTable.score_rule, canScoreProfessionalAndGeneral, historyScore?.ProfessDes);

    // 渲染通用职能部分
    renderGeneralDimension(description["通用职能"], evaluationTable.score_rule, canScoreProfessionalAndGeneral, historyScore?.GeneralDes);

    // 渲染产品表现部分
    renderProductDimension(description["产品表现"], canScoreProduct, historyScore?.ProductDes);

    // 如果是超级管理员，添加额外加减分项
    if (currentUser.isSA) {
        renderExtraBonusSection(historyScore?.ExtraBonus);
    }

    // 渲染考勤部分
    // renderAttendanceSection(evaluationTable.punishment);
}

// 渲染专业职能部分
// 渲染专业职能部分
// 渲染专业职能部分
function renderProfessionalDimension(professionalData, score_rule, hasPermission,historyData) {
    if (!professionalData) return;
    console.log("professionalData:",professionalData)
    const container = document.getElementById('professional-dimension');
    container.innerHTML = ''; // 清空容器

    // 创建标题区域
    const header = document.createElement('div');
    header.className = 'dimension-header';

    const title = document.createElement('div');
    title.className = 'dimension-title';
    title.textContent = '专业职能';

    header.appendChild(title);

    // 添加评分方式标识
    const evaluationMode = professionalData["评分方式"] || "评级";
    const modeDisplay = document.createElement('div');
    modeDisplay.className = 'evaluation-mode';
    modeDisplay.textContent = `评分方式: ${evaluationMode}`;
    header.appendChild(modeDisplay);

    // 添加总分显示
    const totalScoreDisplay = document.createElement('div');
    totalScoreDisplay.className = 'total-score-display';
    totalScoreDisplay.textContent = `总分: ${professionalData["分数"] || 0}`;
    header.appendChild(totalScoreDisplay);

    // 添加权限提示
    if (!hasPermission) {
        const permissionNotice = document.createElement('div');
        permissionNotice.className = 'permission-notice';
        permissionNotice.textContent = '(您没有权限评分此部分)';
        permissionNotice.style.color = 'red';
        permissionNotice.style.marginLeft = '10px';
        header.appendChild(permissionNotice);
    }

    container.appendChild(header);

    // 获取评分规则并转换为对象格式便于查找
    let scoreRuleArray = score_rule || [
        {"grade": "A", "value": "10"},
        {"grade": "B+", "value": "8.5"},
        {"grade": "B", "value": "7"},
        {"grade": "C", "value": "5"}
    ];
    scoreRuleArray = JSON.parse(scoreRuleArray);
    // 将评分规则数组转换为对象
    const scoreRule = {};
    scoreRuleArray.forEach(rule => {
        scoreRule[rule.grade] = parseFloat(rule.value);
    });

    // 添加评分项
    if (Array.isArray(professionalData["评分项"])) {
        professionalData["评分项"].forEach((item,index) => {
            // 每个item是一个对象，键是评分项名称，值是最高分
            const criteriaName = Object.keys(item)[0];
            const maxScore = item[criteriaName]["分数"];

            // 获取历史评分
            let historyScore = null;
            let historyGrade = null;
            if (historyData != null){
                historyScore = historyData[index]?.score;
                historyGrade = historyData[index]?.grade;
            }
            const criteriaItem = document.createElement('div');
            criteriaItem.className = 'criteria-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'criteria-name';
            nameSpan.textContent = criteriaName;
            criteriaItem.appendChild(nameSpan);
            // 添加问号图标用于显示"详细"信息
            const detailExtraText = item[criteriaName]["详细"];

// 始终添加问号图标
            const infoIcon = document.createElement('span');
            infoIcon.className = 'info-icon';
            infoIcon.innerHTML = '?';  // 问号符号

// 使用data-tooltip属性代替title，这样我们可以自定义tooltip
            const tooltipContent = detailExtraText && detailExtraText.trim() !== "" ? detailExtraText : "无详情内容";
            infoIcon.setAttribute('data-tooltip', tooltipContent);

            nameSpan.appendChild(infoIcon);
            // 添加最高分显示

            // 根据评分方式添加不同的评分控件
            if (evaluationMode === "打分") {
                const maxScoreSpan = document.createElement('span');
                maxScoreSpan.className = 'max-score';
                maxScoreSpan.textContent = `(最高分: ${maxScore})`;
                nameSpan.appendChild(maxScoreSpan);
                // 打分模式：添加分数输入框
                const scoreInput = document.createElement('input');
                scoreInput.type = 'number';
                scoreInput.className = 'score-input';
                scoreInput.min = '0';
                scoreInput.max = maxScore.toString(); // 使用项目的最高分
                scoreInput.placeholder = '分数';
                scoreInput.dataset.criteriaName = criteriaName;
                scoreInput.dataset.maxScore = maxScore;
                const detailToggle = document.createElement('span');
                detailToggle.className = 'detail-toggle';
                detailToggle.textContent = '详细';
                detailToggle.title = '查看详细信息';
                detailText = item[criteriaName]["描述"];
                console.log("detailText:",detailText)
                // 创建详细信息容器
                const detailContainer = document.createElement('div');
                detailContainer.className = 'criteria-detail-container';

                // 创建详细信息文本区域（只读）
                if (detailText && detailText.trim() !== "") {
                    const detailTextarea = document.createElement('textarea');
                    detailTextarea.className = 'criteria-detail';
                    detailTextarea.value = detailText;
                    detailTextarea.className = 'criteria-detail';
                    detailTextarea.value = detailText;
                    detailTextarea.style.pointerEvents = 'auto';
                    detailTextarea.disabled = true; // 禁用但保留调整大小功能
                    detailTextarea.style.resize = 'vertical'
                    detailContainer.appendChild(detailTextarea);
                } else {
                    // 如果没有详细信息，显示提示
                    const noDetailMsg = document.createElement('div');
                    noDetailMsg.className = 'no-detail-message';
                    noDetailMsg.textContent = '暂无详细信息';
                    detailContainer.appendChild(noDetailMsg);
                }

                // 如果没有权限，禁用输入框
                if (!hasPermission) {
                    scoreInput.disabled = true;
                }

                // 添加输入验证
                scoreInput.addEventListener('input', function() {
                    if (this.value === '') return;
                    const value = parseInt(this.value);
                    const max = parseInt(this.dataset.maxScore);
                    if (value > max) {
                        this.value = max;
                    } else if (value < 0) {
                        this.value = 0;
                    }
                });
                if (historyScore !== null) {
                    scoreInput.value = historyScore;
                }
                criteriaItem.appendChild(scoreInput);
                criteriaItem.appendChild(detailToggle);
                criteriaItem.appendChild(detailContainer);
                detailToggle.addEventListener('click', function() {
                    if (detailContainer.style.display === 'none' || !detailContainer.style.display) {
                        detailContainer.style.display = 'block';
                        this.textContent = '收起';
                    } else {
                        detailContainer.style.display = 'none';
                        this.textContent = '详细';
                    }
                });
            } else {
                // 评级模式：添加A, B+, B, C选项
                const ratingOptions = document.createElement('div');
                ratingOptions.className = 'rating-options';

                // 计算每个等级对应的分数
                // 对于评级模式，我们需要将评分规则的值应用到最高分上
                const gradeScores = {};
                for (const grade in scoreRule) {
                    // 如果评分规则中的值是百分比 (0-1之间)，则乘以最高分
                        // 如果评分规则中的值是具体分数，则直接使用
                        // 但不能超过最高分
                        gradeScores[grade] = scoreRule[grade]
                }

                // 创建评级选项
                Object.keys(scoreRule).forEach(grade => {
                    const option = document.createElement('div');
                    option.className = 'rating-option';
                    option.textContent = `${grade}`;
                    option.dataset.grade = grade;
                    option.dataset.score = gradeScores[grade];
                    option.dataset.criteriaName = criteriaName;
                    if (historyGrade === grade) {
                        option.classList.add('selected');
                    }
                    // 如果没有权限，禁用点击
                    if (!hasPermission) {
                        option.style.opacity = '0.5';
                        option.style.cursor = 'not-allowed';
                    } else {
                        // 添加点击事件
                        option.addEventListener('click', function() {
                            // 移除同组中其他选项的选中状态
                            this.parentNode.querySelectorAll('.rating-option').forEach(opt => {
                                opt.classList.remove('selected');
                            });
                            // 添加当前选项的选中状态
                            this.classList.add('selected');
                        });
                    }

                    ratingOptions.appendChild(option);
                });
                const detailToggle = document.createElement('span');
                detailToggle.className = 'detail-toggle';
                detailToggle.textContent = '详细';
                detailToggle.title = '查看详细信息';

                // 创建详细信息容器
                const detailContainer = document.createElement('div');
                detailContainer.className = 'criteria-detail-container';
                detailText = item[criteriaName]["描述"];
                // 创建详细信息文本区域（只读）
                if (detailText && detailText.trim() !== "") {
                    const detailTextarea = document.createElement('textarea');
                    detailTextarea.className = 'criteria-detail';
                    detailTextarea.value = detailText;
                    detailTextarea.className = 'criteria-detail';
                    detailTextarea.value = detailText;
                    detailTextarea.style.pointerEvents = 'auto';
                    detailTextarea.disabled = true; // 禁用但保留调整大小功能
                    detailTextarea.style.resize = 'vertical'
                    detailContainer.appendChild(detailTextarea);
                } else {
                    // 如果没有详细信息，显示提示
                    const noDetailMsg = document.createElement('div');
                    noDetailMsg.className = 'no-detail-message';
                    noDetailMsg.textContent = '暂无详细信息';
                    detailContainer.appendChild(noDetailMsg);
                }
                detailContainer.style.display = 'block';
                criteriaItem.appendChild(ratingOptions);
                criteriaItem.appendChild(detailToggle);
                criteriaItem.appendChild(detailContainer);
                detailToggle.addEventListener('click', function() {
                    if (detailContainer.style.display === 'none' || !detailContainer.style.display) {
                        detailContainer.style.display = 'block';
                        this.textContent = '收起';
                    } else {
                        detailContainer.style.display = 'none';
                        this.textContent = '详细';
                    }
                });

            }

            container.appendChild(criteriaItem);
        });
    }
}

// 渲染通用职能部分
function renderGeneralDimension(generalData,score_rule, hasPermission,historyData) {
    if (!generalData) return;

    const container = document.getElementById('general-dimension');
    container.innerHTML = ''; // 清空容器

    // 创建标题区域
    const header = document.createElement('div');
    header.className = 'dimension-header';

    const title = document.createElement('div');
    title.className = 'dimension-title';
    title.textContent = '通用职能';

    header.appendChild(title);

    const totalScoreDisplay = document.createElement('div');
    totalScoreDisplay.className = 'total-score-display';
    totalScoreDisplay.textContent = `总分: ${generalData["分数"] || 0}`;
    header.appendChild(totalScoreDisplay);

    // 添加权限提示
    if (!hasPermission) {
        const permissionNotice = document.createElement('div');
        permissionNotice.className = 'permission-notice';
        permissionNotice.textContent = '(您没有权限评分此部分)';
        permissionNotice.style.color = 'red';
        permissionNotice.style.marginLeft = '10px';
        header.appendChild(permissionNotice);
    }

    container.appendChild(header);

    // 获取评分规则并转换为对象格式便于查找
    let scoreRuleArray = score_rule
    scoreRuleArray = JSON.parse(scoreRuleArray);

    // 将评分规则数组转换为对象
    const scoreRule = {};
    scoreRuleArray.forEach(rule => {
        scoreRule[rule.grade] = parseFloat(rule.value);
    });
    console.log(scoreRule);
    // 通用职能只使用评级模式
    if (Array.isArray(generalData["评分项"])) {
        generalData["评分项"].forEach((item,index) => {
            const criteriaName = Object.keys(item)[0];
            let historyGrade = null;
            if (historyData) {
                historyGrade = historyData[index]?.grade;
            }
            const criteriaItem = document.createElement('div');
            criteriaItem.className = 'criteria-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'criteria-name';
            nameSpan.textContent = criteriaName;
            criteriaItem.appendChild(nameSpan);
            // 添加问号图标用于显示"详细"信息
            const detailExtraText = item[criteriaName]["详细"];

// 始终添加问号图标
            const infoIcon = document.createElement('span');
            infoIcon.className = 'info-icon';
            infoIcon.innerHTML = '?';  // 问号符号

// 使用data-tooltip属性代替title，这样我们可以自定义tooltip
            const tooltipContent = detailExtraText && detailExtraText.trim() !== "" ? detailExtraText : "无详情内容";
            infoIcon.setAttribute('data-tooltip', tooltipContent);

            nameSpan.appendChild(infoIcon);
            // 添加最高分显示

            // 添加评级选项
            const ratingOptions = document.createElement('div');
            ratingOptions.className = 'rating-options';

            // 计算每个等级对应的分数
            const gradeScores = {};
            for (const grade in scoreRule) {
                // 如果评分规则中的值是百分比 (0-1之间)，则乘以最高分
                    gradeScores[grade] = scoreRule[grade]
            }
            console.log(gradeScores);
            // 创建评级选项
            Object.keys(scoreRule).forEach(grade => {
                const option = document.createElement('div');
                option.className = 'rating-option';
                option.textContent = `${grade}`;
                option.dataset.grade = grade;
                option.dataset.score = gradeScores[grade];
                option.dataset.criteriaName = criteriaName;
                if (historyGrade === grade) {
                    option.classList.add('selected');
                }

                // 如果没有权限，禁用点击
                if (!hasPermission) {
                    option.style.opacity = '0.5';
                    option.style.cursor = 'not-allowed';
                } else {
                    // 添加点击事件
                    option.addEventListener('click', function() {
                        // 移除同组中其他选项的选中状态
                        this.parentNode.querySelectorAll('.rating-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        // 添加当前选项的选中状态
                        this.classList.add('selected');
                    });
                }

                ratingOptions.appendChild(option);
            });

            criteriaItem.appendChild(ratingOptions);
            const detailToggle = document.createElement('span');
            detailToggle.className = 'detail-toggle';
            detailToggle.textContent = '详细';
            detailToggle.title = '查看详细信息';

            // 创建详细信息容器
            const detailContainer = document.createElement('div');
            detailContainer.className = 'criteria-detail-container';
            detailText = item[criteriaName]["描述"];
            // 创建详细信息文本区域（只读）
            if (detailText && detailText.trim() !== "") {
                const detailTextarea = document.createElement('textarea');
                detailTextarea.className = 'criteria-detail';
                detailTextarea.value = detailText;
                detailTextarea.style.pointerEvents = 'auto';
                detailTextarea.disabled = true; // 禁用但保留调整大小功能
                detailTextarea.style.resize = 'vertical'
                detailContainer.appendChild(detailTextarea);
            } else {
                // 如果没有详细信息，显示提示
                const noDetailMsg = document.createElement('div');
                noDetailMsg.className = 'no-detail-message';
                noDetailMsg.textContent = '暂无详细信息';
                detailContainer.appendChild(noDetailMsg);
            }

            detailContainer.style.display = 'block';

            criteriaItem.appendChild(ratingOptions);
            criteriaItem.appendChild(detailToggle);
            criteriaItem.appendChild(detailContainer);

            detailToggle.addEventListener('click', function() {
                if (detailContainer.style.display === 'none' || !detailContainer.style.display) {
                    detailContainer.style.display = 'block';
                    this.textContent = '收起';
                } else {
                    detailContainer.style.display = 'none';
                    this.textContent = '详细';
                }
            });


            container.appendChild(criteriaItem);
        });
    }
}
// 渲染产品表现部分
function renderProductDimension(productData, hasPermission,historyScore) {
    if (!productData) return;

    const container = document.getElementById('product-dimension');
    container.innerHTML = ''; // 清空容器

    // 创建标题区域
    const header = document.createElement('div');
    header.className = 'dimension-header';

    const title = document.createElement('div');
    title.className = 'dimension-title';
    title.textContent = '产品/项目表现';
    header.appendChild(title);

    // 显示最高可得分数
    const maxScore = productData["分数"] || 0;
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'total-score-display';
    scoreDisplay.textContent = `最高分: ${maxScore}分`;
    const modedisplay = document.createElement('div');
    modedisplay.className = 'evaluation-mode';
    modedisplay.textContent = `平均分应为5分`;
    header.appendChild(modedisplay);
    header.appendChild(scoreDisplay);

    // 添加权限提示
    if (!hasPermission) {
        const permissionNotice = document.createElement('div');
        permissionNotice.className = 'permission-notice';
        permissionNotice.textContent = '(您没有权限评分此部分)';
        permissionNotice.style.color = 'red';
        permissionNotice.style.marginLeft = '10px';
        header.appendChild(permissionNotice);
    }

    container.appendChild(header);

    // 产品表现只需要一个总体评分
    const criteriaItem = document.createElement('div');
    criteriaItem.className = 'criteria-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'criteria-name';
    nameSpan.textContent = '产品/项目总体表现';
    criteriaItem.appendChild(nameSpan);


// 始终添加问号图标
    const infoIcon = document.createElement('span');
    infoIcon.className = 'info-icon';
    infoIcon.innerHTML = '?';  // 问号符号

// 使用data-tooltip属性代替title，这样我们可以自定义tooltip
    let detailExtraText = "由产品线负责人根据通用职能中“工作完成度”“工作饱和度”“工作态度”“团队协作”“学习能力”5项维度对产品线内员工进行考核，在10分范围内加分。\n" +
        "注意主观分范围：优秀（9-10）良好（7-8分）平均水平（5-6）较差（1-4），如果项目阶段较早阶段，还未投入人力，可以给平均分。";
    const tooltipContent = detailExtraText && detailExtraText.trim() !== "" ? detailExtraText : "无详情内容";
    infoIcon.setAttribute('data-tooltip', tooltipContent);

    nameSpan.appendChild(infoIcon);
    // 添加最高分显示

    // 添加数字输入框
    const scoreInput = document.createElement('input');
    scoreInput.type = 'number';
    scoreInput.className = 'score-input';
    scoreInput.min = '0';
    scoreInput.max = maxScore.toString();
    scoreInput.placeholder = '分数';
    scoreInput.dataset.criteriaName = '产品表现';
    if (historyScore !== null) {
        scoreInput.value = historyScore;
    }
    // 如果没有权限，禁用输入框
    if (!hasPermission) {
        scoreInput.disabled = true;
    }

    // 添加输入验证
    scoreInput.addEventListener('input', function() {
        if (this.value === '') return;
        const value = parseInt(this.value);
        const max = parseInt(this.max);
        if (value > max) {
            this.value = max;
        } else if (value < 0) {
            this.value = 0;
        }
    });

    criteriaItem.appendChild(scoreInput);
    container.appendChild(criteriaItem);
}

// 渲染超级管理员额外加减分项
function renderExtraBonusSection(historyBonus) {
    // 创建额外加减分区域
    const container = document.createElement('div');
    container.id = 'extra-bonus-section';
    container.className = 'dimension-section';

    // 创建标题区域
    const header = document.createElement('div');
    header.className = 'dimension-header';

    const title = document.createElement('div');
    title.className = 'dimension-title';
    title.textContent = '额外加减分';

    header.appendChild(title);
    container.appendChild(header);

    // 创建加减分输入项
    const criteriaItem = document.createElement('div');
    criteriaItem.className = 'criteria-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'criteria-name';
    nameSpan.textContent = '额外加减分 (可正可负)';
    criteriaItem.appendChild(nameSpan);

    // 添加数字输入框
    const scoreInput = document.createElement('input');
    scoreInput.type = 'number';
    scoreInput.className = 'score-input';
    scoreInput.placeholder = '加减分';
    scoreInput.id = 'extra-bonus-input';
    scoreInput.max = 5;
    scoreInput.min = 0;

    criteriaItem.appendChild(scoreInput);

    // 添加说明输入框
    const reasonInput = document.createElement('input');
    reasonInput.type = 'text';
    reasonInput.className = 'reason-input';
    reasonInput.placeholder = '加减分原因说明';
    reasonInput.id = 'extra-bonus-reason';
    reasonInput.style.marginLeft = '10px';
    reasonInput.style.width = '300px';
    if (historyBonus) {
        if (historyBonus.score !== null) {
            scoreInput.value = historyBonus.score;
        }
        if (historyBonus.reason) {
            reasonInput.value = historyBonus.reason;
        }
    }
    const detailToggle = document.createElement('span');
    detailToggle.className = 'detail-toggle';
    detailToggle.textContent = '详细';
    detailToggle.title = '查看详细信息';

    // 创建详细信息容器
    const detailContainer = document.createElement('div');
    detailContainer.className = 'criteria-detail-container';
    detailText = "个人提升（非管理岗）：\n" +
        "复杂问题解决与创新力。技术优化或工作流程优化，根据优化的实际执行效果给分。\n" +
        "职业发展主动性。主动争取参与关键项目或承担更高责任，参与制定可落地目标并完成阶段性目标，根据个人贡献度额外给分。\n" +
        "技能与知识提升。主动学习与岗位相关新技术、工具或行业知识，并能够获取培训、行业认证证明、专利授权等，可根据其成果给分。\n" +
        "团队提升（管理岗）：\n" +
        "若团队员工提出的（需求/技术/流程等）大型改进类建议被采纳数量超过4个/季度，需列举证明并提交绩效委员会审核通过后进行一定加分。\n" +
        "若团队员工被邀请到第三方公司进行宣讲，将可根据第三方公司级别给予一定加分。\n" +
        "若团队员工获得专利授权，将可根据专利类型进行一定加分。\n" +
        "若团队员工在权威平台(审核严格、传播力强)发表专业文章或者开源分享非密级代码，将可根据平台等级进行一定加分。"
    const detailTextarea = document.createElement('textarea');
    detailTextarea.className = 'criteria-detail';
    detailTextarea.value = detailText;
    detailTextarea.style.pointerEvents = 'auto';
    detailTextarea.disabled = true; // 禁用但保留调整大小功能
    detailTextarea.style.resize = 'vertical'
    detailContainer.appendChild(detailTextarea);
    criteriaItem.appendChild(reasonInput);
    criteriaItem.appendChild(detailToggle);
    criteriaItem.appendChild(detailContainer);
    detailToggle.addEventListener('click', function() {
        if (detailContainer.style.display === 'none' || !detailContainer.style.display) {
            detailContainer.style.display = 'block';
            this.textContent = '收起';
        } else {
            detailContainer.style.display = 'none';
            this.textContent = '详细';
        }
    });
    container.appendChild(criteriaItem);

    // 将额外加减分区域添加到表单中
    const formContainer = document.querySelector('.evaluation-form-container');
    formContainer.insertBefore(container, document.querySelector('.submit-section'));
}

// 提交评分
async function submitScore(employeeId, tableId, currentUser, employeeInfo) {
    try {
        // 检查权限
        const canScoreProfessionalAndGeneral = currentUser.isSA ||
            (currentUser.isRJ && employeeInfo.immediate_leader === currentUser.emp_id);

        const canScoreProduct = currentUser.isSA ||
            (currentUser.isPJ && employeeInfo.directJudgeid === currentUser.emp_id);
        console.log("currentUser.isPJ",currentUser.isPJ)
        console.log("employeeInfo.directJudgeId",employeeInfo.directJudgeId)
        console.log("canScoreProduct:",canScoreProduct)
        // 收集专业职能评分
        const professionalScores = collectProfessionalScores(canScoreProfessionalAndGeneral);

        // 收集专业职能打分细节
        const professionalDetails = collectProfessionalDetails(canScoreProfessionalAndGeneral);

        // 收集通用职能评分
        const generalScores = collectGeneralScores(canScoreProfessionalAndGeneral);

        // 收集通用职能打分细节
        const generalDetails = collectGeneralDetails(canScoreProfessionalAndGeneral);

        // 收集产品表现评分
        const productScore = collectProductScore(canScoreProduct);

        // 构建提交数据
        const scoreData = {
            emp_id: employeeId,
            table_id: tableId,
            extraBonus: {
                score: null,
                reason: null
            }
        };

        // 只有在有权限的情况下才添加相应的评分数据
        if (professionalScores !== null) {
            scoreData.professional = professionalScores;
        }

        if (generalScores !== null) {
            scoreData.general = generalScores;
        }

        if (productScore !== null) {
            console.log("productScore:",productScore)
            scoreData.product = productScore;
        }

        // 只有在有权限的情况下才添加详细信息
        if (professionalDetails !== null || generalDetails !== null) {
            scoreData.details = {};

            if (professionalDetails !== null) {
                scoreData.details.professional = professionalDetails;
            }

            if (generalDetails !== null) {
                scoreData.details.general = generalDetails;
            }
        }

        // 如果是超级管理员，收集额外加减分
        if (currentUser.isSA) {
            const extraBonusInput = document.getElementById('extra-bonus-input');
            const extraBonusReason = document.getElementById('extra-bonus-reason');

            if (extraBonusInput && extraBonusInput.value) {
                scoreData.extraBonus = {
                    score: parseFloat(extraBonusInput.value),
                    reason: extraBonusReason ? extraBonusReason.value : ''
                };
            }
        }

        console.log('提交的评分数据:', scoreData);
        const token = localStorage.getItem('access_token');
        // 发送评分数据到服务器
        console.log('token:', token);
        const response = await fetch('/submit_score', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(scoreData)
        });

        if (!response.ok) {
            throw new Error('提交评分失败');
        }

        const result = await response.json();

        if (result.success) {
            alert('评分提交成功');
            window.location.href = '/score_evaluation'; // 返回评分列表页
        } else {
            alert('评分提交失败: ' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('提交评分错误:', error);
        alert('提交评分时发生错误，请重试');
    }
}

// 收集专业职能评分
function collectProfessionalScores(hasPermission) {
    if (!hasPermission) {
        // 如果没有权限，返回null
        return null;
    }

    const professionalSection = document.getElementById('professional-dimension');
    const evaluationMode = professionalSection.querySelector('.evaluation-mode')?.textContent.includes('打分')
        ? '打分'
        : '评级';

    const scores = [];

    if (evaluationMode === '打分') {
        // 收集打分模式的分数
        professionalSection.querySelectorAll('.score-input').forEach(input => {
            if (input.value) {
                scores.push({
                    name: input.dataset.criteriaName,
                    score: parseFloat(input.value)
                });
            }
        });
    } else {
        // 收集评级模式的等级
        const criteriaItems = professionalSection.querySelectorAll('.criteria-item');

        criteriaItems.forEach(item => {
            const criteriaName = item.querySelector('.criteria-name').textContent.split('(')[0].trim();
            const selectedOption = item.querySelector('.rating-option.selected');

            if (selectedOption) {
                scores.push({
                    name: criteriaName,
                    grade: selectedOption.dataset.grade,
                    score: parseInt(selectedOption.dataset.score)
                });
            } else {
                // 如果没有选择评级，不添加此项
                console.warn(`评分项 "${criteriaName}" 未选择评级`);
            }
        });
    }

    return {
        mode: evaluationMode,
        items: scores
    };
}

// 收集通用职能评分
function collectGeneralScores(hasPermission) {
    if (!hasPermission) {
        // 如果没有权限，返回null
        return null;
    }

    const generalSection = document.getElementById('general-dimension');
    const scores = [];

    const criteriaItems = generalSection.querySelectorAll('.criteria-item');

    criteriaItems.forEach(item => {
        const criteriaName = item.querySelector('.criteria-name').textContent.split('(')[0].trim();
        const selectedOption = item.querySelector('.rating-option.selected');

        if (selectedOption) {
            scores.push({
                name: criteriaName,
                grade: selectedOption.dataset.grade,
                score: parseInt(selectedOption.dataset.score)
            });
        } else {
            // 如果没有选择评级，不添加此项
            console.warn(`评分项 "${criteriaName}" 未选择评级`);
        }
    });

    return scores;
}

// 收集产品表现评分
function collectProductScore(hasPermission) {
    if (!hasPermission) {
        console.log("没有权限");
        // 如果没有权限，返回null
        return null;
    }

    const productSection = document.getElementById('product-dimension');
    const scoreInput = productSection.querySelector('.score-input');
    console.log("scoreInput:",scoreInput.value)
    if (scoreInput && scoreInput.value) {
        return parseFloat(scoreInput.value);
    } else {
        return null; // 如果没有输入分数，返回null
    }
}

// 收集专业职能打分细节
function collectProfessionalDetails(hasPermission) {
    if (!hasPermission) {
        return null;
    }

    const professionalSection = document.getElementById('professional-dimension');
    const evaluationMode = professionalSection.querySelector('.evaluation-mode')?.textContent.includes('打分')
        ? '打分'
        : '评级';

    const details = [];

    if (evaluationMode === '打分') {
        // 收集打分模式的详细信息
        professionalSection.querySelectorAll('.criteria-item').forEach(item => {
            const nameElement = item.querySelector('.criteria-name');
            const criteriaName = nameElement.textContent.split('(')[0].trim();
            const maxScoreText = nameElement.querySelector('.max-score')?.textContent || '';
            const maxScore = parseInt(maxScoreText.match(/\d+/) || '0');
            const scoreInput = item.querySelector('.score-input');
            const score = scoreInput && scoreInput.value ? parseFloat(scoreInput.value) : null;

            if (score !== null) {
                details.push({
                    name: criteriaName,
                    maxScore: maxScore,
                    score: score,
                    percentage: maxScore > 0 ? (score / maxScore * 100).toFixed(2) + '%' : '0%'
                });
            }
        });
    } else {
        // 收集评级模式的详细信息
        professionalSection.querySelectorAll('.criteria-item').forEach(item => {
            const nameElement = item.querySelector('.criteria-name');
            const criteriaName = nameElement.textContent.split('(')[0].trim();
            const maxScoreText = nameElement.querySelector('.max-score')?.textContent || '';
            const maxScore = parseInt(maxScoreText.match(/\d+/) || '0');
            const selectedOption = item.querySelector('.rating-option.selected');

            if (selectedOption) {
                const grade = selectedOption.dataset.grade;
                const score = parseInt(selectedOption.dataset.score);

                details.push({
                    name: criteriaName,
                    maxScore: maxScore,
                    grade: grade,
                    score: score,
                    percentage: maxScore > 0 ? (score / maxScore * 100).toFixed(2) + '%' : '0%'
                });
            }
        });
    }

    return details;
}

// 收集通用职能打分细节
function collectGeneralDetails(hasPermission) {
    if (!hasPermission) {
        return null;
    }

    const generalSection = document.getElementById('general-dimension');
    const details = [];

    generalSection.querySelectorAll('.criteria-item').forEach(item => {
        const nameElement = item.querySelector('.criteria-name');
        const criteriaName = nameElement.textContent.split('(')[0].trim();
        const maxScoreText = nameElement.querySelector('.max-score')?.textContent || '';
        const maxScore = parseInt(maxScoreText.match(/\d+/) || '0');
        const selectedOption = item.querySelector('.rating-option.selected');

        if (selectedOption) {
            const grade = selectedOption.dataset.grade;
            const score = parseInt(selectedOption.dataset.score);

            details.push({
                name: criteriaName,
                maxScore: maxScore,
                grade: grade,
                score: score,
                percentage: maxScore > 0 ? (score / maxScore * 100).toFixed(2) + '%' : '0%'
            });
        }
    });

    return details;
}