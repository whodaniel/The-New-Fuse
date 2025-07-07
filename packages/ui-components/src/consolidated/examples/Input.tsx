import React from 'react';
import { Input } from '../../core/input/Input';

export default function InputExample() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Input Examples</h2>
      <Input placeholder="Basic input" />
      <Input label="With Label" placeholder="Enter text..." />
      <Input label="With Error" error="This field is required" />
      <Input label="Multiline" multiline placeholder="Enter multiple lines..." />
    </div>
  );
}