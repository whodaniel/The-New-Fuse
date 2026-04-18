// @ts-nocheck
import { AppCreator } from './AppCreator/index';
import { AppStacker } from './AppStacker/AppStacker';
export default function Page() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AppCreator />
      <AppStacker />
    </div>
  );
}
