import React from 'react';
import { AppCreator } from './AppCreator.js';
import { AppStacker } from './AppStacker/AppStacker.js';
export default function Page() {
    return (<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <AppCreator />
      <AppStacker />
    </div>);
}
//# sourceMappingURL=page.js.map