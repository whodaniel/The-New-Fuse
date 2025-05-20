// Re-export the Button component from the ui-components package
import { Button as UIButton, ButtonProps } from '@the-new-fuse/ui-components/src/core/button';

export const Button = UIButton;
export type { ButtonProps };
