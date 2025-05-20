export * from './Button.js';
export * from './Card.js';
export * from './Label.js';

// Example usage showcase
import React from 'react';
import { ButtonUseCases } from './Button.js';
import { ComplexCard } from './Card.js';
import { FormFieldGroup } from './Label.js';

export const ShowcaseExample = () => (
  <div className="p-6 space-y-8">
    <section>
      <h2 className="text-2xl font-semibold mb-4">Button Examples</h2>
      <ButtonUseCases />
    </section>
    
    <section>
      <h2 className="text-2xl font-semibold mb-4">Card Example</h2>
      <ComplexCard />
    </section>
    
    <section>
      <h2 className="text-2xl font-semibold mb-4">Form Example</h2>
      <FormFieldGroup />
    </section>
  </div>
);