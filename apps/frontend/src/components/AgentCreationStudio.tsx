import React, { useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Button, Input, Select, SliderTrack, SliderFilledTrack, SliderThumb, Slider as ChakraSlider, useColorMode, } from '@chakra-ui/react';
const AgentCreationStudio = ({ onSubmit }) => {
    const { colorMode } = useColorMode();
    const [currentStep, setCurrentStep] = useState(0);
    const [agentData, setAgentData] = useState({
        name: '',
        type: 'humanoid',
        status: 'idle',
        personality: {
            openness: 0.5,
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            neuroticism: 0.5,
        },
        skills: [],
        avatar: '',
    });
    const handleFieldChange = useCallback((field, value) => {
        setAgentData((prev) => (Object.assign(Object.assign({}, prev), { [field]: value })));
    }, []);
    const handleSkillChange = useCallback((skill, value) => {
        setAgentData((prev) => (Object.assign(Object.assign({}, prev), { skills: [...(prev.skills || []), skill] })));
    }, []);
    const handleTraitChange = useCallback((trait, value) => {
        setAgentData((prev) => (Object.assign(Object.assign({}, prev), { personality: prev.personality ? Object.assign(Object.assign({}, prev.personality), { [trait]: value }) : undefined })));
    }, []);
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (agentData.name && agentData.type && agentData.status) {
            onSubmit(agentData);
        }
    }, [agentData, onSubmit]);
    const renderStep = (step) => {
        var _a;
        switch (step) {
            case 0:
                return (<VStack gap={4}>
            <Box>
              <Text mb={2}>Name</Text>
              <Input value={agentData.name} onChange={(e) => handleFieldChange('name', e.target.value)}/>
            </Box>
            <Box>
              <Text mb={2}>Type</Text>
              <Select value={agentData.type} onChange={(e) => handleFieldChange('type', e.target.value)} placeholder="Select agent type">
                <option value="humanoid">Humanoid</option>
                <option value="robotic">Robotic</option>
                <option value="abstract">Abstract</option>
              </Select>
            </Box>
          </VStack>);
            case 1:
                return (<VStack gap={4}>
            {Object.entries(agentData.personality || {}).map(([trait, value]) => (<Box key={trait} width="100%">
                <Text mb={2}>{trait}</Text>
                <ChakraSlider value={value} onChange={(val) => handleTraitChange(trait, val)} min={0} max={1} step={0.1}>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </ChakraSlider>
              </Box>))}
          </VStack>);
            case 2:
                return (<VStack gap={4}>
            {(_a = agentData.skills) === null || _a === void 0 ? void 0 : _a.map((skill, index) => (<HStack key={index} width="100%">
                <Text>{skill}</Text>
                <Button onClick={() => setAgentData((prev) => {
                            var _a;
                            return (Object.assign(Object.assign({}, prev), { skills: (_a = prev.skills) === null || _a === void 0 ? void 0 : _a.filter((_, i) => i !== index) }));
                        })}>
                  Remove
                </Button>
              </HStack>))}
            <Button onClick={() => { var _a; return handleSkillChange(`Skill ${(((_a = agentData.skills) === null || _a === void 0 ? void 0 : _a.length) || 0) + 1}`, 0); }}>
              Add Skill
            </Button>
          </VStack>);
            default:
                return null;
        }
    };
    return (<Box p={4} borderWidth="1px" borderRadius="lg">
      <form onSubmit={handleSubmit}>
        {renderStep(currentStep)}
        <HStack mt={4} gap={4}>
          {currentStep > 0 && (<Button onClick={() => setCurrentStep((prev) => prev - 1)}>
              Previous
            </Button>)}
          {currentStep < 2 ? (<Button onClick={() => setCurrentStep((prev) => prev + 1)}>
              Next
            </Button>) : (<Button type="submit" colorScheme="blue">
              Create Agent
            </Button>)}
        </HStack>
      </form>
    </Box>);
};
export default AgentCreationStudio;
//# sourceMappingURL=AgentCreationStudio.js.map