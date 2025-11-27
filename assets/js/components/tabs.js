// Tab Management Component

/**
 * Show specific tab and hide others
 */
export function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to the button that corresponds to this tab
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * Initialize tab navigation
 */
export function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) {
                showTab(tabId);
            }
        });
    });
    
    console.log('Tabs initialized');
}

/**
 * Get current active tab
 */
export function getCurrentTab() {
    const activeTab = document.querySelector('.tab-content.active');
    return activeTab ? activeTab.id : null;
}

/**
 * Switch to next tab
 */
export function nextTab() {
    const tabs = Array.from(document.querySelectorAll('.tab-content'));
    const currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    
    if (currentIndex < tabs.length - 1) {
        showTab(tabs[currentIndex + 1].id);
    }
}

/**
 * Switch to previous tab
 */
export function previousTab() {
    const tabs = Array.from(document.querySelectorAll('.tab-content'));
    const currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    
    if (currentIndex > 0) {
        showTab(tabs[currentIndex - 1].id);
    }
}
