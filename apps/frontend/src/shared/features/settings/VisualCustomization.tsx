import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { Select } from '@/shared/ui/core/Select';
export function VisualCustomization({ onCustomizationChange }) {
    const [customization, setCustomization] = React.useState({
        bodyType: '',
        facialFeatures: '',
        clothing: '',
        accessories: '',
    });
    const handleChange = (type, value) => {
        setCustomization((prev: any) => (Object.assign(Object.assign({}, prev), { [type]: value })));
        onCustomizationChange === null || onCustomizationChange === void 0 ? void 0 : onCustomizationChange(type, value);
    };
    return (<Card className="p-6">
      <h2 className="text-xl font-bold mb-6">Visual Customization</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-medium">Body Type</label>
          <Select value={customization.bodyType} onValueChange={(value) => handleChange('bodyType', value)}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select Body Type"/>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="human">Human</Select.Item>
              <Select.Item value="elf">Elf</Select.Item>
              <Select.Item value="dwarf">Dwarf</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Facial Features</label>
          <Select value={customization.facialFeatures} onValueChange={(value) => handleChange('facialFeatures', value)}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select Facial Features"/>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="beard">Beard</Select.Item>
              <Select.Item value="glasses">Glasses</Select.Item>
              <Select.Item value="mustache">Mustache</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Clothing</label>
          <Select value={customization.clothing} onValueChange={(value) => handleChange('clothing', value)}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select Clothing"/>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="robe">Robe</Select.Item>
              <Select.Item value="armor">Armor</Select.Item>
              <Select.Item value="casual">Casual</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Accessories</label>
          <Select value={customization.accessories} onValueChange={(value) => handleChange('accessories', value)}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select Accessories"/>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="sword">Sword</Select.Item>
              <Select.Item value="staff">Staff</Select.Item>
              <Select.Item value="backpack">Backpack</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
    </Card>);
}
//# sourceMappingURL=VisualCustomization.js.map