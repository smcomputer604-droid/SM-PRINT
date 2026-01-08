// ===============================
// ShopFlow - Daily Sales Tracker
// Frontend JavaScript
// ===============================

// Configuration
const CONFIG = {
    APP_NAME: 'ShopFlow',
    VERSION: '1.0.0',
    DEFAULT_API_URL: '',
    STORAGE_KEY: 'shopflow_data',
    DEMO_MODE: true
};

// Services data with icons
const SERVICES = [
    { id: 1, name: 'Photo Print', icon: 'fas fa-image' },
    { id: 2, name: 'Photocopy', icon: 'fas fa-copy' },
    { id: 3, name: 'Document Print', icon: 'fas fa-file-alt' },
    { id: 4, name: 'Scan', icon: 'fas fa-scanner' },
    { id: 5, name: 'Laminating', icon: 'fas fa-layer-group' },
    { id: 6, name: 'Compose', icon: 'fas fa-edit' },
    { id: 7, name: 'Frame', icon: 'fas fa-border-all' },
    { id: 8, name: 'Mug', icon: 'fas fa-mug-hot' },
    { id: 9, name: 'Crest', icon: 'fas fa-award' },
    { id: 10, name: 'T-shirt Print', icon: 'fas fa-tshirt' },
    { id: 11, name: 'Online Application', icon: 'fas fa-globe' },
    { id: 12, name: 'Others', icon: 'fas fa-ellipsis-h' }
];

// State Management
class AppState {
    constructor() {
        this.selectedService = null;
        this.currentCashAmount = 0;
        this.lastCashDate = '';
        this.apiUrl = localStorage.getItem('shopflow_api_url') || CONFIG.DEFAULT_API_URL;
        this.isDemoMode = !this.apiUrl;
        this.sales = JSON.parse(localStorage.getItem('shopflow_sales') || '[]');
        this.cashEntries = JSON.parse(localStorage.getItem('shopflow_cash') || '[]');
        this.expenses = JSON.parse(localStorage.getItem('shopflow_expenses') || '[]');
    }

    // Save to localStorage
    saveToStorage() {
        localStorage.setItem('shopflow_sales', JSON.stringify(this.sales));
        localStorage.setItem('shopflow_cash', JSON.stringify(this.cashEntries));
        localStorage.setItem('shopflow_expenses', JSON.stringify(this.expenses));
    }

    // Add a sale
    addSale(saleData) {
        this.sales.push({
            ...saleData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        this.saveToStorage();
    }

    // Add cash entry
    addCashEntry(cashData) {
        // Check if entry exists for this date
        const existingIndex = this.cashEntries.findIndex(entry => entry.date === cashData.date);
        
        if (existingIndex !== -1) {
            this.cashEntries[existingIndex] = {
                ...cashData,
                id: this.cashEntries[existingIndex].id,
                timestamp: new Date().toISOString()
            };
        } else {
            this.cashEntries.push({
                ...cashData,
                id: Date.now(),
                timestamp: new Date().toISOString()
            });
        }
        
        this.currentCashAmount = cashData.amount;
        this.lastCashDate = cashData.date;
        this.saveToStorage();
    }

    // Add expense
    addExpense(expenseData) {
        this.expenses.push({
            ...expenseData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        this.saveToStorage();
    }

    // Get last cash entry
    getLastCashEntry() {
        if (this.cashEntries.length === 0) return null;
        
        // Sort by date descending
        const sortedEntries = [...this.cashEntries].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        return sortedEntries[0];
    }

    // Update API URL
    updateApiUrl(url) {
        this.apiUrl = url;
        this.isDemoMode = !url;
        localStorage.setItem('shopflow_api_url', url);
    }
}

// Initialize app state
const appState = new AppState();

// DOM Elements
class DOMElements {
    constructor() {
        // Header
        this.menuBtn = document.getElementById('menuBtn');
        this.dropdownMenu = document.getElementById('dropdownMenu');
        
        // Services
        this.servicesGrid = document.getElementById('servicesGrid');
        
        // Modals
        this.serviceModal = document.getElementById('serviceModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        
        // Service Modal Elements
        this.modalServiceName = document.getElementById('modalServiceName');
        this.serviceAmountInput = document.getElementById('serviceAmount');
        this.customerNameInput = document.getElementById('customerName');
        this.submitServiceBtn = document.getElementById('submitServiceBtn');
        this.serviceLoading = document.getElementById('serviceLoading');
        
        // Cash Elements
        this.cashDateInput = document.getElementById('cashDate');
        this.cashAmountInput = document.getElementById('cashAmount');
        this.submitCashBtn = document.getElementById('submitCashBtn');
        this.cashLoading = document.getElementById('cashLoading');
        this.currentCashAmountDisplay = document.getElementById('currentCashAmount');
        this.cashDateDisplay = document.getElementById('cashDateDisplay');
        
        // Expense Elements
        this.expenseAmountInput = document.getElementById('expenseAmount');
        this.expensePurposeInput = document.getElementById('expensePurpose');
        this.submitExpenseBtn = document.getElementById('submitExpenseBtn');
        this.expenseLoading = document.getElementById('expenseLoading');
        
        // Settings Elements
        this.apiUrlInput = document.getElementById('apiUrl');
        this.modeDisplay = document.getElementById('modeDisplay');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.testApiBtn = document.getElementById('testApiBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        // Toast Container
        this.toastContainer = document.getElementById('toastContainer');
        
        // Menu Items
        this.dailyReportBtn = document.getElementById('dailyReportBtn');
        this.monthlyReportBtn = document.getElementById('monthlyReportBtn');
    }
}

// UI Utilities
class UIUtils {
    static formatCurrency(amount) {
        return '₹' + parseFloat(amount).toLocaleString('en-IN');
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        dom.toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }, duration);
        
        return toast;
    }

    static showLoading(loadingElement) {
        loadingElement.classList.add('active');
    }

    static hideLoading(loadingElement) {
        loadingElement.classList.remove('active');
    }

    static validateNumberInput(input) {
        const value = input.value.trim();
        return value && !isNaN(value) && parseFloat(value) > 0;
    }

    static validateTextInput(input) {
        return input.value.trim().length > 0;
    }
}

// API Service
class APIService {
    static async sendData(endpoint, data) {
        if (appState.isDemoMode) {
            // Simulate API delay for demo
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, message: 'Data saved in demo mode' };
        }

        try {
            const response = await fetch(appState.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: endpoint,
                    data: data
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(`Failed to connect to server: ${error.message}`);
        }
    }

    static async testConnection() {
        if (!appState.apiUrl) {
            return { success: false, message: 'No API URL configured' };
        }

        try {
            const response = await fetch(appState.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'test'
                })
            });

            const result = await response.json();
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: `Connection failed: ${error.message}` };
        }
    }
}

// Service Module
class ServiceModule {
    static renderServices() {
        dom.servicesGrid.innerHTML = '';
        
        SERVICES.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card glass-card';
            serviceCard.innerHTML = `
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-name">${service.name}</div>
            `;
            
            serviceCard.addEventListener('click', () => this.openServiceModal(service));
            dom.servicesGrid.appendChild(serviceCard);
        });
    }

    static openServiceModal(service) {
        appState.selectedService = service;
        dom.modalServiceName.textContent = service.name;
        dom.serviceAmountInput.value = '';
        dom.customerNameInput.value = '';
        dom.submitServiceBtn.disabled = true;
        
        dom.serviceModal.classList.add('active');
    }

    static closeServiceModal() {
        dom.serviceModal.classList.remove('active');
        appState.selectedService = null;
    }

    static validateServiceForm() {
        const isValid = UIUtils.validateNumberInput(dom.serviceAmountInput);
        dom.submitServiceBtn.disabled = !isValid;
    }

    static async submitServiceSale() {
        const amount = dom.serviceAmountInput.value.trim();
        const customerName = dom.customerNameInput.value.trim();

        if (!UIUtils.validateNumberInput(dom.serviceAmountInput)) {
            UIUtils.showToast('Please enter a valid amount', 'error');
            return;
        }

        const saleData = {
            date: UIUtils.getTodayDate(),
            service: appState.selectedService.name,
            amount: parseFloat(amount),
            customerName: customerName || 'N/A'
        };

        UIUtils.showLoading(dom.serviceLoading);

        try {
            // Save to app state
            appState.addSale(saleData);
            
            // Send to API
            const result = await APIService.sendData('saveSale', saleData);
            
            if (result.success) {
                UIUtils.showToast(`Sale for ${appState.selectedService.name} recorded successfully!`, 'success');
                dom.serviceAmountInput.value = '';
                dom.customerNameInput.value = '';
                this.closeServiceModal();
            } else {
                throw new Error(result.message || 'Failed to save sale');
            }
        } catch (error) {
            console.error('Error submitting sale:', error);
            UIUtils.showToast(`Failed to record sale: ${error.message}`, 'error');
        } finally {
            UIUtils.hideLoading(dom.serviceLoading);
        }
    }
}

// Cash Module
class CashModule {
    static initialize() {
        // Set today's date as default
        dom.cashDateInput.value = UIUtils.getTodayDate();
        
        // Load last cash entry
        this.loadLastCashEntry();
        
        // Set max date to today
        dom.cashDateInput.max = UIUtils.getTodayDate();
    }

    static loadLastCashEntry() {
        const lastEntry = appState.getLastCashEntry();
        
        if (lastEntry) {
            appState.currentCashAmount = lastEntry.amount;
            appState.lastCashDate = lastEntry.date;
            this.updateCashDisplay();
        }
    }

    static updateCashDisplay() {
        if (appState.currentCashAmount > 0) {
            dom.currentCashAmountDisplay.textContent = UIUtils.formatCurrency(appState.currentCashAmount);
            dom.cashDateDisplay.textContent = `Last updated: ${UIUtils.formatDate(appState.lastCashDate)}`;
        } else {
            dom.currentCashAmountDisplay.textContent = '₹0';
            dom.cashDateDisplay.textContent = 'No cash entry yet';
        }
    }

    static validateCashForm() {
        const isValid = UIUtils.validateNumberInput(dom.cashAmountInput) && dom.cashDateInput.value;
        dom.submitCashBtn.disabled = !isValid;
    }

    static async submitCashEntry() {
        const date = dom.cashDateInput.value;
        const amount = dom.cashAmountInput.value.trim();

        if (!date) {
            UIUtils.showToast('Please select a date', 'error');
            return;
        }

        if (!UIUtils.validateNumberInput(dom.cashAmountInput)) {
            UIUtils.showToast('Please enter a valid amount', 'error');
            return;
        }

        const cashData = {
            date: date,
            amount: parseFloat(amount)
        };

        UIUtils.showLoading(dom.cashLoading);

        try {
            // Save to app state
            appState.addCashEntry(cashData);
            
            // Send to API
            const result = await APIService.sendData('saveCash', cashData);
            
            if (result.success) {
                UIUtils.showToast('Cash entry saved successfully!', 'success');
                this.updateCashDisplay();
                dom.cashAmountInput.value = '';
            } else {
                throw new Error(result.message || 'Failed to save cash entry');
            }
        } catch (error) {
            console.error('Error submitting cash entry:', error);
            UIUtils.showToast(`Failed to save cash entry: ${error.message}`, 'error');
        } finally {
            UIUtils.hideLoading(dom.cashLoading);
        }
    }
}

// Expense Module
class ExpenseModule {
    static validateExpenseForm() {
        const amountValid = UIUtils.validateNumberInput(dom.expenseAmountInput);
        const purposeValid = UIUtils.validateTextInput(dom.expensePurposeInput);
        dom.submitExpenseBtn.disabled = !(amountValid && purposeValid);
    }

    static async submitExpense() {
        const amount = dom.expenseAmountInput.value.trim();
        const purpose = dom.expensePurposeInput.value.trim();

        if (!UIUtils.validateNumberInput(dom.expenseAmountInput)) {
            UIUtils.showToast('Please enter a valid amount', 'error');
            return;
        }

        if (!UIUtils.validateTextInput(dom.expensePurposeInput)) {
            UIUtils.showToast('Please enter expense purpose', 'error');
            return;
        }

        const expenseData = {
            date: UIUtils.getTodayDate(),
            amount: parseFloat(amount),
            purpose: purpose
        };

        UIUtils.showLoading(dom.expenseLoading);

        try {
            // Save to app state
            appState.addExpense(expenseData);
            
            // Send to API
            const result = await APIService.sendData('saveExpense', expenseData);
            
            if (result.success) {
                UIUtils.showToast('Expense recorded successfully!', 'success');
                dom.expenseAmountInput.value = '';
                dom.expensePurposeInput.value = '';
            } else {
                throw new Error(result.message || 'Failed to save expense');
            }
        } catch (error) {
            console.error('Error submitting expense:', error);
            UIUtils.showToast(`Failed to record expense: ${error.message}`, 'error');
        } finally {
            UIUtils.hideLoading(dom.expenseLoading);
        }
    }
}

// Settings Module
class SettingsModule {
    static initialize() {
        // Load current settings
        dom.apiUrlInput.value = appState.apiUrl || '';
        this.updateModeDisplay();
    }

    static openSettingsModal() {
        dom.apiUrlInput.value = appState.apiUrl || '';
        this.updateModeDisplay();
        dom.settingsModal.classList.add('active');
    }

    static closeSettingsModal() {
        dom.settingsModal.classList.remove('active');
    }

    static updateModeDisplay() {
        if (appState.isDemoMode) {
            dom.modeDisplay.textContent = 'Demo Mode (Data stored in browser)';
            dom.modeDisplay.style.color = 'var(--warning-color)';
        } else {
            dom.modeDisplay.textContent = 'Live Mode (Connected to Google Sheets)';
            dom.modeDisplay.style.color = 'var(--success-color)';
        }
    }

    static async saveSettings() {
        const apiUrl = dom.apiUrlInput.value.trim();
        
        if (apiUrl) {
            // Validate URL format
            try {
                new URL(apiUrl);
            } catch (error) {
                UIUtils.showToast('Please enter a valid URL', 'error');
                return;
            }
            
            appState.updateApiUrl(apiUrl);
            this.updateModeDisplay();
            UIUtils.showToast('Settings saved successfully!', 'success');
        } else {
            appState.updateApiUrl('');
            this.updateModeDisplay();
            UIUtils.showToast('Demo mode activated', 'warning');
        }
    }

    static async testApiConnection() {
        const apiUrl = dom.apiUrlInput.value.trim();
        
        if (!apiUrl) {
            UIUtils.showToast('Please enter an API URL first', 'warning');
            return;
        }

        // Temporarily update API URL for testing
        const originalUrl = appState.apiUrl;
        appState.apiUrl = apiUrl;
        appState.isDemoMode = false;

        UIUtils.showToast('Testing connection...', 'info');

        try {
            const result = await APIService.testConnection();
            
            if (result.success) {
                UIUtils.showToast('Connection successful!', 'success');
            } else {
                UIUtils.showToast(result.message, 'error');
            }
        } catch (error) {
            UIUtils.showToast(`Connection failed: ${error.message}`, 'error');
        } finally {
            // Restore original URL
            appState.apiUrl = originalUrl;
            appState.isDemoMode = !originalUrl;
        }
    }
}

// Initialize DOM Elements
const dom = new DOMElements();

// Event Listeners Setup
class EventManager {
    static setup() {
        // Menu toggle
        dom.menuBtn.addEventListener('click', () => {
            dom.dropdownMenu.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dom.menuBtn.contains(e.target) && !dom.dropdownMenu.contains(e.target)) {
                dom.dropdownMenu.classList.remove('active');
            }
        });

        // Dropdown menu items
        dom.dailyReportBtn.addEventListener('click', () => {
            UIUtils.showToast('Daily Report feature coming soon!', 'info');
            dom.dropdownMenu.classList.remove('active');
        });

        dom.monthlyReportBtn.addEventListener('click', () => {
            UIUtils.showToast('Monthly Report feature coming soon!', 'info');
            dom.dropdownMenu.classList.remove('active');
        });

        dom.settingsBtn.addEventListener('click', () => {
            SettingsModule.openSettingsModal();
            dom.dropdownMenu.classList.remove('active');
        });

        // Service modal
        dom.closeModalBtn.addEventListener('click', () => ServiceModule.closeServiceModal());

        // Close modal when clicking outside
        dom.serviceModal.addEventListener('click', (e) => {
            if (e.target === dom.serviceModal) {
                ServiceModule.closeServiceModal();
            }
        });

        // Service form validation
        dom.serviceAmountInput.addEventListener('input', () => ServiceModule.validateServiceForm());

        // Submit service sale
        dom.submitServiceBtn.addEventListener('click', () => ServiceModule.submitServiceSale());

        // Cash form validation
        dom.cashAmountInput.addEventListener('input', () => CashModule.validateCashForm());

        // Submit cash entry
        dom.submitCashBtn.addEventListener('click', () => CashModule.submitCashEntry());

        // Expense form validation
        dom.expenseAmountInput.addEventListener('input', () => ExpenseModule.validateExpenseForm());
        dom.expensePurposeInput.addEventListener('input', () => ExpenseModule.validateExpenseForm());

        // Submit expense
        dom.submitExpenseBtn.addEventListener('click', () => ExpenseModule.submitExpense());

        // Settings modal
        dom.closeSettingsBtn.addEventListener('click', () => SettingsModule.closeSettingsModal());

        // Close settings modal when clicking outside
        dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === dom.settingsModal) {
                SettingsModule.closeSettingsModal();
            }
        });

        // Save settings
        dom.saveSettingsBtn.addEventListener('click', () => SettingsModule.saveSettings());

        // Test API connection
        dom.testApiBtn.addEventListener('click', () => SettingsModule.testApiConnection());

        // Allow Enter key to submit forms
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (dom.serviceModal.classList.contains('active') && !dom.submitServiceBtn.disabled) {
                    ServiceModule.submitServiceSale();
                } else if (dom.cashAmountInput === document.activeElement && !dom.submitCashBtn.disabled) {
                    CashModule.submitCashEntry();
                } else if ((dom.expenseAmountInput === document.activeElement || 
                           dom.expensePurposeInput === document.activeElement) && 
                           !dom.submitExpenseBtn.disabled) {
                    ExpenseModule.submitExpense();
                }
            }
        });
    }
}

// Initialize Application
class AppInitializer {
    static init() {
        // Render services
        ServiceModule.renderServices();
        
        // Initialize cash module
        CashModule.initialize();
        
        // Initialize settings
        SettingsModule.initialize();
        
        // Setup event listeners
        EventManager.setup();
        
        // Show welcome message
        setTimeout(() => {
            if (appState.isDemoMode) {
                UIUtils.showToast(
                    'Welcome to ShopFlow! Running in demo mode. Go to Settings to connect to Google Sheets.', 
                    'warning', 
                    8000
                );
            } else {
                UIUtils.showToast('ShopFlow portal loaded successfully!', 'success');
            }
            
            // Show tip
            setTimeout(() => {
                UIUtils.showToast('💡 Tip: Press Enter to quickly submit forms', 'info', 4000);
            }, 3000);
        }, 1000);
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AppInitializer.init();
});

// Make modules available globally for debugging
window.ShopFlow = {
    appState,
    ServiceModule,
    CashModule,
    ExpenseModule,
    SettingsModule,
    UIUtils
};
