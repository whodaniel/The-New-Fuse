Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
require("./VisualCustomization.css");
const VisualCustomization = () => {
    const [bodyType, setBodyType] = (0, react_1.useState)('');
    const [facialFeatures, setFacialFeatures] = (0, react_1.useState)('');
    const [clothing, setClothing] = (0, react_1.useState)('');
    const [accessories, setAccessories] = (0, react_1.useState)('');
    const handleBodyTypeChange = (event) => {
        setBodyType(event.target.value);
    };
    const handleFacialFeaturesChange = (event) => {
        setFacialFeatures(event.target.value);
    };
    const handleClothingChange = (event) => {
        setClothing(event.target.value);
    };
    const handleAccessoriesChange = (event) => {
        setAccessories(event.target.value);
    };
    return (<div className="visual-customization">
      <h2>Visual Customization</h2>
      <div>
        <label>Body Type:</label>
        <select value={bodyType} onChange={handleBodyTypeChange}>
          <option value="" disabled>Select Body Type</option>
          <option value="human">Human</option>
          <option value="elf">Elf</option>
          <option value="dwarf">Dwarf</option>
          
        </select>
      </div>
      <div>
        <label>Facial Features:</label>
        <select value={facialFeatures} onChange={handleFacialFeaturesChange}>
          <option value="" disabled>Select Facial Features</option>
          <option value="beard">Beard</option>
          <option value="glasses">Glasses</option>
          <option value="mustache">Mustache</option>
          
        </select>
      </div>
      <div>
        <label>Clothing:</label>
        <select value={clothing} onChange={handleClothingChange}>
          <option value="" disabled>Select Clothing</option>
          <option value="robe">Robe</option>
          <option value="armor">Armor</option>
          <option value="casual">Casual</option>
          
        </select>
      </div>
      <div>
        <label>Accessories:</label>
        <select value={accessories} onChange={handleAccessoriesChange}>
          <option value="" disabled>Select Accessories</option>
          <option value="sword">Sword</option>
          <option value="staff">Staff</option>
          <option value="backpack">Backpack</option>
          
        </select>
      </div>
    </div>);
};
exports.default = VisualCustomization;
export {};
//# sourceMappingURL=VisualCustomization.js.map