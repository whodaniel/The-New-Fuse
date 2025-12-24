import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ElementInfo {
  type: 'input' | 'button' | 'output'
  selector: string
  xpath: string
  confidence: number
  tabId?: number
  isSelected: boolean
  lastDetected: string
  tag?: string
  id?: string
  classes?: string[]
  text?: string
  placeholder?: string
  role?: string
  ariaLabel?: string
  position?: { x: number; y: number; width: number; height: number }
  isVisible?: boolean
  isInteractable?: boolean
  elementType?: 'input' | 'button' | 'output' | 'unknown'
}

export interface PageElementMapping {
  chatInput?: ElementInfo
  sendButton?: ElementInfo
  chatOutput?: ElementInfo
  messageContainer?: ElementInfo
  timestamp: number
  url: string
  domain: string
}

export interface ElementsState {
  detectedElements: {
    input: ElementInfo | null
    button: ElementInfo | null
    output: ElementInfo | null
  }
  selectionMode: boolean
  currentTab: number | null
  mapping: PageElementMapping | null
  selectedElement: ElementInfo | null
}

const initialState: ElementsState = {
  detectedElements: {
    input: null,
    button: null,
    output: null,
  },
  selectionMode: false,
  currentTab: null,
  mapping: null,
  selectedElement: null,
}

export const elementsSlice = createSlice({
  name: 'elements',
  initialState,
  reducers: {
    setElementDetected: (state, action: PayloadAction<ElementInfo>) => {
      const element = action.payload
      state.detectedElements[element.type] = {
        ...element,
        isSelected: true,
        lastDetected: new Date().toISOString(),
      }
    },
    clearElement: (state, action: PayloadAction<'input' | 'button' | 'output'>) => {
      state.detectedElements[action.payload] = null
    },
    clearAllElements: (state) => {
      state.detectedElements = {
        input: null,
        button: null,
        output: null,
      }
    },
    setSelectionMode: (state, action: PayloadAction<boolean>) => {
      state.selectionMode = action.payload
    },
    setCurrentTab: (state, action: PayloadAction<number | null>) => {
      state.currentTab = action.payload
    },
    updateElementStatus: (state, action: PayloadAction<{ type: 'input' | 'button' | 'output'; isSelected: boolean }>) => {
      const { type, isSelected } = action.payload
      if (state.detectedElements[type]) {
        state.detectedElements[type]!.isSelected = isSelected
      }
    },
    setMapping: (state, action: PayloadAction<PageElementMapping | null>) => {
      state.mapping = action.payload
    },
    setSelectedElement: (state, action: PayloadAction<ElementInfo | null>) => {
      state.selectedElement = action.payload
    },
  },
})

export const {
  setElementDetected,
  clearElement,
  clearAllElements,
  setSelectionMode,
  setCurrentTab,
  updateElementStatus,
  setMapping,
  setSelectedElement,
} = elementsSlice.actions
