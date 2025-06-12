/**
 * Element Selector for The New Fuse Chrome Extension
 * Provides click-to-select interface element identification
 */
import { Logger } from '../utils/logger';
export class ElementSelector {
    constructor() {
        this.isSelectionMode = false;
        this.overlay = null;
        this.currentHighlight = null;
        this.selectedElements = new Map();
        this.selectionTarget = '';
        this.logger = new Logger({
            name: 'ElementSelector',
            level: 'info',
            saveToStorage: true
        });
        this.setupEventListeners();
    }
    /**
     * Enter element selection mode
     */
    enterSelectionMode(elementType, callback) {
        this.logger.info(`Entering selection mode for: ${elementType}`);
        this.isSelectionMode = true;
        this.selectionTarget = elementType;
        this.onElementSelected = callback;
        this.createOverlay();
        this.showInstructions(elementType);
        document.body.style.cursor = 'crosshair';
    }
    /**
     * Exit element selection mode
     */
    exitSelectionMode() {
        this.logger.info('Exiting selection mode');
        this.isSelectionMode = false;
        this.selectionTarget = '';
        this.onElementSelected = undefined;
        this.removeOverlay();
        this.removeHighlight();
        document.body.style.cursor = '';
        this.hideInstructions();
    }
    /**
     * Get comprehensive element information
     */
    getElementInfo(element) {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        // Generate multiple selector strategies
        const selectors = this.generateSelectors(element);
        const xpath = this.generateXPath(element);
        // Determine element type and confidence
        const { elementType, confidence } = this.classifyElement(element);
        const elementInfo = {
            selector: selectors.best,
            xpath: xpath,
            tag: element.tagName.toLowerCase(),
            id: element.id || undefined,
            classes: Array.from(element.classList),
            text: this.getElementText(element),
            placeholder: element.placeholder || undefined,
            type: element.type || undefined,
            role: element.getAttribute('role') || undefined,
            ariaLabel: element.getAttribute('aria-label') || undefined,
            position: {
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            },
            isVisible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
            isInteractable: this.isElementInteractable(element),
            confidence: confidence,
            elementType: elementType
        };
        return elementInfo;
    }
    /**
     * Automatically detect chat interface elements
     */
    async autoDetectChatElements() {
        this.logger.info('Auto-detecting chat interface elements');
        const elements = document.querySelectorAll('*');
        const candidates = {
            inputs: [],
            buttons: [],
            outputs: []
        };
        // Collect potential chat elements
        elements.forEach(element => {
            if (element instanceof HTMLElement) {
                const { elementType, confidence } = this.classifyElement(element);
                if (confidence > 0.3) {
                    switch (elementType) {
                        case 'input':
                            candidates.inputs.push(element);
                            break;
                        case 'button':
                            candidates.buttons.push(element);
                            break;
                        case 'output':
                            candidates.outputs.push(element);
                            break;
                    }
                }
            }
        });
        // Score and select best candidates
        const chatInput = this.selectBestCandidate(candidates.inputs, 'input');
        const sendButton = this.selectBestCandidate(candidates.buttons, 'button');
        const chatOutput = this.selectBestCandidate(candidates.outputs, 'output');
        const mapping = {
            chatInput: chatInput ? this.getElementInfo(chatInput) : undefined,
            sendButton: sendButton ? this.getElementInfo(sendButton) : undefined,
            chatOutput: chatOutput ? this.getElementInfo(chatOutput) : undefined,
            timestamp: Date.now(),
            url: window.location.href,
            domain: window.location.hostname
        };
        this.logger.info('Auto-detection complete:', mapping);
        return mapping;
    }
    /**
     * Save element mapping for this page
     */
    saveElementMapping(mapping) {
        const key = `element_mapping_${mapping.domain}`;
        chrome.storage.local.set({ [key]: mapping }, () => {
            this.logger.info(`Element mapping saved for ${mapping.domain}`);
        });
    }
    /**
     * Load element mapping for current page
     */
    async loadElementMapping() {
        const domain = window.location.hostname;
        const key = `element_mapping_${domain}`;
        return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
                const mapping = result[key] || null;
                this.logger.info(`Element mapping loaded for ${domain}:`, mapping);
                resolve(mapping);
            });
        });
    }
    /**
     * Test if stored selectors still work
     */
    validateElementMapping(mapping) {
        const issues = [];
        if (mapping.chatInput) {
            const element = this.findElement(mapping.chatInput);
            if (!element) {
                issues.push('Chat input element not found');
            }
            else if (!this.isElementInteractable(element)) {
                issues.push('Chat input element not interactable');
            }
        }
        if (mapping.sendButton) {
            const element = this.findElement(mapping.sendButton);
            if (!element) {
                issues.push('Send button element not found');
            }
            else if (!this.isElementInteractable(element)) {
                issues.push('Send button element not interactable');
            }
        }
        if (mapping.chatOutput) {
            const element = this.findElement(mapping.chatOutput);
            if (!element) {
                issues.push('Chat output element not found');
            }
        }
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
    /**
     * Find element using stored information
     */
    findElement(elementInfo) {
        // Try selector first
        let element = document.querySelector(elementInfo.selector);
        // Try xpath if selector fails
        if (!element && elementInfo.xpath) {
            const result = document.evaluate(elementInfo.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            element = result.singleNodeValue;
        }
        // Try fuzzy matching if both fail
        if (!element) {
            element = this.findElementByFuzzyMatch(elementInfo);
        }
        return element;
    }
    setupEventListeners() {
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    handleMouseOver(event) {
        if (!this.isSelectionMode)
            return;
        const element = event.target;
        if (element && element !== this.overlay) {
            this.highlightElement(element);
        }
    }
    handleClick(event) {
        if (!this.isSelectionMode)
            return;
        event.preventDefault();
        event.stopPropagation();
        const element = event.target;
        if (element && element !== this.overlay) {
            const elementInfo = this.getElementInfo(element);
            this.selectedElements.set(this.selectionTarget, elementInfo);
            if (this.onElementSelected) {
                this.onElementSelected(elementInfo, this.selectionTarget);
            }
            this.exitSelectionMode();
        }
    }
    handleKeyDown(event) {
        if (!this.isSelectionMode)
            return;
        if (event.key === 'Escape') {
            this.exitSelectionMode();
        }
    }
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'tnf-element-selector-overlay';
        this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 100, 255, 0.1);
      z-index: 999999;
      pointer-events: none;
      border: 2px dashed #0066ff;
    `;
        document.body.appendChild(this.overlay);
    }
    removeOverlay() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
    }
    highlightElement(element) {
        this.removeHighlight();
        this.currentHighlight = document.createElement('div');
        this.currentHighlight.id = 'tnf-element-highlight';
        const rect = element.getBoundingClientRect();
        this.currentHighlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(255, 165, 0, 0.3);
      border: 2px solid #ff6600;
      z-index: 1000000;
      pointer-events: none;
      box-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
    `;
        document.body.appendChild(this.currentHighlight);
    }
    removeHighlight() {
        if (this.currentHighlight) {
            document.body.removeChild(this.currentHighlight);
            this.currentHighlight = null;
        }
    }
    showInstructions(elementType) {
        const instructions = document.createElement('div');
        instructions.id = 'tnf-selection-instructions';
        instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 1000001;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
        instructions.innerHTML = `
      <div style="text-align: center;">
        <strong>Select ${elementType.replace(/([A-Z])/g, ' $1').toLowerCase()}</strong><br>
        <small>Click on the ${elementType} element • Press ESC to cancel</small>
      </div>
    `;
        document.body.appendChild(instructions);
    }
    hideInstructions() {
        const instructions = document.getElementById('tnf-selection-instructions');
        if (instructions) {
            document.body.removeChild(instructions);
        }
    }
    generateSelectors(element) {
        const selectors = [];
        // ID selector (highest priority)
        if (element.id) {
            selectors.push(`#${element.id}`);
        }
        // Class selector
        if (element.classList.length > 0) {
            const classSelector = `.${Array.from(element.classList).join('.')}`;
            selectors.push(classSelector);
        }
        // Attribute selectors
        ['data-testid', 'data-test', 'name', 'placeholder'].forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                selectors.push(`[${attr}="${value}"]`);
            }
        });
        // CSS selector with nth-child
        const path = this.getCSSPath(element);
        if (path) {
            selectors.push(path);
        }
        return {
            best: selectors[0] || this.getFallbackSelector(element),
            alternatives: selectors.slice(1)
        };
    }
    generateXPath(element) {
        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let part = current.tagName.toLowerCase();
            if (current.id) {
                part += `[@id="${current.id}"]`;
                parts.unshift(part);
                break;
            }
            const siblings = Array.from(current.parentNode?.children || [])
                .filter(child => child.tagName === current.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                part += `[${index}]`;
            }
            parts.unshift(part);
            current = current.parentElement;
        }
        return '//' + parts.join('/');
    }
    getCSSPath(element) {
        const path = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
                selector += `#${current.id}`;
                path.unshift(selector);
                break;
            }
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children)
                    .filter(child => child.tagName === current.tagName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `:nth-child(${index})`;
                }
            }
            path.unshift(selector);
            current = parent;
        }
        return path.join(' > ');
    }
    getFallbackSelector(element) {
        return `${element.tagName.toLowerCase()}[contains(text(),"${element.textContent?.slice(0, 20)}")]`;
    }
    classifyElement(element) {
        let confidence = 0;
        let elementType = 'unknown';
        const tag = element.tagName.toLowerCase();
        const classes = Array.from(element.classList).join(' ').toLowerCase();
        const id = element.id.toLowerCase();
        const placeholder = element.placeholder?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        const role = element.getAttribute('role')?.toLowerCase() || '';
        const text = element.textContent?.toLowerCase() || '';
        // Input detection
        const inputIndicators = [
            'input', 'textarea', 'message', 'chat', 'text', 'prompt', 'query'
        ];
        if (tag === 'input' || tag === 'textarea') {
            confidence += 0.4;
            elementType = 'input';
        }
        if (inputIndicators.some(indicator => classes.includes(indicator) || id.includes(indicator) ||
            placeholder.includes(indicator) || ariaLabel.includes(indicator))) {
            confidence += 0.3;
            if (elementType === 'unknown')
                elementType = 'input';
        }
        // Button detection
        const buttonIndicators = [
            'button', 'send', 'submit', 'go', 'enter'
        ];
        if (tag === 'button' || element.type === 'submit') {
            confidence += 0.4;
            elementType = 'button';
        }
        if (buttonIndicators.some(indicator => classes.includes(indicator) || id.includes(indicator) ||
            text.includes(indicator) || ariaLabel.includes(indicator))) {
            confidence += 0.3;
            if (elementType === 'unknown')
                elementType = 'button';
        }
        // Output detection
        const outputIndicators = [
            'response', 'output', 'result', 'answer', 'reply', 'message', 'conversation'
        ];
        if (outputIndicators.some(indicator => classes.includes(indicator) || id.includes(indicator) || role.includes(indicator))) {
            confidence += 0.3;
            if (elementType === 'unknown')
                elementType = 'output';
        }
        return { elementType, confidence };
    }
    selectBestCandidate(candidates, type) {
        if (candidates.length === 0)
            return null;
        return candidates.reduce((best, current) => {
            const bestInfo = this.getElementInfo(best);
            const currentInfo = this.getElementInfo(current);
            // Prefer higher confidence and better visibility
            const bestScore = bestInfo.confidence + (bestInfo.isVisible ? 0.2 : 0) + (bestInfo.isInteractable ? 0.2 : 0);
            const currentScore = currentInfo.confidence + (currentInfo.isVisible ? 0.2 : 0) + (currentInfo.isInteractable ? 0.2 : 0);
            return currentScore > bestScore ? current : best;
        });
    }
    isElementInteractable(element) {
        const style = window.getComputedStyle(element);
        return style.pointerEvents !== 'none' &&
            !element.hasAttribute('disabled') &&
            style.display !== 'none' &&
            style.visibility !== 'hidden';
    }
    getElementText(element) {
        // Get visible text content, truncated for performance
        const text = element.textContent || element.innerText || '';
        return text.trim().slice(0, 100);
    }
    findElementByFuzzyMatch(elementInfo) {
        // Try to find element by similar attributes if exact selectors fail
        const candidates = document.querySelectorAll(elementInfo.tag);
        for (const candidate of candidates) {
            const candidateInfo = this.getElementInfo(candidate);
            // Score similarity
            let similarity = 0;
            if (candidateInfo.text === elementInfo.text)
                similarity += 0.3;
            if (candidateInfo.placeholder === elementInfo.placeholder)
                similarity += 0.2;
            if (candidateInfo.classes.some(cls => elementInfo.classes.includes(cls)))
                similarity += 0.2;
            if (candidateInfo.type === elementInfo.type)
                similarity += 0.2;
            if (candidateInfo.role === elementInfo.role)
                similarity += 0.1;
            if (similarity >= 0.5) {
                return candidate;
            }
        }
        return null;
    }
    /**
     * Create element info for a given HTML element (alias for getElementInfo)
     */
    createElementInfo(element) {
        return this.getElementInfo(element);
    }
}
//# sourceMappingURL=element-selector.js.map