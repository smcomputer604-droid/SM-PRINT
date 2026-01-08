// === SIMPLIFIED APISERVICE FOR GITHUB PAGES ===
class APIService {
    static async sendData(endpoint, data) {
        // Always use API if URL is set
        if (!appState.apiUrl) {
            return this.saveLocally(endpoint, data);
        }
        
        try {
            console.log(`Sending ${endpoint} to:`, appState.apiUrl);
            
            const response = await fetch(appState.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin  // GitHub Pages origin
                },
                body: JSON.stringify({
                    action: endpoint,
                    data: data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API Response:', result);
            
            // Also save locally as backup
            this.saveLocally(endpoint, data);
            
            return result;
            
        } catch (error) {
            console.warn('API failed, saving locally:', error);
            
            // Save locally as fallback
            const localResult = this.saveLocally(endpoint, data);
            
            return {
                ...localResult,
                apiError: error.message,
                message: '⚠️ Saved locally (API error)'
            };
        }
    }
    
    static saveLocally(endpoint, data) {
        switch(endpoint) {
            case 'saveSale':
                appState.addSale(data);
                break;
            case 'saveCash':
                appState.addCashEntry(data);
                break;
            case 'saveExpense':
                appState.addExpense(data);
                break;
        }
        
        return {
            success: true,
            message: 'Saved locally',
            isLocal: true,
            data: data
        };
    }
    
    static async testConnection() {
        if (!appState.apiUrl) {
            return {
                success: false,
                message: '❌ No API URL configured'
            };
        }
        
        UIUtils.showToast('Testing connection...', 'info');
        
        try {
            // Test with GET first
            const getResponse = await fetch(`${appState.apiUrl}?action=test&t=${Date.now()}`);
            
            if (getResponse.ok) {
                const data = await getResponse.json();
                return {
                    success: true,
                    message: '✅ GET connection successful!',
                    details: data
                };
            }
            
            // If GET fails, try POST
            const postResponse = await fetch(appState.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test', data: {} })
            });
            
            const postData = await postResponse.json();
            
            return {
                success: true,
                message: '✅ POST connection successful!',
                details: postData
            };
            
        } catch (error) {
            console.error('Connection test failed:', error);
            
            return {
                success: false,
                message: `❌ Connection failed: ${error.message}\n\n` +
                         `Make sure:\n` +
                         `1. Google Apps Script is deployed as "Anyone, even anonymous"\n` +
                         `2. You've authorized the app (open URL in browser first)\n` +
                         `3. Your GitHub Pages URL is: ${window.location.origin}`
            };
        }
    }
}
