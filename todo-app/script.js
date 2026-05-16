/* =========================
LOCAL STORAGE MANAGEMENT
========================= */

class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentCategory = null;
        this.sortBy = 'newest';
    }

    loadTasks() {
        const stored = localStorage.getItem('tasks');
        return stored ? JSON.parse(stored) : [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(taskData) {
        const task = {
            id: Date.now(),
            text: taskData.text,
            description: taskData.description || '',
            priority: taskData.priority || 'low',
            category: taskData.category || 'personal',
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: taskData.dueDate || null
        };

        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.saveTasks();
        }
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Filter by status
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        // Filter by category
        if (this.currentCategory) {
            filtered = filtered.filter(t => t.category === this.currentCategory);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'a-z':
                    return a.text.localeCompare(b.text);
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    }

    getStats() {
        return {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            active: this.tasks.filter(t => !t.completed).length,
            highPriority: this.tasks.filter(t => t.priority === 'high').length,
            categories: this.getCategoryCount(),
            priorities: this.getPriorityCount()
        };
    }

    getCategoryCount() {
        const count = {};
        this.tasks.forEach(t => {
            count[t.category] = (count[t.category] || 0) + 1;
        });
        return count;
    }

    getPriorityCount() {
        return {
            low: this.tasks.filter(t => t.priority === 'low').length,
            medium: this.tasks.filter(t => t.priority === 'medium').length,
            high: this.tasks.filter(t => t.priority === 'high').length
        };
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
    }

    exportTasks() {
        return JSON.stringify(this.tasks, null, 2);
    }

    importTasks(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (Array.isArray(imported)) {
                this.tasks = imported;
                this.saveTasks();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
}

/* =========================
UI CONTROLLER
========================= */

class UIController {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.generateParticles();
        this.setupCursor();
        this.loadTheme();
        this.render();
    }

    cacheElements() {
        // Main elements
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.categorySelect = document.getElementById('categorySelect');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');

        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.categoryTags = document.querySelectorAll('.category-tag');
        this.sortSelect = document.getElementById('sortSelect');

        // Action buttons
        this.clearBtn = document.getElementById('clearBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importInput = document.getElementById('importInput');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');

        // Stats
        this.statsBtn = document.getElementById('statsBtn');
        this.statsModal = document.getElementById('statsModal');
        this.closeStatsBtn = document.getElementById('closeStatsBtn');

        // Edit modal
        this.editModal = document.getElementById('editModal');
        this.closeEditBtn = document.getElementById('closeEditBtn');
        this.editForm = document.getElementById('editForm');
        this.editTaskId = null;
    }

    bindEvents() {
        // Add task
        this.addBtn.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });

        // Filter
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        this.categoryTags.forEach(tag => {
            tag.addEventListener('click', (e) => this.handleCategoryFilter(e));
        });

        // Sort
        this.sortSelect.addEventListener('change', (e) => {
            this.taskManager.sortBy = e.target.value;
            this.render();
        });

        // Actions
        this.clearBtn.addEventListener('click', () => this.handleClearCompleted());
        this.exportBtn.addEventListener('click', () => this.handleExport());
        this.importBtn.addEventListener('click', () => this.importInput.click());
        this.importInput.addEventListener('change', (e) => this.handleImport(e));

        // Theme
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Stats
        this.statsBtn.addEventListener('click', () => this.showStats());
        this.closeStatsBtn.addEventListener('click', () => this.closeStats());
        this.statsModal.addEventListener('click', (e) => {
            if (e.target === this.statsModal) this.closeStats();
        });

        // Edit modal
        this.closeEditBtn.addEventListener('click', () => this.closeEditModal());
        this.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });
    }

    handleAddTask() {
        const text = this.taskInput.value.trim();
        if (!text) {
            this.showNotification('Please enter a task!', 'warning');
            return;
        }

        this.taskManager.addTask({
            text,
            description: '',
            priority: this.prioritySelect.value,
            category: this.categorySelect.value
        });

        this.taskInput.value = '';
        this.render();
        this.showNotification('Task added successfully! ✨');
    }

    handleFilter(e) {
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.closest('.filter-btn').classList.add('active');
        this.taskManager.currentFilter = e.target.closest('.filter-btn').dataset.filter;
        this.render();
    }

    handleCategoryFilter(e) {
        e.target.closest('.category-tag').classList.toggle('active');

        const activeCategories = Array.from(this.categoryTags)
            .filter(tag => tag.classList.contains('active'))
            .map(tag => tag.dataset.category);

        this.taskManager.currentCategory = activeCategories.length === 1 ? activeCategories[0] : null;
        this.render();
    }

    handleClearCompleted() {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            this.taskManager.clearCompleted();
            this.render();
            this.showNotification('Completed tasks cleared! 🗑️');
        }
    }

    handleExport() {
        const data = this.taskManager.exportTasks();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported! 💾');
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (this.taskManager.importTasks(event.target.result)) {
                this.render();
                this.showNotification('Tasks imported successfully! 📥');
            } else {
                this.showNotification('Failed to import tasks. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        this.themeToggle.textContent = isDark ? '🌙' : '☀️';
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            this.themeToggle.textContent = '🌙';
        } else {
            this.themeToggle.textContent = '☀️';
        }
    }

    showStats() {
        const stats = this.taskManager.getStats();
        const statsHTML = this.generateStatsHTML(stats);
        document.getElementById('statsContent').innerHTML = statsHTML;
        this.statsModal.classList.add('active');
    }

    generateStatsHTML(stats) {
        const categoryCharts = Object.entries(stats.categories)
            .map(([cat, count]) => {
                const percentage = stats.total ? Math.round((count / stats.total) * 100) : 0;
                return `
                    <div class="chart-item">
                        <span class="chart-label">${this.capitalize(cat)}</span>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${percentage}%">${count}</div>
                        </div>
                    </div>
                `;
            })
            .join('');

        const priorityCharts = Object.entries(stats.priorities)
            .map(([pri, count]) => {
                const percentage = stats.total ? Math.round((count / stats.total) * 100) : 0;
                return `
                    <div class="chart-item">
                        <span class="chart-label">${this.capitalize(pri)}</span>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: ${percentage}%">${count}</div>
                        </div>
                    </div>
                `;
            })
            .join('');

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon total"><i class="fas fa-tasks"></i></div>
                    <div class="stat-info">
                        <h3>${stats.total}</h3>
                        <p>Total Tasks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon completed"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <h3>${stats.completed}</h3>
                        <p>Completed</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon active"><i class="fas fa-spinner"></i></div>
                    <div class="stat-info">
                        <h3>${stats.active}</h3>
                        <p>Active Tasks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pending"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="stat-info">
                        <h3>${stats.highPriority}</h3>
                        <p>High Priority</p>
                    </div>
                </div>
            </div>

            <div class="stats-charts">
                <div class="chart-container">
                    <h4><i class="fas fa-folder"></i> By Category</h4>
                    <div class="category-chart">${categoryCharts || '<p>No tasks yet</p>'}</div>
                </div>
                <div class="chart-container">
                    <h4><i class="fas fa-flag"></i> By Priority</h4>
                    <div class="priority-chart">${priorityCharts || '<p>No tasks yet</p>'}</div>
                </div>
            </div>
        `;
    }

    closeStats() {
        this.statsModal.classList.remove('active');
    }

    render() {
        const tasks = this.taskManager.getFilteredTasks();

        if (tasks.length === 0) {
            this.tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No tasks yet!</h3>
                    <p>Add a task to get started or adjust your filters.</p>
                </div>
            `;
            return;
        }

        this.tasksList.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');

        // Bind task events
        this.tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                this.taskManager.updateTask(taskId, { completed: e.target.checked });
                this.render();
            });
        });

        this.tasksList.querySelectorAll('.task-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-btn').dataset.taskId);
                this.showEditModal(taskId);
            });
        });

        this.tasksList.querySelectorAll('.task-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-btn').dataset.taskId);
                if (confirm('Delete this task?')) {
                    this.taskManager.deleteTask(taskId);
                    this.render();
                    this.showNotification('Task deleted! 🗑️');
                }
            });
        });
    }

    createTaskElement(task) {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const dueDateHtml = task.dueDate
            ? `<div class="task-badge task-due ${isOverdue ? 'overdue' : ''}">
                <i class="fas fa-calendar"></i>
                ${new Date(task.dueDate).toLocaleDateString()}
            </div>`
            : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-text">${this.escapeHtml(task.text)}</span>
                        <span class="task-badge" style="background: var(--priority-${task.priority}); border: none; color: var(--white);">
                            ${this.capitalize(task.priority)}
                        </span>
                    </div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <div class="task-badge task-category">
                            <i class="fas fa-folder"></i>
                            ${this.capitalize(task.category)}
                        </div>
                        ${dueDateHtml}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit" data-task-id="${task.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete" data-task-id="${task.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    showEditModal(taskId) {
        const task = this.taskManager.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editTaskId = taskId;
        document.getElementById('editTaskText').value = task.text;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskCategory').value = task.category;
        document.getElementById('editTaskDueDate').value = task.dueDate || '';

        this.editModal.classList.add('active');
    }

    handleEditSubmit(e) {
        e.preventDefault();

        this.taskManager.updateTask(this.editTaskId, {
            text: document.getElementById('editTaskText').value,
            description: document.getElementById('editTaskDescription').value,
            priority: document.getElementById('editTaskPriority').value,
            category: document.getElementById('editTaskCategory').value,
            dueDate: document.getElementById('editTaskDueDate').value
        });

        this.closeEditModal();
        this.render();
        this.showNotification('Task updated! 📝');
    }

    closeEditModal() {
        this.editModal.classList.remove('active');
        this.editForm.reset();
        this.editTaskId = null;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'bell' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    generateParticles() {
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 10 + 5) + 's';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particlesContainer.appendChild(particle);
        }
    }

    setupCursor() {
        const cursor = document.querySelector('.cursor');
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* =========================
INITIALIZE APP
========================= */

document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    new UIController(taskManager);
});
