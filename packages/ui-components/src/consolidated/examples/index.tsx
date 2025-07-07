export * from './Button';
export * from './Card';
export * from './Label';

// Example usage showcase
import React from 'react';
import { ButtonUseCases } from './Button';
import { ComplexCard } from './Card';
import { FormFieldGroup } from './Label';

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