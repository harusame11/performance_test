document.addEventListener('DOMContentLoaded', function() {

    // 获取DOM元素
    const departmentSelect = document.getElementById('departmentSelect');
    const versionSelect = document.getElementById('versionSelect');
    const queryBtn = document.getElementById('queryBtn');
    const exportBtn = document.getElementById('exportBtn');
    const resultSection = document.querySelector('.result-section');


    // 事件监听器
    departmentSelect.addEventListener('change', handleDepartmentChange);
    versionSelect.addEventListener('change', handleVersionChange);
    queryBtn.addEventListener('click', handleQuery);
    exportBtn.addEventListener('click', handleExport);


    function checkToken() {
        const token = localStorage.getItem('access_token');
        console.log('当前 token 状态:', token ? '存在' : '不存在');

        if (!token) {
            console.error('未检测到登录状态');
            alert('请先登录');
            window.location.href = '/login';  // 重定向到登录页
            return false;
        }

        try {
            // 解析 token
            const tokenParts = token.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('token 解析结果:', payload);

            // 检查 token 是否过期
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                console.error('token 已过期');
                alert('登录已过期，请重新登录');
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return false;
            }

            return true;
        } catch (error) {
            console.error('token 解析错误:', error);
            alert('登录状态异常，请重新登录');
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            return false;
        }
    }

    // 在页面加载时检查 token
    if (!checkToken()) {
        return;
    }

    // 在发送 API 请求前检查 token
    async function fetchWithToken(url, options = {}) {
        if (!checkToken()) {
            throw new Error('未登录或登录已过期');
        }

        const token = localStorage.getItem('access_token');
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                console.error('token 无效或已过期');
                alert('登录已过期，请重新登录');
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                throw new Error('未授权');
            }

            return response;
        } catch (error) {
            console.error('请求错误:', error);
            throw error;
        }
    }

    // 使用示例：获取部门列表
    async function loadDepartments() {
        try {
            const response = await fetchWithToken('/api/departments');
            const data = await response.json();
            console.log('部门数据:', data);

            if (data.success) {
                // 处理部门数据
                // ...
            }
        } catch (error) {
            console.error('加载部门失败:', error);
        }
    }

    // 初始化加载
    loadDepartments();

    // 获取用户信息的方式
    let userInfo;
    try {
        const token = localStorage.getItem('access_token');
        if (token) {
            // 解析 JWT token
            const tokenParts = token.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            userInfo = JSON.parse(payload.sub);  // 解析嵌套的 JSON 字符串
        }
    } catch (error) {
        console.error('Error parsing user info:', error);
        alert('获取用户信息失败，请重新登录');
        return;
    }

    const isSA = userInfo?.userinfo?.isSA || false;
    const currentUserId = userInfo?.userinfo?.emp_id || '';

    console.log('User Info:', userInfo);  // 调试用
    console.log('Is SA:', isSA);          // 调试用
    console.log('User ID:', currentUserId);// 调试用

    // 初始化
    loadDepartments();

    // 加载部门列表
    async function loadDepartments() {
        try {
            const response = await fetch('/api/departments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Departments data:', data);  // 调试用

            if (data.success) {
                departmentSelect.innerHTML = '<option value="">请选择部门</option>';

                // 超级管理员可以查看所有部门
                if (isSA) {
                    departmentSelect.innerHTML += '<option value="all">所有部门</option>';
                }

                if (data.departments && Array.isArray(data.departments)) {
                    data.departments.forEach(dept => {
                        // 根据权限显示部门
                        if (isSA || dept.leader_id === currentUserId) {
                            const option = document.createElement('option');
                            option.value = dept.id;
                            option.textContent = dept.name;
                            departmentSelect.appendChild(option);
                        }
                    });

                    // 部门管理员自动选中其部门
                    if (!isSA && departmentSelect.options.length === 2) {
                        departmentSelect.selectedIndex = 1;
                        departmentSelect.dispatchEvent(new Event('change'));
                    }
                } else {
                    console.error('Invalid departments data:', data);
                }
            } else {
                throw new Error(data.message || '加载部门列表失败');
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            alert('加载部门列表失败: ' + error.message);
        }
    }


    // 处理部门选择变化
    async function handleDepartmentChange() {
        const departmentId = departmentSelect.value;
        console.log('选择的部门ID:', departmentId);  // 调试信息

        versionSelect.disabled = !departmentId;
        versionSelect.innerHTML = '<option value="">请选择版本</option>';
        queryBtn.disabled = true;

         // 处理"所有部门"的特殊情况
        if (departmentId === 'all' && isSA) {
            versionSelect.disabled = true;
            versionSelect.innerHTML = '<option value="latest">最新版本</option>';
            versionSelect.value = 'latest';
            queryBtn.disabled = false;
        } else {
            versionSelect.disabled = !departmentId;
            versionSelect.innerHTML = '<option value="">请选择版本</option>';
            queryBtn.disabled = true;

            if (departmentId) {
                try {
                    // ... 原有的版本加载代码 ...
                } catch (error) {
                    console.error('加载版本错误:', error);
                    alert('加载版本列表失败: ' + error.message);
                }
            }
        }

    if (departmentId) {
        try {
            console.log('发送版本请求:', `/api/versions?department=${departmentId}`);  // 调试信息

            const response = await fetch(`/api/versions?department=${departmentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            console.log('版本请求状态:', response.status);  // 调试信息

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('版本数据:', data);  // 调试信息

            if (data.success && Array.isArray(data.versions)) {
                if (data.versions.length === 0) {
                    console.log('没有找到版本数据');  // 调试信息
                    versionSelect.innerHTML = '<option value="">无可用版本</option>';
                } else {
                    data.versions.forEach(version => {
                        console.log('添加版本选项:', version);  // 调试信息
                        const option = document.createElement('option');
                        option.value = version;
                        option.textContent = version;
                        versionSelect.appendChild(option);
                    });
                }
            } else {
                throw new Error(data.message || '加载版本列表失败');
            }
        } catch (error) {
            console.error('加载版本错误:', error);
            alert('加载版本列表失败: ' + error.message);
        }
    }
}

    // 处理版本选择变化
    function handleVersionChange() {
        queryBtn.disabled = !this.value;
    }

    // 处理查询请求
    async function handleQuery() {
        const departmentId = departmentSelect.value;
        const version = versionSelect.value;

        console.log('查询参数:', {
            departmentId,
            version,
            token: localStorage.getItem('access_token')
        });

        if (!departmentId || !version) {
            alert('请选择部门和版本');
            return;
        }

        try {
            console.log('发送请求到:', `/api/assessments?department=${departmentId}&version=${version}`);

            const response = await fetch(`/api/assessments?department=${departmentId}&version=${version}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('响应状态:', response.status);

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('无权限查看该部门的绩效信息');
                }
                throw new Error(`请求失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('返回数据:', data);

            if (data.success) {
                console.log('准备显示数据:', data.assessments);
                displayAssessments(data.assessments);
                exportBtn.style.display = 'block';
            } else {
                throw new Error(data.message || '查询失败');
            }
        } catch (error) {
            console.error('查询错误详情:', error);
            alert(error.message || '查询失败，请重试');
        }
    }

    function displayAssessments(assessments) {
    console.log('开始处理显示数据');
    const tableBody = document.getElementById('assessmentTableBody');

    if (!assessments || assessments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">没有找到匹配的记录</td></tr>';
        resultSection.style.display = 'block';
        return;
    }

    tableBody.innerHTML = '';

    assessments.forEach((deptData, index) => {
        // 添加部门标题行
        const deptRow = document.createElement('tr');
        deptRow.className = 'department-header';

        // 获取统计信息
        let headerText = deptData.department_name;
        if (deptData.assessments && deptData.assessments.stats) {
            // 从正确的数据结构中获取统计信息
            const stats = deptData.assessments.stats;
            headerText += ` AVG（A、B+）: ${stats.avg_grades} 个`;
            headerText += ` | 平均分: ${stats.avg_score || '-'}`;
            headerText += ` | 方差: ${stats.score_variance || '-'}`;
            headerText += ` | 已评分人数: ${stats.total_employees || '-'} 人`;
        }
        deptRow.innerHTML = `<td colspan="7">${headerText}</td>`;
        tableBody.appendChild(deptRow);

        // 获取实际的考核数据
        const assessmentData = deptData.assessments && deptData.assessments.assessments ?
                             deptData.assessments.assessments :
                             (Array.isArray(deptData.assessments) ? deptData.assessments : []);

        // 添加部门数据
        assessmentData.forEach(assessment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assessment.emp_id || ''}</td>
                <td>${assessment.emp_name || ''}</td>
                <td>${assessment.totalrank || ''}</td>
                <td>${assessment.totalscore || ''}</td>
                <td>${assessment.checktime || ''}</td>
                <td>${assessment.abiscore || ''}</td>
                <td>${assessment.productscore || ''}</td>
            `;
            tableBody.appendChild(row);
        });
    });

    resultSection.style.display = 'block';
}

    // 处理导出请求
    function handleExport() {
        const table = document.querySelector('.assessment-table');
        const rows = Array.from(table.querySelectorAll('tr'));

        // 准备CSV内容
        let csvContent = '\uFEFF'; // 添加BOM以支持中文

        // 添加表头
        const headers = ['员工ID', '姓名', '总评级', '总分', '评估时间', '职能分数', '产品分数'];
        csvContent += headers.join(',') + '\n';

        // 添加数据行
        let currentDepartment = '';
        rows.forEach(row => {
            if (row.classList.contains('department-header')) {
                currentDepartment = row.textContent;
                csvContent += `\n${currentDepartment}\n`;
            } else {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length === 7) { // 确保是数据行
                    const rowData = cells.map(cell => `"${cell.textContent}"`).join(',');
                    csvContent += rowData + '\n';
                }
            }
        });

        // 创建并下载文件
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = window.URL.createObjectURL(blob);
        link.download = `绩效评估数据_${timestamp}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
