// Resizable Panel Validation Script
// Run this in the browser console to test resize functionality

function validateResizablePanel() {
    console.log('🔍 Validating Resizable Panel Implementation...');
    
    const results = {
        panelExists: false,
        resizeHandles: 0,
        expectedHandles: 8,
        hasConstraints: false,
        hasResizeMethod: false,
        hasUpdateMethod: false,
        statePersistence: false
    };
    
    // Check if panel exists
    const panel = document.getElementById('tnf-floating-panel');
    if (panel) {
        results.panelExists = true;
        console.log('✅ Floating panel found');
        
        // Check resize handles
        const handles = panel.querySelectorAll('.tnf-resize-handle');
        results.resizeHandles = handles.length;
        console.log(`📏 Found ${handles.length} resize handles (expected: 8)`);
        
        if (handles.length === 8) {
            console.log('✅ All resize handles present');
            
            // Check handle directions
            const directions = Array.from(handles).map(h => h.dataset.direction);
            const expectedDirections = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
            const missingDirections = expectedDirections.filter(d => !directions.includes(d));
            
            if (missingDirections.length === 0) {
                console.log('✅ All resize directions implemented');
            } else {
                console.log('❌ Missing resize directions:', missingDirections);
            }
        } else {
            console.log(`❌ Missing resize handles. Found ${handles.length}, expected 8`);
        }
        
        // Check CSS constraints
        const computedStyle = window.getComputedStyle(panel);
        const minWidth = computedStyle.minWidth;
        const maxWidth = computedStyle.maxWidth;
        const minHeight = computedStyle.minHeight;
        
        if (minWidth && maxWidth && minHeight) {
            results.hasConstraints = true;
            console.log('✅ Size constraints detected:', {minWidth, maxWidth, minHeight});
        } else {
            console.log('❌ Size constraints not properly set');
        }
        
    } else {
        console.log('❌ Floating panel not found');
    }
    
    // Check if extension object exists and has resize methods
    if (typeof window.theFuseManager !== 'undefined') {
        const manager = window.theFuseManager;
        
        if (typeof manager.makePanelResizable === 'function') {
            results.hasResizeMethod = true;
            console.log('✅ makePanelResizable method found');
        } else {
            console.log('❌ makePanelResizable method not found');
        }
        
        if (typeof manager.updateChatBoxHeight === 'function') {
            results.hasUpdateMethod = true;
            console.log('✅ updateChatBoxHeight method found');
        } else {
            console.log('❌ updateChatBoxHeight method not found');
        }
        
        // Check state persistence
        try {
            if (typeof manager.savePanelState === 'function') {
                results.statePersistence = true;
                console.log('✅ State persistence method found');
            }
        } catch (e) {
            console.log('⚠️ Could not verify state persistence');
        }
        
    } else {
        console.log('❌ Extension manager not found (window.theFuseManager)');
    }
    
    // Overall validation result
    const score = Object.values(results).filter(v => v === true || (typeof v === 'number' && v === results.expectedHandles)).length;
    const total = Object.keys(results).length - 1; // -1 for expectedHandles
    
    console.log('\n📊 Validation Results:');
    console.log(`Score: ${score}/${total}`);
    console.log('Details:', results);
    
    if (score === total) {
        console.log('🎉 All resize functionality implemented correctly!');
    } else {
        console.log('⚠️ Some resize features may be missing or not properly implemented');
    }
    
    return results;
}

function testResizeConstraints() {
    console.log('🧪 Testing resize constraints...');
    
    const panel = document.getElementById('tnf-floating-panel');
    if (!panel) {
        console.log('❌ Panel not found for constraint testing');
        return;
    }
    
    const originalWidth = panel.style.width;
    const originalHeight = panel.style.height;
    
    // Test minimum constraints
    panel.style.width = '100px'; // Below minimum
    panel.style.height = '100px'; // Below minimum
    
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(panel);
        const actualWidth = parseInt(computedStyle.width);
        const actualHeight = parseInt(computedStyle.height);
        
        if (actualWidth >= 280) {
            console.log('✅ Minimum width constraint working');
        } else {
            console.log(`❌ Minimum width constraint failed. Actual: ${actualWidth}px`);
        }
        
        if (actualHeight >= 300) {
            console.log('✅ Minimum height constraint working');
        } else {
            console.log(`❌ Minimum height constraint failed. Actual: ${actualHeight}px`);
        }
        
        // Test maximum constraints
        panel.style.width = '1000px'; // Above maximum
        panel.style.height = '2000px'; // Above maximum
        
        setTimeout(() => {
            const newStyle = window.getComputedStyle(panel);
            const newWidth = parseInt(newStyle.width);
            const newHeight = parseInt(newStyle.height);
            
            if (newWidth <= 600) {
                console.log('✅ Maximum width constraint working');
            } else {
                console.log(`❌ Maximum width constraint failed. Actual: ${newWidth}px`);
            }
            
            // Restore original size
            panel.style.width = originalWidth;
            panel.style.height = originalHeight;
            
            console.log('🔄 Constraint testing complete, original size restored');
        }, 100);
    }, 100);
}

function simulateResize() {
    console.log('🖱️ Simulating resize operation...');
    
    const panel = document.getElementById('tnf-floating-panel');
    if (!panel) {
        console.log('❌ Panel not found for resize simulation');
        return;
    }
    
    const handle = panel.querySelector('.tnf-resize-handle[data-direction="se"]');
    if (!handle) {
        console.log('❌ Southeast resize handle not found');
        return;
    }
    
    // Simulate mousedown, mousemove, mouseup sequence
    const rect = panel.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    
    // Create and dispatch events
    const mouseDown = new MouseEvent('mousedown', {
        clientX: rect.right,
        clientY: rect.bottom,
        bubbles: true
    });
    
    const mouseMove = new MouseEvent('mousemove', {
        clientX: rect.right + 50,
        clientY: rect.bottom + 50,
        bubbles: true
    });
    
    const mouseUp = new MouseEvent('mouseup', {
        bubbles: true
    });
    
    handle.dispatchEvent(mouseDown);
    console.log('📥 Mousedown event dispatched');
    
    setTimeout(() => {
        document.dispatchEvent(mouseMove);
        console.log('🖱️ Mousemove event dispatched');
        
        setTimeout(() => {
            document.dispatchEvent(mouseUp);
            console.log('📤 Mouseup event dispatched');
            
            // Check if size changed
            const newRect = panel.getBoundingClientRect();
            if (newRect.width !== startWidth || newRect.height !== startHeight) {
                console.log('✅ Panel size changed during simulation');
                console.log(`Size change: ${startWidth}x${startHeight} → ${newRect.width}x${newRect.height}`);
            } else {
                console.log('⚠️ Panel size did not change during simulation');
            }
        }, 100);
    }, 100);
}

// Auto-run validation if panel is present
if (document.getElementById('tnf-floating-panel')) {
    validateResizablePanel();
} else {
    console.log('ℹ️ Run validateResizablePanel() after showing the floating panel');
}

// Export functions for manual testing
window.validateResizablePanel = validateResizablePanel;
window.testResizeConstraints = testResizeConstraints;
window.simulateResize = simulateResize;

console.log('📋 Available test functions:');
console.log('  - validateResizablePanel() - Check implementation');
console.log('  - testResizeConstraints() - Test size limits');
console.log('  - simulateResize() - Simulate resize operation');
