/**
 * AI-Powered Element Detection for Chat Interfaces
 * Uses machine learning heuristics to identify chat elements
 */

import { Logger } from '../utils/logger';
import { ElementInfo } from './element-selector';

export interface ChatElementPattern {
  type: 'input' | 'button' | 'output' | 'container';
  selectors: string[];
  attributes: string[];
  textPatterns: RegExp[];
  confidence: number;
}

export class AIElementDetector {
  private logger: Logger;
  private chatPatterns: ChatElementPattern[];

  constructor() {
    this.logger = new Logger({
      name: 'AIElementDetector',
      level: 'info',
      saveToStorage: true
    });

    this.initializeChatPatterns();
  }

  private initializeChatPatterns(): void {
    this.chatPatterns = [
      // Input patterns
      {
        type: 'input',
        selectors: [
          'input[type="text"]',
          'textarea',
          '[contenteditable="true"]',
          '[role="textbox"]',
          '.chat-input',
          '.message-input',
          '.composer',
          '.input-field'
        ],
        attributes: ['placeholder', 'aria-label', 'data-testid', 'name', 'id'],
        textPatterns: [
          /type.*message/i,
          /send.*message/i,
          /write.*message/i,
          /enter.*text/i,
          /compose/i,
          /chat/i
        ],
        confidence: 0.8
      },
      // Send button patterns
      {
        type: 'button',
        selectors: [
          'button[type="submit"]',
          'button[aria-label*="send"]',
          '.send-button',
          '.submit-button',
          '[data-testid*="send"]',
          '.chat-send',
          '.message-send'
        ],
        attributes: ['aria-label', 'title', 'data-testid', 'class'],
        textPatterns: [
          /^send$/i,
          /submit/i,
          /post/i,
          /publish/i,
          /reply/i
        ],
        confidence: 0.9
      },
      // Output/message container patterns
      {
        type: 'output',
        selectors: [
          '.messages',
          '.chat-messages',
          '.conversation',
          '.message-list',
          '[role="log"]',
          '.chat-history',
          '.message-container'
        ],
        attributes: ['role', 'aria-label', 'data-testid'],
        textPatterns: [
          /message/i,
          /conversation/i,
          /chat/i,
          /history/i
        ],
        confidence: 0.7
      }
    ];
  }

  /**
   * Detect chat interface elements on the current page
   */
  public async detectChatElements(): Promise<{ [key: string]: ElementInfo[] }> {
    const results: { [key: string]: ElementInfo[] } = {
      input: [],
      button: [],
      output: [],
      container: []
    };

    for (const pattern of this.chatPatterns) {
      const elements = this.findElementsByPattern(pattern);
      results[pattern.type] = elements;
    }

    // Apply AI scoring and ranking
    Object.keys(results).forEach(type => {
      results[type] = this.rankElementsByAI(results[type], type as any);
    });

    this.logger.info('Chat elements detected:', results);
    return results;
  }

  private findElementsByPattern(pattern: ChatElementPattern): ElementInfo[] {
    const elements: ElementInfo[] = [];
    const foundElements = new Set<HTMLElement>();

    // Search by selectors
    pattern.selectors.forEach(selector => {
      try {
        const matches = document.querySelectorAll(selector);
        matches.forEach(el => {
          if (el instanceof HTMLElement && !foundElements.has(el)) {
            foundElements.add(el);
            const info = this.createElementInfo(el, pattern);
            if (info) elements.push(info);
          }
        });
      } catch (error) {
        this.logger.warn(`Invalid selector: ${selector}`, error);
      }
    });

    // Search by text patterns
    this.searchByTextPatterns(pattern, foundElements, elements);

    return elements;
  }

  private searchByTextPatterns(
    pattern: ChatElementPattern,
    foundElements: Set<HTMLElement>,
    elements: ElementInfo[]
  ): void {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_SKIP;
          if (foundElements.has(node)) return NodeFilter.FILTER_SKIP;
          
          // Check if element matches pattern criteria
          const isRelevantTag = this.isRelevantTagForPattern(node, pattern);
          return isRelevantTag ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node: Node | null;
    while (node = walker.nextNode()) {
      const element = node as HTMLElement;
      const textContent = this.getElementTextContent(element);
      
      for (const regex of pattern.textPatterns) {
        if (regex.test(textContent)) {
          foundElements.add(element);
          const info = this.createElementInfo(element, pattern);
          if (info) elements.push(info);
          break;
        }
      }
    }
  }

  private isRelevantTagForPattern(element: HTMLElement, pattern: ChatElementPattern): boolean {
    const tag = element.tagName.toLowerCase();
    
    switch (pattern.type) {
      case 'input':
        return ['input', 'textarea', 'div', 'span'].includes(tag);
      case 'button':
        return ['button', 'a', 'div', 'span'].includes(tag);
      case 'output':
      case 'container':
        return ['div', 'section', 'article', 'ul', 'ol'].includes(tag);
      default:
        return true;
    }
  }

  private getElementTextContent(element: HTMLElement): string {
    let text = '';
    
    // Get text from various sources
    text += element.textContent || '';
    text += ' ' + (element.getAttribute('placeholder') || '');
    text += ' ' + (element.getAttribute('aria-label') || '');
    text += ' ' + (element.getAttribute('title') || '');
    text += ' ' + (element.getAttribute('alt') || '');
    text += ' ' + element.className;
    text += ' ' + element.id;
    
    return text.toLowerCase();
  }

  private createElementInfo(element: HTMLElement, pattern: ChatElementPattern): ElementInfo | null {
    try {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Check if element is visible and interactable
      const isVisible = rect.width > 0 && rect.height > 0 && 
        computedStyle.visibility !== 'hidden' && 
        computedStyle.display !== 'none';
      
      if (!isVisible) return null;

      return {
        selector: this.generateBestSelector(element),
        xpath: this.generateXPath(element),
        tag: element.tagName.toLowerCase(),
        id: element.id,
        classes: Array.from(element.classList),
        text: element.textContent?.trim() || '',
        placeholder: element.getAttribute('placeholder') || undefined,
        type: element.getAttribute('type') || undefined,
        role: element.getAttribute('role') || undefined,
        ariaLabel: element.getAttribute('aria-label') || undefined,
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        isVisible: true,
        isInteractable: this.isElementInteractable(element),
        confidence: this.calculateElementConfidence(element, pattern),
        elementType: pattern.type === 'input' ? 'input' : 
                   pattern.type === 'button' ? 'button' : 
                   pattern.type === 'output' ? 'output' : 'unknown'
      };
    } catch (error) {
      this.logger.warn('Error creating element info:', error);
      return null;
    }
  }

  private calculateElementConfidence(element: HTMLElement, pattern: ChatElementPattern): number {
    let confidence = pattern.confidence;
    
    // Boost confidence based on specific attributes
    const textContent = this.getElementTextContent(element);
    
    // Check for chat-related keywords
    const chatKeywords = ['chat', 'message', 'send', 'compose', 'input', 'text'];
    const keywordMatches = chatKeywords.filter(keyword => 
      textContent.includes(keyword)
    ).length;
    
    confidence += keywordMatches * 0.1;
    
    // Boost for semantic HTML
    if (element.getAttribute('role')) confidence += 0.1;
    if (element.getAttribute('aria-label')) confidence += 0.1;
    
    // Boost for proper form structure
    if (pattern.type === 'input' && element.closest('form')) confidence += 0.1;
    if (pattern.type === 'button' && element.type === 'submit') confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private isElementInteractable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.pointerEvents !== 'none' && 
           !element.hasAttribute('disabled') &&
           style.userSelect !== 'none';
  }

  private generateBestSelector(element: HTMLElement): string {
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Try unique class combinations
    if (element.className) {
      const classes = Array.from(element.classList);
      for (const cls of classes) {
        const selector = `.${cls}`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }
    
    // Try attribute selectors
    const uniqueAttrs = ['data-testid', 'name', 'placeholder', 'aria-label'];
    for (const attr of uniqueAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        const selector = `[${attr}="${value}"]`;
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }
    }
    
    // Fall back to nth-child selector
    return this.generateNthChildSelector(element);
  }

  private generateNthChildSelector(element: HTMLElement): string {
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
      } else {
        path.unshift(current.tagName.toLowerCase());
      }
      current = parent;
    }
    
    return path.join(' > ');
  }

  private generateXPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.documentElement) {
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          sibling => sibling.tagName === current!.tagName
        );
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      } else {
        path.unshift(current.tagName.toLowerCase());
      }
      current = parent;
    }
    
    return '//' + path.join('/');
  }

  private rankElementsByAI(elements: ElementInfo[], type: string): ElementInfo[] {
    return elements
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5 candidates
  }

  /**
   * Get the best chat input element
   */
  public async getBestChatInput(): Promise<ElementInfo | null> {
    const detected = await this.detectChatElements();
    return detected.input[0] || null;
  }

  /**
   * Get the best send button element
   */
  public async getBestSendButton(): Promise<ElementInfo | null> {
    const detected = await this.detectChatElements();
    return detected.button[0] || null;
  }

  /**
   * Get the best chat output element
   */
  public async getBestChatOutput(): Promise<ElementInfo | null> {
    const detected = await this.detectChatElements();
    return detected.output[0] || null;
  }
}
