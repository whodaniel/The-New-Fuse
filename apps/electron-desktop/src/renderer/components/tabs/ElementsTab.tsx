import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Card, CardContent, Badge, Alert, Container } from '@the-new-fuse/ui-consolidated'
import toast from 'react-hot-toast'
import { FiTarget, FiRefreshCw, FiEye } from 'react-icons/fi'
import type { RootState } from '../../store/store'

export const ElementsTab: React.FC = () => {
  const { elements } = useSelector((state: RootState) => state.elements)
  const { tnfRelay } = useSelector((state: RootState) => state.connections)
  
  const [autoDetecting, setAutoDetecting] = useState(false)
  const [selectedElementType, setSelectedElementType] = useState<'input' | 'button' | 'output' | null>(null)

  const handleAutoDetect = async () => {
    if (!tnfRelay.connected) {
      toast.error('Not Connected - Please connect to TNF Relay first')
      return
    }

    setAutoDetecting(true)
    try {
      if (window.api) {
        // This would trigger auto-detection in the connected Chrome extension
        const response = await window.api.chromeSendMessage({ type: 'AUTO_DETECT_ELEMENTS' })
        if (response.success) {
          toast({
            title: 'Auto-Detection Started',
            description: 'Scanning the active browser tab for chat elements',
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Detection Failed',
        description: 'Failed to start auto-detection',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setTimeout(() => setAutoDetecting(false), 3000)
    }
  }

  const handleManualSelect = async (elementType: 'input' | 'button' | 'output') => {
    if (!tnfRelay.connected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to TNF Relay first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setSelectedElementType(elementType)
    try {
      if (window.api) {
        const response = await window.api.chromeSendMessage({ 
          type: 'ENTER_SELECTION_MODE',
          elementType 
        })
        if (response.success) {
          toast({
            title: 'Selection Mode Active',
            description: `Click on the ${elementType} element in your browser`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Selection Failed',
        description: 'Failed to enter selection mode',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setSelectedElementType(null)
    }
  }

  const getElementStatus = (elementType: 'input' | 'button' | 'output') => {
    if (!mapping) return { detected: false, confidence: 0 }
    
    const element = mapping[elementType === 'input' ? 'chatInput' : 
                            elementType === 'button' ? 'sendButton' : 'chatOutput']
    
    return {
      detected: !!element,
      confidence: element?.confidence || 0
    }
  }

  const getElementInfo = (elementType: 'input' | 'button' | 'output') => {
    if (!mapping) return null
    
    return mapping[elementType === 'input' ? 'chatInput' : 
                   elementType === 'button' ? 'sendButton' : 'chatOutput']
  }

  const renderElementCard = (elementType: 'input' | 'button' | 'output', title: string, description: string) => {
    const status = getElementStatus(elementType)
    const elementInfo = getElementInfo(elementType)
    const isSelecting = selectedElementType === elementType

    return (
      <Card 
        bg="whiteAlpha.100" 
        borderColor={status.detected ? "green.400" : "whiteAlpha.200"}
        borderWidth={status.detected ? "2px" : "1px"}
      >
        <CardBody>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="md" fontWeight="bold">{title}</Text>
              <Badge 
                colorScheme={status.detected ? 'green' : 'gray'} 
                variant="solid"
              >
                {status.detected ? 'Detected' : 'Not Detected'}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              {description}
            </Text>

            {status.detected && (
              <VStack spacing={2} align="stretch">
                <HStack>
                  <Text fontSize="xs" color="gray.500">Confidence:</Text>
                  <Progress 
                    value={status.confidence} 
                    size="sm" 
                    colorScheme="green" 
                    flex={1}
                  />
                  <Text fontSize="xs" color="gray.500">{status.confidence}%</Text>
                </HStack>
                
                {elementInfo && (
                  <Box bg="whiteAlpha.50" p={2} borderRadius="md">
                    <Text fontSize="xs" color="gray.400" mb={1}>Selector:</Text>
                    <Text fontSize="xs" fontFamily="mono" color="blue.300">
                      {elementInfo.selector}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}

            <HStack spacing={2}>
              <Button
                onClick={() => handleManualSelect(elementType)}
                size="sm"
                colorScheme="blue"
                variant="outline"
                leftIcon={<FiTarget />}
                isLoading={isSelecting}
                loadingText="Select in browser..."
              >
                Select Manually
              </Button>
              
              {status.detected && (
                <Tooltip label="View element details">
                  <IconButton
                    aria-label="View details"
                    icon={<FiEye />}
                    size="sm"
                    variant="ghost"
                  />
                </Tooltip>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Connection Status Alert */}
      {!tnfRelay.connected && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              TNF Relay connection required for element detection. 
              Please connect in the Connections tab first.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Current Page Info */}
      {mapping && (
        <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
          <CardBody>
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="bold">Current Page</Text>
                <Badge colorScheme="blue" variant="subtle">
                  {mapping.domain}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.400" noOfLines={1}>
                {mapping.url}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Last updated: {new Date(mapping.timestamp).toLocaleString()}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Auto Detection */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">Auto Detection</Text>
              <Button
                onClick={handleAutoDetect}
                colorScheme="green"
                leftIcon={<FiRefreshCw />}
                isLoading={autoDetecting}
                loadingText="Scanning..."
                isDisabled={!tnfRelay.connected}
              >
                Scan Active Tab
              </Button>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Automatically detect chat input, send button, and output elements on the active browser tab.
            </Text>
          </VStack>
        </CardBody>
      </Card>

      <Divider />

      {/* Element Detection Grid */}
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
        <GridItem>
          {renderElementCard('input', 'Chat Input', 'Text input field where messages are typed')}
        </GridItem>
        <GridItem>
          {renderElementCard('button', 'Send Button', 'Button that sends the chat message')}
        </GridItem>
        <GridItem>
          {renderElementCard('output', 'Chat Output', 'Area where chat messages are displayed')}
        </GridItem>
      </Grid>

      {/* Selected Element Details */}
      {selectedElement && (
        <Card bg="whiteAlpha.100" borderColor="blue.400" borderWidth="2px">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Selected Element Details</Text>
                <Badge colorScheme="blue" variant="solid">
                  {selectedElement.elementType}
                </Badge>
              </HStack>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text fontSize="sm" color="gray.400">Tag:</Text>
                  <Text fontSize="sm">{selectedElement.tag}</Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color="gray.400">Confidence:</Text>
                  <Text fontSize="sm">{selectedElement.confidence}%</Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color="gray.400">Visible:</Text>
                  <Text fontSize="sm">{selectedElement.isVisible ? 'Yes' : 'No'}</Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color="gray.400">Interactable:</Text>
                  <Text fontSize="sm">{selectedElement.isInteractable ? 'Yes' : 'No'}</Text>
                </GridItem>
              </Grid>

              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" color="gray.400">CSS Selector:</Text>
                <Textarea
                  value={selectedElement.selector}
                  isReadOnly
                  size="sm"
                  bg="whiteAlpha.50"
                  fontFamily="mono"
                  fontSize="xs"
                  rows={2}
                />
              </VStack>

              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" color="gray.400">XPath:</Text>
                <Textarea
                  value={selectedElement.xpath}
                  isReadOnly
                  size="sm"
                  bg="whiteAlpha.50"
                  fontFamily="mono"
                  fontSize="xs"
                  rows={2}
                />
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}
