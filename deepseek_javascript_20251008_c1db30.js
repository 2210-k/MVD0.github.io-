// Основной скрипт приложения
class MVDSystem {
    constructor() {
        this.actions = [];
        this.licenses = [];
        this.accidents = [];
        this.arrests = [];
        this.currentGameDay = 100;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupNavigation();
        this.populateCodexLists();
        this.loadAllTables();
        this.updateStats();
        
        // Установка текущего игрового дня
        document.getElementById('current-game-day').value = this.currentGameDay;
    }
    
    // Загрузка данных из localStorage
    loadData() {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.actions = data.actions || [];
                this.licenses = data.licenses || [];
                this.accidents = data.accidents || [];
                this.arrests = data.arrests || [];
                this.currentGameDay = data.currentGameDay || 100;
            } catch (e) {
                console.error('Ошибка загрузки данных:', e);
                this.resetData();
            }
        }
    }
    
    // Сохранение данных в localStorage
    saveData() {
        const data = {
            actions: this.actions,
            licenses: this.licenses,
            accidents: this.accidents,
            arrests: this.arrests,
            currentGameDay: this.currentGameDay,
            version: CONFIG.VERSION,
            lastSave: new Date().toISOString()
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    }
    
    // Сброс данных
    resetData() {
        this.actions = [];
        this.licenses = [];
        this.accidents = [];
        this.arrests = [];
        this.currentGameDay = 100;
        this.saveData();
    }
    
    // Экспорт данных в JSON
    exportData() {
        const data = {
            actions: this.actions,
            licenses: this.licenses,
            accidents: this.accidents,
            arrests: this.arrests,
            currentGameDay: this.currentGameDay,
            version: CONFIG.VERSION,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mvd_system_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showAlert('Данные успешно экспортированы!', 'success');
    }
    
    // Импорт данных из JSON
    importData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Проверяем версию и структуру данных
                if (data.version && data.actions !== undefined) {
                    this.actions = data.actions || [];
                    this.licenses = data.licenses || [];
                    this.accidents = data.accidents || [];
                    this.arrests = data.arrests || [];
                    this.currentGameDay = data.currentGameDay || 100;
                    
                    this.saveData();
                    this.loadAllTables();
                    this.updateStats();
                    
                    this.showAlert('Данные успешно импортированы!', 'success');
                } else {
                    this.showAlert('Неверный формат файла!', 'error');
                }
            } catch (error) {
                this.showAlert('Ошибка при импорте данных!', 'error');
                console.error('Ошибка импорта:', error);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Вход в систему
        document.getElementById('login-btn').addEventListener('click', () => {
            const password = document.getElementById('service-password').value;
            if (password === CONFIG.PASSWORD) {
                document.getElementById('password-prompt').classList.add('hidden');
                document.getElementById('service-content').classList.remove('hidden');
            } else {
                document.getElementById('password-error').classList.remove('hidden');
            }
        });
        
        // Управление игровым днем
        document.getElementById('increase-day').addEventListener('click', () => {
            this.currentGameDay++;
            document.getElementById('current-game-day').value = this.currentGameDay;
            this.saveData();
            this.loadLicensesTable();
        });
        
        document.getElementById('decrease-day').addEventListener('click', () => {
            if (this.currentGameDay > 0) {
                this.currentGameDay--;
                document.getElementById('current-game-day').value = this.currentGameDay;
                this.saveData();
                this.loadLicensesTable();
            }
        });
        
        document.getElementById('current-game-day').addEventListener('change', (e) => {
            this.currentGameDay = parseInt(e.target.value) || 0;
            this.saveData();
            this.loadLicensesTable();
        });
        
        // Синхронизация данных
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
                e.target.value = ''; // Сброс значения
            }
        });
        
        document.getElementById('save-backup-btn').addEventListener('click', () => {
            const data = {
                actions: this.actions,
                licenses: this.licenses,
                accidents: this.accidents,
                arrests: this.arrests,
                currentGameDay: this.currentGameDay,
                version: CONFIG.VERSION,
                exportDate: new Date().toISOString()
            };
            
            document.getElementById('data-backup').value = JSON.stringify(data, null, 2);
            this.showAlert('Резервная копия создана!', 'success');
        });
        
        document.getElementById('load-backup-btn').addEventListener('click', () => {
            try {
                const data = JSON.parse(document.getElementById('data-backup').value);
                
                if (data.version && data.actions !== undefined) {
                    this.actions = data.actions || [];
                    this.licenses = data.licenses || [];
                    this.accidents = data.accidents || [];
                    this.arrests = data.arrests || [];
                    this.currentGameDay = data.currentGameDay || 100;
                    
                    this.saveData();
                    this.loadAllTables();
                    this.updateStats();
                    
                    this.showAlert('Данные успешно восстановлены из резервной копии!', 'success');
                } else {
                    this.showAlert('Неверный формат данных!', 'error');
                }
            } catch (error) {
                this.showAlert('Ошибка при восстановлении данных!', 'error');
                console.error('Ошибка восстановления:', error);
            }
        });
        
        document.getElementById('clear-all-data-btn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить все данные? Это действие невозможно отменить.')) {
                const password = prompt('Введите пароль для подтверждения:');
                if (password === CONFIG.PASSWORD) {
                    this.resetData();
                    this.loadAllTables();
                    this.updateStats();
                    this.showAlert('Все данные удалены!', 'success');
                } else {
                    this.showAlert('Неверный пароль!', 'error');
                }
            }
        });
        
        // Остальные обработчики событий для форм и таблиц...
    }
    
    // Настройка навигации
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                const sectionId = item.getAttribute('data-section');
                document.getElementById(`${sectionId}-section`).classList.remove('hidden');
            });
        });
    }
    
    // Заполнение списков кодексов
    populateCodexLists() {
        // Реализация заполнения списков статей...
    }
    
    // Загрузка всех таблиц
    loadAllTables() {
        this.loadActionsTable();
        this.loadLicensesTable();
        this.loadAccidentsTable();
        this.loadArrestsTable();
    }
    
    // Загрузка таблицы действий
    loadActionsTable() {
        // Реализация загрузки таблицы действий...
    }
    
    // Загрузка таблицы ВУ
    loadLicensesTable() {
        // Реализация загрузки таблицы ВУ...
    }
    
    // Загрузка таблицы ДТП
    loadAccidentsTable() {
        // Реализация загрузки таблицы ДТП...
    }
    
    // Загрузка таблицы арестов
    loadArrestsTable() {
        // Реализация загрузки таблицы арестов...
    }
    
    // Обновление статистики
    updateStats() {
        document.getElementById('total-actions').textContent = this.actions.length;
        document.getElementById('total-licenses').textContent = this.licenses.length;
        document.getElementById('total-accidents').textContent = this.accidents.length;
        document.getElementById('total-arrests').textContent = this.arrests.length;
    }
    
    // Показать уведомление
    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <div>${message}</div>
        `;
        
        document.querySelector('.content').insertBefore(alert, document.querySelector('.section.active'));
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
    
    // Генерация ID
    generateId() {
        return 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.mvdSystem = new MVDSystem();
});