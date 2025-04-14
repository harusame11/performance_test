document.addEventListener("DOMContentLoaded", async function () {
    document.querySelector('.search-button').addEventListener('click', performSearch);
    async function fetchUserInfo() {
        try {
            const response = await fetch("/api/me", {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) throw new Error("无法获取用户信息");

            const data = await response.json();
            return data.userinfo;
        } catch (error) {
            console.error("获取用户信息失败:", error);
            return null;
        }
    }

    async function fetchStaffList(userinfo) {
        try {
            const response = await fetch("/staffChecked", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userinfo })
            });

            if (!response.ok) throw new Error("无法获取员工列表");

            return await response.json();
        } catch (error) {
            console.error("获取员工列表失败:", error);
            return [];
        }
    }

    async function fetchEvaluationTables(empId) {
        console.log(empId)
        try {
            const response = await fetch("/showtablelist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({"empId":empId})
            });

            if (!response.ok) throw new Error("无法获取评测表");

            return await response.json();
        } catch (error) {
            console.error("获取评测表失败:", error);
            return [];
        }
    }

    async function main() {
        const userinfo = await fetchUserInfo();
        await loadFilterOptions();
        if (!userinfo) return;

        const staffList = await fetchStaffList(userinfo);
        if (staffList.length > 0) {
            renderStaffTable(staffList);
        } else {
            console.warn("未获取到员工列表");
        }
    }

    function renderStaffTable(staffList) {
        const tableBody = document.querySelector(".employee-table tbody");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        console.log(staffList);
        staffList.forEach(staff => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${staff.emp_id || "-"}</td>
                <td>${staff.position || "-"}</td>
                <td>${staff.emp_name || "-"}</td>
                <td>${staff.department || "-"}</td>
                <td>${staff.ProductGroup || "-"}</td>
                <td>${staff.ismanage ? "是" : "否"}</td>
                <td><button class="score-btn" data-emp-id="${staff.emp_id}" data-emp-name="${staff.emp_name}">评分</button></td>
            `;

            tableBody.appendChild(row);
        });

        document.querySelectorAll(".score-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const empId = this.getAttribute("data-emp-id");
                const empName = this.getAttribute("data-emp-name");
                showEvaluationModal(empId,empName);
            });
        });
    }

    async function showEvaluationModal(empId,empName) {
        const modalOverlay = document.createElement("div");
        modalOverlay.classList.add("modal-overlay");

        const modal = document.createElement("div");
        modal.classList.add("modal");

        modal.innerHTML = `
            <h2>对员工 ${empName} 进行评分</h2>
            <label for="evaluation-select">选择评测表：</label>
            <select id="evaluation-select">
                <option value="">加载中...</option>
            </select>
            <button id="confirm-btn">确认</button>
            <button class="close-btn">关闭</button>
        `;

        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        // 使用 await 获取 TableList
        let TableList = await fetchEvaluationTables(empId);
        console.log(typeof TableList);  // 检查 TableList 类型

        // 如果 fetch 返回空数组或错误，可以根据需要进行处理
        if (Array.isArray(TableList)) {
            const SelectBody = document.getElementById("evaluation-select");
            SelectBody.innerHTML = "";

            TableList.forEach(table => {
                const option = document.createElement("option");
                option.value = table.id;
                option.textContent = table.name;
                SelectBody.appendChild(option);
            });
        } else {
            console.error('TableList 不是有效的数组');
        }
        document.querySelector(".modal .close-btn").addEventListener("click", async function () {
            modalOverlay.remove()
        })
        document.getElementById("confirm-btn").addEventListener("click", async function () {
            const selectedTableId = document.getElementById("evaluation-select").value;
            if (!selectedTableId) {
                alert("请选择评测表");}
            window.location.href = `/score?emp_id=${empId}&table_id=${selectedTableId}`;
        });
        modalOverlay.style.display = "block";
    }

    async function loadFilterOptions() {
        try {
            // 获取团队列表
            const teamsResponse = await fetch('/api/teams', createAuthHeaders());
            if (!teamsResponse.ok) throw new Error('获取团队列表失败');
            const teams = await teamsResponse.json();

            // 填充团队下拉框
            const teamSelect = document.querySelector('select[name="team"]');
            teamSelect.innerHTML = '<option value="">全部</option>';
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                teamSelect.appendChild(option);
            });

            // 获取产品线列表
            const productLinesResponse = await fetch('/api/product_lines', createAuthHeaders());
            if (!productLinesResponse.ok) throw new Error('获取产品线列表失败');
            const productLines = await productLinesResponse.json();

            // 填充产品线下拉框
            const productLineSelect = document.querySelector('select[name="productLine"]');
            productLineSelect.innerHTML = '<option value="">全部</option>';
            productLines.forEach(productLine => {
                const option = document.createElement('option');
                option.value = productLine.id;
                option.textContent = productLine.name;
                productLineSelect.appendChild(option);
            });

        } catch (error) {
            console.error('加载筛选选项失败:', error);
            showMessage('加载筛选选项失败', 'error');
        }
    }
    async function performSearch() {
        try {
            // 获取所有筛选条件
            const filters = {
                team: document.querySelector('select[name="team"]').value,
                productLine: document.querySelector('select[name="productLine"]').value,
                name: document.querySelector('input[name="name"]').value.trim().toLowerCase(),
                employeeId: document.querySelector('input[name="employeeId"]').value.trim()
            };

            // 获取表格中的所有行
            const rows = document.querySelectorAll(".employee-table tbody tr");

            // 遍历每一行进行筛选
            rows.forEach(row => {
                let shouldShow = true;
                const columns = row.querySelectorAll("td");

                // 检查员工ID筛选条件
                if (filters.employeeId && columns[0].textContent.trim() !== filters.employeeId) {
                    shouldShow = false;
                }

                // 检查员工姓名筛选条件
                if (filters.name && !columns[2].textContent.trim().toLowerCase().includes(filters.name)) {
                    shouldShow = false;
                }

                // 检查部门筛选条件 (假设部门对应team)
                if (filters.team && columns[3].textContent.trim() !== document.querySelector(`select[name="team"] option[value="${filters.team}"]`)?.textContent) {
                    shouldShow = false;
                }

                // 检查产品线筛选条件
                if (filters.productLine && columns[4].textContent.trim() !== document.querySelector(`select[name="productLine"] option[value="${filters.productLine}"]`)?.textContent) {
                    shouldShow = false;
                }

                // 直属领导筛选条件 (这里假设没有直接展示在表格中，如果有需要可以调整)

                // 根据筛选结果显示或隐藏行
                row.style.display = shouldShow ? "" : "none";
            });

            // 统计显示的行数
            const visibleRows = document.querySelectorAll(".employee-table tbody tr:not([style*='display: none'])");

            // 显示筛选结果提示
            if (visibleRows.length === 0) {
                showMessage("没有找到符合条件的员工", "info");
            } else {
                showMessage(`显示 ${visibleRows.length} 名员工`, "success");
            }

            // 存储当前筛选条件到sessionStorage，方便后续使用
            sessionStorage.setItem('employeeQueryFilters', JSON.stringify(filters));

        } catch (error) {
            console.error('执行筛选失败:', error);
            showMessage('执行筛选失败', 'error');
        }
    }

    function getToken() {
        // 从localStorage或sessionStorage获取令牌
        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }

// 创建带有认证头的请求选项
    function createAuthHeaders() {
        const token = getToken();
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }
    function showMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        // 添加到页面
        document.body.appendChild(messageElement);

        // 自动消失
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 500);
        }, 3000);
    }
    main();
});