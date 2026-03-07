import React, { useState } from 'react';
import './VisualCustomization.css';

const VisualCustomization = () => {
  const [bodyType, setBodyType] = useState('');
  const [facialFeatures, setFacialFeatures] = useState('');
  const [clothing, setClothing] = useState('');
  const [accessories, setAccessories] = useState('');

  const handleBodyTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setBodyType(event.target.value);
  };
  const handleFacialFeaturesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFacialFeatures(event.target.value);
  };
  const handleClothingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setClothing(event.target.value);
  };
  const handleAccessoriesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAccessories(event.target.value);
  };

  return (
    <div className="visual-customization">
      <h2>Visual Customization</h2>
      <div>
        <label>Body Type:</label>
        <select value={bodyType} onChange={handleBodyTypeChange}>
          <option value="" disabled>
            Select Body Type
          </option>
          <option value="human">Human</option>
          <option value="elf">Elf</option>
          <option value="dwarf">Dwarf</option>
        </select>
      </div>
      <div>
        <label>Facial Features:</label>
        <select value={facialFeatures} onChange={handleFacialFeaturesChange}>
          <option value="" disabled>
            Select Facial Features
          </option>
          <option value="beard">Beard</option>
          <option value="glasses">Glasses</option>
          <option value="mustache">Mustache</option>
        </select>
      </div>
      <div>
        <label>Clothing:</label>
        <select value={clothing} onChange={handleClothingChange}>
          <option value="" disabled>
            Select Clothing
          </option>
          <option value="robe">Robe</option>
          <option value="armor">Armor</option>
          <option value="casual">Casual</option>
        </select>
      </div>
      <div>
        <label>Accessories:</label>
        <select value={accessories} onChange={handleAccessoriesChange}>
          <option value="" disabled>
            Select Accessories
          </option>
          <option value="sword">Sword</option>
          <option value="staff">Staff</option>
          <option value="backpack">Backpack</option>
        </select>
      </div>
    </div>
  );
};

export default VisualCustomization;
