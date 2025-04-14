document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const isManagerSelect = document.getElementById('member-is-manager');
    const isProductManagerSelect = document.getElementById('member-is-product-manager');
    const managerDepartmentDiv = document.getElementById('manager-department');
    const productLineDiv = document.getElementById('product-line');
    const managerDepartmentSelect = document.getElementById('manager-department-select');
    const productManagerSelect = document.getElementById('member-product-line2');

    managerDepartmentDiv.style.display = 'none';
    productLineDiv.style.display = 'none';

    const modal = document.getElementById('member-modal');

// 获取关闭按钮元素
    const closeButton = document.querySelector('.close');

// 当点击关闭按钮时关闭模态框
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

// 当点击模态框外部时关闭模态框
    modal.addEventListener('click', (event) => {
        // 检查点击的位置是否是模态框的背景（而非内容区域）
        if (event.target === modal) {
            modal.style.display = 'none';
            managerDepartmentDiv.style.display = 'none';
            productLineDiv.style.display = 'none';
        }
    });

    // 监听是否为部门经理选择
    isManagerSelect.addEventListener('change', function () {
        if (isManagerSelect.value == '1') {
            // 显示部门下拉框
            managerDepartmentDiv.style.display = 'block';
            managerDepartmentSelect.innerHTML = '';
            fetch("/api/teams",{
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(departments => {
                    // 填充部门选项
                    departments.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept.id;
                        option.textContent = dept.name;
                        managerDepartmentSelect.appendChild(option);
                    });
                });
        } else {
            managerDepartmentDiv.style.display = 'none';
            managerDepartmentSelect.innerHTML = '';
        }
    });

    // 监听是否为产品经理选择
    isProductManagerSelect.addEventListener('change', function () {
        if (isProductManagerSelect.value == '1') {
            // 显示产品线下拉框
            productLineDiv.style.display = 'block';
            productManagerSelect.innerHTML = '';
            fetch("/api/product_lines",{
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json()).then(productLines => {
                // 填充产品线选项、
                productLines.forEach(line => {
                    const option = document.createElement('option');
                    option.value = line.id;
                    option.textContent = line.name;
                    productManagerSelect.appendChild(option);
                })
            })
        } else {
            productLineDiv.style.display = 'none';
            productManagerSelect.innerHTML = '';
        }
    });

    document.getElementById('add-leader').addEventListener('click', function() {
        const leadersContainer = document.getElementById('leaders-container');
        const leaderInputGroups = leadersContainer.querySelectorAll('.leader-input-group');

        // 创建新的领导人输入组
        const newLeaderGroup = document.createElement('div');
        newLeaderGroup.className = 'leader-input-group';
        newLeaderGroup.innerHTML = `
            <input type="text" class="leader-id" name="leader-ids[]" placeholder="请输入工号" required>
            <button type="button" class="remove-leader">删除</button>
        `;

        // 添加到容器中
        leadersContainer.appendChild(newLeaderGroup);

        // 如果只有一个领导人，显示第一个删除按钮
        if (leaderInputGroups.length === 1) {
            leaderInputGroups[0].querySelector('.remove-leader').style.display = 'inline-block';
        }

        // 为新添加的删除按钮绑定事件
        newLeaderGroup.querySelector('.remove-leader').addEventListener('click', function() {

            newLeaderGroup.remove();

            // 如果只剩一个领导人，隐藏删除按钮
            const remainingGroups = leadersContainer.querySelectorAll('.leader-input-group');
            if (remainingGroups.length === 1) {
                remainingGroups[0].querySelector('.remove-leader').style.display = 'none';
            }
        });
    });

    const departmentModal = document.getElementById('department-modal');
    const productModal = document.getElementById('product-modal');
    const memberModal = document.getElementById('member-modal');
    const addDepartBtn = document.getElementById('add-department');
    const addProductBtn = document.getElementById('add-product');
    const addMemberBtn = document.getElementById('add-member');
    const departmentList = document.getElementById('department-list');
    const productList = document.getElementById('product-list');
    const memberTable = document.querySelector('.member-table tbody');
    const cardHeader = document.querySelector('.member-card .card-header .header-info h2');
    const memberCount = document.querySelector('.member-card .card-header .header-info .member-count');
    const memberLeader = document.querySelector('.member-card .card-header .header-info .member-leader');


    // 当前选中的部门/产品线ID和类型
    let currentType = null;
    let currentId = null;
    let currentName = '';

    // 获取token
    const token = localStorage.getItem('access_token')

    // 初始化加载数据
    initData();

    // 绑定事件
    if(addDepartBtn) addDepartBtn.addEventListener('click', showAddDepartmentModal);
    if(addProductBtn) addProductBtn.addEventListener('click', showAddProductModal);
    if(addMemberBtn) addMemberBtn.addEventListener('click', showAddMemberModal);

    // 关闭模态框按钮事件
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            managerDepartmentDiv.style.display = 'none';
            productLineDiv.style.display = 'none';
            this.closest('.modal').style.display = 'none';
        });
    });
    document.getElementById('department-form')?.addEventListener('submit', addDepartment);
    document.getElementById('product-form')?.addEventListener('submit', addProduct);
    document.getElementById('member-form')?.addEventListener('submit', addOrEditMember);


    // 初始化数据
    function initData() {
        // 加载部门数据
        fetchTeams();

        // 加载产品线数据
        fetchProductLines();

        // 初始化右侧卡片为空
        renderMembers([]);
        cardHeader.textContent = '成员列表';
        memberCount.textContent = '共0人';
    }

    // 获取部门列表
    function fetchTeams() {
        fetch('/api/teams', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取部门数据失败');
                }
                return response.json();
            })
            .then(data => {
                renderDepartments(data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('获取部门数据失败，请重试！');
            });
    }

    // 获取产品线列表
    function fetchProductLines() {
        fetch('/api/product_lines', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取产品线数据失败');
                }
                return response.json();
            })
            .then(data => {
                renderProductLines(data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('获取产品线数据失败，请重试！');
            });
    }

    // 渲染部门列表
    function renderDepartments(departments) {
        departmentList.innerHTML = '';
        departments.forEach(dept => {
            const li = document.createElement('li');
            console.log(dept);
            li.className = 'list-item';
            li.dataset.id = dept.id;
            li.innerHTML = `
                <span class="item-name">${dept.name}</span>
                <span class="item-count">(${dept.number}人)</span>
                <button class="btn-remove" title="删除部门">-</button>
            `;

            // 点击部门事件
            li.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-remove')) {
                    const deptId = this.dataset.id;
                    const deptName = this.querySelector('.item-name').textContent;
                    selectDepartment(deptId, deptName);
                }
            });

            // 删除部门事件
            li.querySelector('.btn-remove').addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                const deptId = li.dataset.id;
                const deptName = li.querySelector('.item-name').textContent;
                confirmDelete('部门', deptName, () => deleteDepartment(deptId));
            });

            departmentList.appendChild(li);
        });
    }

    // 渲染产品线列表
    function renderProductLines(productLines) {
        productList.innerHTML = '';
        productLines.forEach(product => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.dataset.id = product.id;
            li.innerHTML = `
                <span class="item-name">${product.name}</span>
                <span class="item-count">(${product.number}人)</span>
                <button class="btn-remove" title="删除产品线">-</button>
            `;

            // 点击产品线事件
            li.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-remove')) {
                    const productId = this.dataset.id;
                    const productName = this.querySelector('.item-name').textContent;
                    selectProductLine(productId, productName);
                }
            });

            // 删除产品线事件
            li.querySelector('.btn-remove').addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                const productId = li.dataset.id;
                const productName = li.querySelector('.item-name').textContent;
                confirmDelete('产品线', productName, () => deleteProductLine(productId));
            });

            productList.appendChild(li);
        });
    }

    // 选择部门
    function selectDepartment(id, name) {
        // 更新当前选中状态
        currentType = 'department';
        currentId = id;
        currentName = name;

        // 更新UI选中状态
        document.querySelectorAll('#department-list .list-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === id) {
                item.classList.add('active');
            }
        });
        document.querySelectorAll('#product-list .list-item').forEach(item => {
            item.classList.remove('active');
        });

        // 更新右侧标题
        cardHeader.textContent = `${name}成员列表`;

        // 获取部门成员
        fetchDepartmentMembers(id);
    }

    // 选择产品线
    function selectProductLine(id, name) {
        // 更新当前选中状态
        currentType = 'product';
        currentId = id;
        currentName = name;

        // 更新UI选中状态
        document.querySelectorAll('#product-list .list-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === id) {
                item.classList.add('active');
            }
        });
        document.querySelectorAll('#department-list .list-item').forEach(item => {
            item.classList.remove('active');
        });

        // 更新右侧标题
        cardHeader.textContent = `${name}成员列表`;

        // 获取产品线成员
        fetchProductLineMembers(id);
    }

    // 获取部门成员
    function fetchDepartmentMembers(departmentId) {
        fetch(`/department_members/${departmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取部门成员失败');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                renderMembers(data || []);
                memberCount.textContent = `共${(data || []).length}人`;
                fetch('department_leader', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({id: departmentId})
                })
                    .then(response => response.json())
                    .then(res => {
                        leader_name = res.leader_name;
                        if (leader_name) {
                            console.log("leader_name:", leader_name);
                            memberLeader.textContent = `负责人:${leader_name}`;
                        } else {
                            memberLeader.textContent = `负责人:无`;
                        }
                    })
                    .catch(error => {
                        console.error('获取部门负责人信息失败:', error);
                    });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('获取部门成员失败，请重试！');
                renderMembers([]);
                memberCount.textContent = '共0人';
            });
    }

    // 获取产品线成员
    function fetchProductLineMembers(productId) {
        fetch(`/product_line_members/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取产品线成员失败');
                }
                return response.json();
            })
            .then(data => {
                renderMembers(data || []);
                memberCount.textContent = `共${(data || []).length}人`;
                memberLeader.textContent = '';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('获取产品线成员失败，请重试！');
                renderMembers([]);
                memberCount.textContent = '共0人';
                memberLeader.textContent = '';
            });
    }


    // 渲染成员列表
    function renderMembers(members) {
        memberTable.innerHTML = '';

        if (!members || members.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" style="text-align:center;">暂无成员</td>';
            memberTable.appendChild(tr);
            return;
        }
        console.log("members", members);
        members.forEach(member => {
            const tr = document.createElement('tr');
            tr.dataset.id = member.emp_id;
            tr.dataset.empno = member.emp_id; // 修正：使用emp_id作为工号
            tr.innerHTML = `
                <td>${member.emp_name}</td>
                <td>${member.emp_id}</td>
                <td>${member.position || '-'}</td>
                <td>${member.department}</td>
                <td>${member.ProductGroup}</td>
                <td>
                    <button class="btn-edit">修改</button>
                    <button class="btn-delete">删除</button>
                </td>
            `;

            // 修改成员事件
            tr.querySelector('.btn-edit').addEventListener('click', function() {
                showEditMemberModal(member);
            });

            // 删除成员事件
            tr.querySelector('.btn-delete').addEventListener('click', function() {
                confirmDelete('成员', member.emp_name, () => deleteMember(member.emp_id));
            });

            memberTable.appendChild(tr);
        });
    }

    // 显示新增部门模态框
    function showAddDepartmentModal() {
        // 重置表单
        document.getElementById('department-form').reset();
        document.querySelector('#department-modal h2').textContent = '新增部门';
        departmentModal.style.display = 'block';
    }

    // 显示新增产品线模态框
    function showAddProductModal() {
        // 重置表单
        document.getElementById('product-form').reset();
        document.querySelector('#product-modal h2').textContent = '新增产品线';
        productModal.style.display = 'block';
    }

    // 显示新增成员模态框
    function showAddMemberModal() {

        // 重置表单并更新标题
        const form = document.getElementById('member-form');
        form.reset();
        document.querySelector('#member-modal h2').textContent = '新增成员';

        // 设置表单属性
        form.dataset.mode = 'add';

        // 启用工号输入
        document.getElementById('member-id').disabled = false;

        // 加载部门和产品线下拉框数据
        loadFormSelectOptions();

        memberModal.style.display = 'block';
    }

    // 显示编辑成员模态框
    function showEditMemberModal(member) {
        // 更新标题
        document.querySelector('#member-modal h2').textContent = '编辑成员';

        // 设置表单属性
        const form = document.getElementById('member-form');
        form.dataset.mode = 'edit';
        form.dataset.empno = member.emp_id;

        // 加载部门和产品线下拉框数据
        loadFormSelectOptions(() => {
            // 获取成员详细信息
            fetch(`/get_employee_info?emp_id=${member.emp_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('获取成员详情失败');
                    }
                    return response.json();
                })
                .then(userData => {
                    // 填充表单数据
                    document.getElementById('member-name').value = userData.emp_name || '';
                    document.getElementById('member-id').value = userData.emp_id || '';
                    document.getElementById('member-id').disabled = true; // 工号不可修改
                    document.getElementById('member-position').value = userData.position || '';

                    // 设置部门下拉框
                    if (userData.departmentid) {
                        console.log("userData.departmentid",userData.departmentid)
                        const deptSelect = document.getElementById('member-department');
                        for (let i = 0; i < deptSelect.options.length; i++) {
                            console.log("deptSelect.options[i].value",deptSelect.options[i].value)
                            if (deptSelect.options[i].value == userData.departmentid) {
                                deptSelect.selectedIndex = i;
                                console.log("deptSelect.selectedIndex",deptSelect.selectedIndex)
                                break;
                            }
                        }
                    }


                    // 设置是否为部门经理
                    document.getElementById('member-is-manager').value = userData.is_manager ? '1' : '0';

                    // 设置是否为产品经理
                    document.getElementById('member-is-product-manager').value = userData.is_product_manager ? '1' : '0';

                    // 设置产品线打分人（现在是输入框）
                    document.getElementById('member-product-line-rater').value = userData.product_line_rater || '';
                    // 设置产品线下拉框
                    if (userData.productid) {
                        const productSelect = document.getElementById('member-product-line');
                        for (let i = 0; i < productSelect.options.length; i++) {
                            if (productSelect.options[i].value == userData.productid) {
                                productSelect.selectedIndex = i;
                                console.log(productSelect.selectedIndex,"!!!!!!!!");
                                break;
                            }
                        }
                        const productLineRaterSelect = document.getElementById('member-product-line-rater');
                        fetch(`/getProductManager?product_line_id=${userData.productid}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        })
                            .then(response => response.json())
                            .then(managers => {
                                // 添加请选择选项
                                productLineRaterSelect.innerHTML = '';
                                const defaultOption = document.createElement('option');
                                defaultOption.value = '';
                                defaultOption.textContent = '请选择打分人';
                                productLineRaterSelect.appendChild(defaultOption);
                                console.log("managers", managers.length);
                                if (managers.length > 0) {
                                    // 填充打分人选项
                                    managers.forEach(manager => {
                                        const option = document.createElement('option');
                                        option.value = manager.emp_id;
                                        option.textContent = manager.name;
                                        console.log("option.value", option.value);
                                        productLineRaterSelect.appendChild(option);
                                    });
                                }
                                else{
                                    defaultOption.value = '';
                                    defaultOption.textContent = '该产品线无负责人';
                                    productLineRaterSelect.appendChild(defaultOption);
                                }

                                if (userData.directJudgeid) {
                                    console.log("userData.directJudgeid",userData.directJudgeid)
                                    for (let i = 0; i < productLineRaterSelect.options.length; i++) {
                                        console.log("productLineRaterSelect.options[i].value",productLineRaterSelect.options[i].value)
                                        if (productLineRaterSelect.options[i].value == userData.directJudgeid) {
                                            productLineRaterSelect.selectedIndex = i;
                                            console.log("productLineRaterSelect.selectedIndex",productLineRaterSelect.selectedIndex)
                                            break;
                                        }
                                    }
                                }
                            })
                            .catch(error => {
                                console.error('Error loading product managers:', error);
                                const defaultOption = document.createElement('option');
                                defaultOption.value = '';
                                defaultOption.textContent = '加载打分人失败';
                                productLineRaterSelect.appendChild(defaultOption);
                            });
                    }

                    memberModal.style.display = 'block';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('获取成员详情失败，请重试！');
                });
        });
    }

    // 加载表单选择框选项
    function loadFormSelectOptions(callback) {
        // 获取下拉框元素
        const departmentSelect = document.getElementById('member-department');
        const productLineSelect = document.getElementById('member-product-line');

        // 清空现有选项
        departmentSelect.innerHTML = '<option value="">请选择部门</option>';
        productLineSelect.innerHTML = '<option value="">请选择产品线</option>';

        // 请求获取部门列表
        fetch('/api/teams', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(departments => {
                // 填充部门选项
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    departmentSelect.appendChild(option);
                });

                // 请求获取产品线列表
                return fetch('/api/product_lines', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            })
            .then(response => response.json())
            .then(productLines => {
                // 填充产品线选项
                productLines.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = product.name;
                    productLineSelect.appendChild(option);
                });
                productLineSelect.addEventListener('change', function() {
                    const selectedProductLineId = this.value;
                    const productLineRaterSelect = document.getElementById('member-product-line-rater');

                    // 清空产品线打分人下拉框
                    productLineRaterSelect.innerHTML = '';

                    if (!selectedProductLineId) {
                        // 如果未选择产品线，显示默认选项
                        const defaultOption = document.createElement('option');
                        defaultOption.value = '';
                        defaultOption.textContent = '未选择产品线';
                        productLineRaterSelect.appendChild(defaultOption);
                    } else {
                        // 获取选中产品线的打分人
                        fetch(`/getProductManager?product_line_id=${selectedProductLineId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        })
                            .then(response => response.json())
                            .then(managers => {
                                // 添加请选择选项
                                productLineRaterSelect.innerHTML = '';
                                const defaultOption = document.createElement('option');
                                defaultOption.value = '';
                                defaultOption.textContent = '请选择打分人';
                                productLineRaterSelect.appendChild(defaultOption);
                                console.log("managers", managers.length);
                                if (managers.length > 0) {
                                    // 填充打分人选项
                                    managers.forEach(manager => {
                                        const option = document.createElement('option');
                                        option.value = manager.emp_id;
                                        option.textContent = manager.name;
                                        productLineRaterSelect.appendChild(option);
                                    });
                                }
                                else{
                                    defaultOption.value = '';
                                    defaultOption.textContent = '该产品线无负责人';
                                    productLineRaterSelect.appendChild(defaultOption);
                                }
                            })
                            .catch(error => {
                                console.error('Error loading product managers:', error);
                                const defaultOption = document.createElement('option');
                                defaultOption.value = '';
                                defaultOption.textContent = '加载打分人失败';
                                productLineRaterSelect.appendChild(defaultOption);
                            });
                    }
                });

// 初始化产品线打分人下拉框为"未选择产品线"
                const productLineRaterSelect = document.getElementById('member-product-line-rater');
                productLineRaterSelect.innerHTML = '';
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '未选择产品线';
                productLineRaterSelect.appendChild(defaultOption);

                // 执行回调函数（如果有的话）
                if (typeof callback === 'function') {
                    callback();
                }
            })
            .catch(error => {
                console.error('Error loading form options:', error);
                alert('加载表单选项失败，请重试！');
            });
    }

    // 新增部门
    function addDepartment(e) {
        e.preventDefault();

        const departmentName = document.getElementById('department-name').value.trim();
        if (!departmentName) {
            alert('请输入部门名称');
            return;
        }
        const leader_id = document.getElementById('leader_id').value.trim();
        if (!leader_id) {
            alert('请输入部门领导工号');
            return;
        }

        fetch('/api/add_depart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: departmentName , leader_id: leader_id})
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('新增部门失败');
                }
                return response.json();
            })
            .then(data => {
                alert('新增部门成功');
                departmentModal.style.display = 'none';
                fetchTeams(); // 重新加载部门列表
            })
            .catch(error => {
                console.error('Error:', error);
                alert('新增部门失败，请重试！');
            });
    }

    // 新增产品线
    function addProduct(e) {
        e.preventDefault();

        const productName = document.getElementById('product-name').value.trim();
        const leaderIds = Array.from(document.querySelectorAll('.leader-id')).map(input => input.value);
        if (!productName) {
            alert('请输入产品线名称');
            return;
        }

        fetch('/api/add_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: productName, leader_ids: leaderIds })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('新增产品线失败');
                }
                return response.json();
            })
            .then(data => {
                alert('新增产品线成功');
                productModal.style.display = 'none';
                fetchProductLines(); // 重新加载产品线列表
            })
            .catch(error => {
                console.error('Error:', error);
                alert('新增产品线失败，请重试！');
            });
    }

    // 新增/编辑成员
    function addOrEditMember(e) {
        e.preventDefault();

        const form = e.target;
        const mode = form.dataset.mode;
        const isAdd = mode === 'add';

        // 收集表单数据
        const memberData = {
            name: document.getElementById('member-name').value.trim(),
            empno: document.getElementById('member-id').value.trim(),
            position: document.getElementById('member-position').value.trim(),
            is_manager: document.getElementById('member-is-manager').value === '1',
            department_id: document.getElementById('member-department').value || '0',
            is_product_manager: document.getElementById('member-is-product-manager').value === '1',
            product_line_id: document.getElementById('member-product-line').value || '0',
            product_line_rater: document.getElementById('member-product-line-rater').value ,// 直接获取输入的产品线打分人
            manageDepartment : managerDepartmentSelect.value || -1,
            manageProduct : productManagerSelect.value || -1
        };

        // 验证必填字段
        if (!memberData.name || !memberData.empno) {
            alert('请填写必填信息（姓名、工号）');
            return;
        }

        const url = isAdd ? '/api/adduser' : '/api/edituser';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(memberData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(isAdd ? '新增成员失败' : '编辑成员失败');
                }
                return response.json();
            })
            .then(data => {
                alert(isAdd ? '新增成员成功' : '编辑成员成功');
                memberModal.style.display = 'none';

                // 刷新当前展示的成员列表
                if (currentType === 'department') {
                    fetchDepartmentMembers(currentId);
                } else if (currentType === 'product') {
                    fetchProductLineMembers(currentId);
                }
                managerDepartmentDiv.style.display = 'none';
                productLineDiv.style.display = 'none';
                // 刷新部门和产品线列表以更新人数
                fetchTeams();
                fetchProductLines();
            })
            .catch(error => {
                console.error('Error:', error);
                alert((isAdd ? '新增' : '编辑') + '成员失败，请重试！');
            });
    }

    // 删除部门
    function deleteDepartment(departmentId) {
        fetch('/api/delete_depart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: departmentId })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('删除部门失败');
                }
                return response.json();
            })
            .then(data => {
                alert('删除部门成功');
                fetchTeams(); // 重新加载部门列表

                // 如果删除的是当前选中的部门，则清空右侧内容
                if (currentType === 'department' && currentId === departmentId) {
                    renderMembers([]);
                    cardHeader.textContent = '成员列表';
                    memberCount.textContent = '共0人';
                    currentType = null;
                    currentId = null;
                    currentName = '';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            });
    }

    // 删除产品线
    function deleteProductLine(productId) {
        fetch('/api/delete_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: productId })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('删除产品线失败');
                }
                return response.json();
            })
            .then(data => {
                alert('删除产品线成功');
                fetchProductLines(); // 重新加载产品线列表

                // 如果删除的是当前选中的产品线，则清空右侧内容
                if (currentType === 'product' && currentId === productId) {
                    renderMembers([]);
                    cardHeader.textContent = '成员列表';
                    memberCount.textContent = '共0人';
                    currentType = null;
                    currentId = null;
                    currentName = '';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('删除产品线失败，请重试！');
            });
    }

    // 删除成员
    function deleteMember(empno) {
        fetch('/api/deleteuser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ empno: empno })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('删除成员失败');
                }
                return response.json();
            })
            .then(data => {
                alert('删除成员成功');

                // 刷新当前展示的成员列表
                if (currentType === 'department') {
                    fetchDepartmentMembers(currentId);
                } else if (currentType === 'product') {
                    fetchProductLineMembers(currentId);
                }

                // 刷新部门和产品线列表以更新人数
                fetchTeams();
                fetchProductLines();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('删除成员失败，请重试！');
            });
    }

    // 确认删除提示
    function confirmDelete(type, name, callback) {
        if (confirm(`确定要删除${type}【${name}】吗？`)) {
            callback();
        }
    }
});