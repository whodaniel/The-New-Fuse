/**
 * Content Script Integration for The New Fuse Hybrid System
 * This bridges the chrome extension with the Electron desktop app
 */

import type { ElementInfo, PageElementMapping } from '../shared/types.js'

class TNFContentBridge {
  private relayPort: chrome.runtime.Port | null = null
  private isConnected = false
  private elementMappingCache: PageElementMapping | null = null

  constructor() {
    this.initializeContentBridge()
    this.setupMessageListeners()
    this.monitorPageChanges()
  }

  private initializeContentBridge(): void {
    // Connect to the background script
    try {
      this.relayPort = chrome.runtime.connect({ name: 'tnf-content-bridge' })
      
      this.relayPort.onMessage.addListener((message) => {
        this.handleBackgroundMessage(message)
      })

      this.relayPort.onDisconnect.addListener(() => {
        this.isConnected = false
        this.relayPort = null
        // Attempt to reconnect
        setTimeout(() => this.initializeContentBridge(), 1000)
      })

      this.isConnected = true
    } catch {
    }
  }

  private setupMessageListeners(): void {
    // Listen for messages from the background script (which receives from Electron)
    window.addEventListener('message', (event) => {
      if (event.source !== window) return
      
      if (event.data.type && event.data.type.startsWith('TNF_')) {
        this.handleElectronMessage(event.data)
      }
    })
  }

  private handleBackgroundMessage(message: any): void {
    switch (message.type) {
      case 'AUTO_DETECT_ELEMENTS':
        this.performAutoDetection()
        break
      case 'ENTER_SELECTION_MODE':
        this.enterSelectionMode(message.elementType)
        break
      case 'SEND_CHAT_MESSAGE':
        this.sendChatMessage(message.message, message.mapping)
        break
      case 'GET_PAGE_INFO':
        this.sendPageInfo()
        break
      default:
    }
  }

  private handleElectronMessage(_: any): void {
    // Handle messages from Electron app via background script
  }

  private performAutoDetection(): void {
    const mapping = this.detectChatElements()
    
    if (mapping) {
      this.elementMappingCache = mapping
      this.sendToBackground({
        type: 'ELEMENT_MAPPING_DETECTED',
        mapping: mapping
      })
    }
  }

  private detectChatElements(): PageElementMapping | null {
    const inputElements = this.detectInputElements()
    const buttonElements = this.detectButtonElements()
    const outputElements = this.detectOutputElements()

    if (inputElements.length === 0 && buttonElements.length === 0) {
      return null
    }

    const bestInput = inputElements[0] // Take the highest confidence
    const bestButton = buttonElements[0]
    const bestOutput = outputElements[0]

    return {
      chatInput: bestInput,
      sendButton: bestButton,
      chatOutput: bestOutput,
      messageContainer: bestOutput, // Use output as message container for now
      timestamp: Date.now(),
      url: window.location.href,
      domain: window.location.hostname
    }
  }

  private detectInputElements(): ElementInfo[] {
    const selectors = [
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="chat" i]',
      'input[placeholder*="message" i]',
      'input[placeholder*="chat" i]',
      'textarea[aria-label*="message" i]',
      'div[contenteditable="true"][role="textbox"]',
      '.chat-input textarea',
      '.message-input textarea',
      '#chat-input',
      '[data-testid*="input"]'
    ]

    const elements: ElementInfo[] = []

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const elementInfo = this.createElementInfo(el as HTMLElement, 'input')
        if (elementInfo && elementInfo.isVisible && elementInfo.isInteractable) {
          elements.push(elementInfo)
        }
      })
    })

    return elements.sort((a, b) => b.confidence - a.confidence)
  }

  private detectButtonElements(): ElementInfo[] {
    const selectors = [
      'button[aria-label*="send" i]',
      'button[title*="send" i]',
      'button:has(svg)',
      '.send-button',
      '[data-testid*="send"]',
      'button[type="submit"]'
    ]

    const elements: ElementInfo[] = []

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const elementInfo = this.createElementInfo(el as HTMLElement, 'button')
        if (elementInfo && elementInfo.isVisible && elementInfo.isInteractable) {
          elements.push(elementInfo)
        }
      })
    })

    return elements.sort((a, b) => b.confidence - a.confidence)
  }

  private detectOutputElements(): ElementInfo[] {
    const selectors = [
      '.messages',
      '.chat-messages',
      '.conversation',
      '[role="log"]',
      '.message-list',
      '#messages',
      '[data-testid*="messages"]'
    ]

    const elements: ElementInfo[] = []

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const elementInfo = this.createElementInfo(el as HTMLElement, 'output')
        if (elementInfo && elementInfo.isVisible) {
          elements.push(elementInfo)
        }
      })
    })

    return elements.sort((a, b) => b.confidence - a.confidence)
  }

  private createElementInfo(element: HTMLElement, elementType: 'input' | 'button' | 'output'): ElementInfo | null {
    try {
      const rect = element.getBoundingClientRect()
      const styles = window.getComputedStyle(element)
      
      const elementInfo: ElementInfo = {
        selector: this.generateSelector(element),
        xpath: this.generateXPath(element),
        tag: element.tagName.toLowerCase(),
        id: element.id,
        classes: Array.from(element.classList),
        text: element.textContent?.slice(0, 100) || '',
        placeholder: (element as HTMLInputElement).placeholder,
        type: (element as HTMLInputElement).type,
        role: element.getAttribute('role') || undefined,
        ariaLabel: element.getAttribute('aria-label') || undefined,
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        isVisible: styles.display !== 'none' && styles.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        isInteractable: !element.hasAttribute('disabled') && !element.hasAttribute('readonly'),
        confidence: this.calculateConfidence(element, elementType),
        elementType
      }

      return elementInfo
    } catch {
      return null
    }
  }

  private generateSelector(element: HTMLElement): string {
    // Generate a unique CSS selector for the element
    if (element.id) {
      return `#${element.id}`
    }

    const path: string[] = []
    let current = element

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase()
      
      if (current.className) {
        selector += '.' + Array.from(current.classList).join('.')
      }
      
      path.unshift(selector)
      current = current.parentElement!
      
      if (path.length > 5) break // Limit depth
    }

    return path.join(' > ')
  }

  private generateXPath(element: HTMLElement): string {
    // Generate XPath for the element
    const path: string[] = []
    let current = element

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0
      let sibling = current.previousSibling
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
          index++
        }
        sibling = sibling.previousSibling
      }
      
      const tagName = current.nodeName.toLowerCase()
      const pathIndex = index ? `[${index + 1}]` : ''
      path.unshift(`${tagName}${pathIndex}`)
      
      current = current.parentElement!
      if (path.length > 10) break // Limit depth
    }

    return '//' + path.join('/')
  }

  private calculateConfidence(element: HTMLElement, elementType: 'input' | 'button' | 'output'): number {
    let confidence = 50 // Base confidence

    // Check attributes and properties that increase confidence
    const text = element.textContent?.toLowerCase() || ''
    const placeholder = (element as HTMLInputElement).placeholder?.toLowerCase() || ''
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || ''
    const className = element.className.toLowerCase()
    const id = element.id.toLowerCase()

    switch (elementType) {
      case 'input':
        if (element.tagName === 'TEXTAREA') confidence += 20
        if (element.tagName === 'INPUT') confidence += 15
        if (placeholder.includes('message') || placeholder.includes('chat')) confidence += 25
        if (ariaLabel.includes('message') || ariaLabel.includes('chat')) confidence += 20
        if (className.includes('input') || className.includes('message')) confidence += 15
        break

      case 'button':
        if (element.tagName === 'BUTTON') confidence += 20
        if (text.includes('send') || ariaLabel.includes('send')) confidence += 25
        if (element.querySelector('svg')) confidence += 15 // Often send buttons have icons
        if (className.includes('send') || className.includes('submit')) confidence += 20
        break

      case 'output':
        if (element.getAttribute('role') === 'log') confidence += 25
        if (className.includes('message') || className.includes('chat')) confidence += 20
        if (id.includes('message') || id.includes('chat')) confidence += 15
        break
    }

    return Math.min(confidence, 100)
  }

  private enterSelectionMode(elementType: 'input' | 'button' | 'output'): void {
    // Visual feedback for selection mode
    document.body.style.cursor = 'crosshair'
    
    const overlay = document.createElement('div')
    overlay.id = 'tnf-selection-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 135, 255, 0.1);
      z-index: 999999;
      pointer-events: none;
      border: 2px dashed #0087ff;
    `
    document.body.appendChild(overlay)

    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      
      const target = event.target as HTMLElement
      const elementInfo = this.createElementInfo(target, elementType)
      
      if (elementInfo) {
        this.sendToBackground({
          type: 'ELEMENT_SELECTED',
          elementType,
          elementInfo
        })
      }
      
      // Clean up selection mode
      document.body.style.cursor = ''
      overlay.remove()
      document.removeEventListener('click', handleClick, true)
    }

    document.addEventListener('click', handleClick, true)
  }

  private sendChatMessage(message: string, mapping: PageElementMapping): void {
    if (!mapping.chatInput || !mapping.sendButton) {
      return
    }

    try {
      // Find and fill the input element
      const inputElement = document.querySelector(mapping.chatInput.selector) as HTMLInputElement | HTMLTextAreaElement
      if (inputElement) {
        inputElement.focus()
        inputElement.value = message
        
        // Trigger input events
        inputElement.dispatchEvent(new Event('input', { bubbles: true }))
        inputElement.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // Find and click the send button
      setTimeout(() => {
        const sendButton = document.querySelector(mapping.sendButton!.selector) as HTMLElement
        if (sendButton) {
          sendButton.click()
        }
      }, 100)

    } catch {
    }
  }

  private sendPageInfo(): void {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      timestamp: Date.now(),
      hasMapping: !!this.elementMappingCache
    }

    this.sendToBackground({
      type: 'PAGE_INFO',
      pageInfo
    })
  }

  private sendToBackground(message: any): void {
    if (this.relayPort && this.isConnected) {
      this.relayPort.postMessage(message)
    }
  }

  private monitorPageChanges(): void {
    // Monitor for SPA navigation
    let lastUrl = window.location.href
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href
        this.elementMappingCache = null
        // Re-detect elements after navigation
        setTimeout(() => this.performAutoDetection(), 1000)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}

// Initialize the content bridge
if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
  new TNFContentBridge()
}
