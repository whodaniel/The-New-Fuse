import React, { useState } from 'react';
import { Box, Input, Button, Text, VStack } from '@chakra-ui/react';
export const AgentSkillMarketplace = ({ agentId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [skills] = useState([
        { id: '1', name: 'Natural Language Processing', description: 'Advanced text processing and understanding', level: 1 },
        { id: '2', name: 'Computer Vision', description: 'Image and video analysis', level: 1 },
        { id: '3', name: 'Data Analysis', description: 'Statistical analysis and data processing', level: 1 },
    ]);
    const handleInstallSkill = (skillId) => {
        
    };
    const filteredSkills = skills.filter(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (<Box p={4}>
      <Input placeholder="Search skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} mb={4}/>
      <VStack spacing={2} align="stretch">
        {filteredSkills.map(skill => (<Box key={skill.id} p={4} borderWidth="1px" borderRadius="md" display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Text fontWeight="bold">{skill.name}</Text>
              <Text fontSize="sm" color="gray.600">{skill.description}</Text>
            </Box>
            <Button colorScheme="blue" size="sm" onClick={() => handleInstallSkill(skill.id)}>
              Install
            </Button>
          </Box>))}
      </VStack>
    </Box>);
};
//# sourceMappingURL=agent-skill-marketplace.js.map