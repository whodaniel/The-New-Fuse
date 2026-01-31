import { PricingType } from '@the-new-fuse/marketplace-gateway';
import { Coins, Tag, Upload, X } from 'lucide-react';
import React, { useState } from 'react';

// Placeholder for now, assume generic Modal logic or use a simple absolute div overlay if Headless UI isn't setup
// Using a simple Tailwind modal for maximum compatibility without deps dependencies

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PublishFormData) => void;
  initialName?: string;
  initialDescription?: string;
}

export interface PublishFormData {
  name: string;
  description: string;
  pricingType: PricingType;
  price: number;
  category: string;
  tags: string[];
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = '',
  initialDescription = '',
}) => {
  const [formData, setFormData] = useState<PublishFormData>({
    name: initialName,
    description: initialDescription,
    pricingType: 'FREE',
    price: 0,
    category: 'Productivity',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Publish to Marketplace
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Asset Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Senior React Developer Persona"
            />

            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this asset do?"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.pricingType}
                onChange={(e) => setFormData({ ...formData, pricingType: e.target.value as any })}
              >
                <option value="FREE">Free</option>
                <option value="ONE_TIME">One-time Purchase</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </div>

            {formData.pricingType !== 'FREE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  Price (USD) <Coins size={14} className="text-yellow-500" />
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-blue-900"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Tag size={14} /> Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() =>
                      setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))
                    }
                    className="hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(formData)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all shadow-blue-500/20"
          >
            🚀 Publish Asset
          </button>
        </div>
      </div>
    </div>
  );
};
