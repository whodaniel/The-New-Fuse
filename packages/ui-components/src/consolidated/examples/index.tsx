export * from './Button.tsx';
export * from './Card.tsx';
export * from './Label.tsx';

// Example usage showcase
import React from 'react';
import { ButtonUseCases } from './Button.tsx';
import { ComplexCard } from './Card.tsx';
import { FormFieldGroup } from './Label.tsx';

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