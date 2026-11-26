/**
 * 书籍管理 - 前端交互逻辑
 */

// ==================== 全局状态 ====================
const state = {
    books: []
};

// API 基础URL
const API_BASE_URL = '/api';

// ==================== DOM 元素 ====================
const elements = {
    addBookBtn: document.querySelector('#addBookBtn'),
    bookTableBody: document.querySelector('#bookTableBody'),
    bookTable: document.querySelector('#bookTable'),
    emptyState: document.querySelector('#emptyState'),
    // 弹窗相关
    modalOverlay: document.querySelector('#modalOverlay'),
    modalTitle: document.querySelector('#modalTitle'),
    modalCloseBtn: document.querySelector('#modalClose'),
    modalCancelBtn: document.querySelector('#modalCancel'),
    modalSaveBtn: document.querySelector('#modalSave'),
    // 表单输入
    inputId: document.querySelector('#inputId'),
    inputTitle: document.querySelector('#inputTitle'),
    inputAuthor: document.querySelector('#inputAuthor'),
    inputPublisher: document.querySelector('#inputPublisher'),
    inputPages: document.querySelector('#inputPages'),
    inputPrice: document.querySelector('#inputPrice')
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    bindEventListeners();
    await loadBooks();
});

function bindEventListeners() {
    // 新增按钮
    elements.addBookBtn.addEventListener('click', openAddModal);

    // 弹窗关闭
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalCancelBtn.addEventListener('click', closeModal);

    // 保存
    elements.modalSaveBtn.addEventListener('click', saveBook);
}

// ==================== 数据加载 ====================

async function loadBooks() {
    try {
        const url = `${API_BASE_URL}/books`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.code !== 200) {
            throw new Error(result.message || '加载数据失败');
        }

        state.books = result.data || [];
        renderTable();
        toggleEmptyState();

    } catch (error) {
        console.error('加载书籍列表失败:', error);
        showError('加载书籍列表失败');
    }
}

// ==================== 表格渲染 ====================

function renderTable() {
    elements.bookTableBody.innerHTML = '';

    state.books.forEach(book => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${escapeHtml(book.id)}</td>
            <td><strong>${escapeHtml(book.title)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.publisher)}</td>
            <td>${book.total_pages}</td>
            <td class="price">¥${book.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-delete" data-delete="${escapeHtml(book.id)}">🗑️ 删除</button>
            </td>
        `;

        // 删除按钮事件
        const deleteBtn = row.querySelector('[data-delete]');
        deleteBtn.addEventListener('click', () => deleteBook(book.id));

        elements.bookTableBody.appendChild(row);
    });
}

function toggleEmptyState() {
    if (state.books.length === 0) {
        elements.bookTable.style.display = 'none';
        elements.emptyState.style.display = 'flex';
    } else {
        elements.bookTable.style.display = '';
        elements.emptyState.style.display = 'none';
    }
}

// ==================== 弹窗管理 ====================

function openAddModal() {
    elements.modalTitle.textContent = '新增书籍';
    clearForm();
    elements.modalOverlay.classList.add('show');
}

function closeModal() {
    elements.modalOverlay.classList.remove('show');
    clearForm();
}

function clearForm() {
    elements.inputId.value = '';
    elements.inputTitle.value = '';
    elements.inputAuthor.value = '';
    elements.inputPublisher.value = '';
    elements.inputPages.value = '';
    elements.inputPrice.value = '';
}

// ==================== 保存（新增） ====================

async function saveBook() {
    const bookId = elements.inputId.value.trim();
    const title = elements.inputTitle.value.trim();
    const author = elements.inputAuthor.value.trim();
    const publisher = elements.inputPublisher.value.trim();
    const pages = parseInt(elements.inputPages.value);
    const price = parseFloat(elements.inputPrice.value);

    // 表单验证
    if (!bookId) {
        alert('请输入编号');
        elements.inputId.focus();
        return;
    }
    if (!title) {
        alert('请输入书名');
        elements.inputTitle.focus();
        return;
    }
    if (!author) {
        alert('请输入作者');
        elements.inputAuthor.focus();
        return;
    }
    if (!publisher) {
        alert('请输入出版社');
        elements.inputPublisher.focus();
        return;
    }
    if (!elements.inputPages.value || isNaN(pages) || pages < 1) {
        alert('请输入有效的总页数（正整数）');
        elements.inputPages.focus();
        return;
    }
    if (!elements.inputPrice.value || isNaN(price) || price < 0) {
        alert('请输入有效的价格');
        elements.inputPrice.focus();
        return;
    }

    const data = {
        id: bookId,
        title: title,
        author: author,
        publisher: publisher,
        total_pages: pages,
        price: price
    };

    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.code !== 200) {
            throw new Error(result.message || '新增失败');
        }

        closeModal();
        await loadBooks();
        console.log('新增成功', result.data);

    } catch (error) {
        console.error('保存书籍失败:', error);
        showError('保存书籍失败: ' + error.message);
    }
}

// ==================== 删除 ====================

async function deleteBook(bookId) {
    if (!confirm(`确定要删除编号为 "${bookId}" 的书籍吗？此操作不可恢复。`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.code !== 200) {
            throw new Error(result.message || '删除失败');
        }

        await loadBooks();
        console.log('删除成功', bookId);

    } catch (error) {
        console.error('删除书籍失败:', error);
        showError('删除书籍失败: ' + error.message);
    }
}

// ==================== 工具函数 ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    alert(message);
}
