import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ElementInfo {
  type: 'input' | 'button' | 'output'
  selector: string
  xpath: string
  confidence: number
  tabId?: number
  isSelected: boolean
  lastDetected: string
}

interface ElementsState {
  detectedElements: {
    input: ElementInfo | null
    button: ElementInfo | null
    output: ElementInfo | null
  }
  selectionMode: boolean
  currentTab: number | null
}

const initialState: ElementsState = {
  detectedElements: {
    input: null,
    button: null,
    output: null,
  },
  selectionMode: false,
  currentTab: null,
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
  },
})

export const {
  setElementDetected,
  clearElement,
  clearAllElements,
  setSelectionMode,
  setCurrentTab,
  updateElementStatus,
} = elementsSlice.actions
