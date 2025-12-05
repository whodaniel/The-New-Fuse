"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components';
import { Box, SimpleGrid, GridItem } from '@chakra-ui/react';
import { Settings } from '@chakra-ui/icons';
const Settings = () => {
    const [settings, setSettings] = react_1.default.useState({
        enableLogging: true,
        debugMode: false,
        maxAgents: 10,
        apiKey: '',
        webhookUrl: '',
    });
    const handleSettingChange = (setting) => (event) => {
        setSettings(Object.assign(Object.assign({}, settings), { [setting]: event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value }));
    };
    return (<div className="p-6">
      <SimpleGrid columns={3}>

        <GridItem colSpan={12} md={6}>
          <Box className="p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <icons_material_1.Settings className="mr-2"/>
              System Settings
            </h2>
            <material_1.List>
              <material_1.ListItem>
                <material_1.ListItemIcon>
                  <icons_material_1.Storage />
                </material_1.ListItemIcon>
                <material_1.ListItemText primary="Enable Logging" secondary="Record detailed system logs"/>
                <material_1.Switch edge="end" checked={settings.enableLogging} onChange={handleSettingChange('enableLogging')}/>
              </material_1.ListItem>
              <material_1.ListItem>
                <material_1.ListItemIcon>
                  <icons_material_1.Memory />
                </material_1.ListItemIcon>
                <material_1.ListItemText primary="Debug Mode" secondary="Enable detailed debugging information"/>
                <material_1.Switch edge="end" checked={settings.debugMode} onChange={handleSettingChange('debugMode')}/>
              </material_1.ListItem>
              <material_1.ListItem>
                <material_1.ListItemIcon>
                  <icons_material_1.Api />
                </material_1.ListItemIcon>
                <material_1.ListItemText primary="Max Concurrent Agents" secondary="Maximum number of agents that can run simultaneously"/>
                <material_1.TextField type="number" value={settings.maxAgents} onChange={handleSettingChange('maxAgents')} size="small" style={{ width: 100 }}/>
              </material_1.ListItem>
            </material_1.List>
          </Box>
        </GridItem>

        <GridItem colSpan={12} md={6}>
          <Box className="p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <icons_material_1.Security className="mr-2"/>
              API Configuration
            </h2>
            <div className="space-y-4">
              <material_1.TextField fullWidth label="API Key" type="password" value={settings.apiKey} onChange={handleSettingChange('apiKey')}/>
              <material_1.TextField fullWidth label="Webhook URL" value={settings.webhookUrl} onChange={handleSettingChange('webhookUrl')}/>
              <material_1.Button variant="contained" color="primary">
                Verify Configuration
              </material_1.Button>
            </div>
          </Box>
        </GridItem>

        <GridItem colSpan={12} md={6}>
          <Box className="p-4">
            <h2 className="text-xl font-bold mb-4">LLM Configuration</h2>
            <components_1.LLMSelector />
          </Box>
        </GridItem>

        <GridItem colSpan={12} md={6}>
          <Box className="p-4">
            <h2 className="text-xl font-bold mb-4">GPU Management</h2>
            <components_1.GPUManager />
          </Box>
        </GridItem>

        <GridItem colSpan={12}>
          <Box className="p-4">
            <h2 className="text-xl font-bold mb-4">Webhook Management</h2>
            <components_1.WebhookManager />
          </Box>
        </GridItem>
      </SimpleGrid>
    </div>);
};
exports.default = Settings;
export {};
