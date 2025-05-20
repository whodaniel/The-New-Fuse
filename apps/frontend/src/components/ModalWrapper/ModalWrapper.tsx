// This file is kept for backward compatibility
// It re-exports the consolidated Modal component with a wrapper for ModalWrapper
import React, { ReactNode } from "react";
import { Modal } from '@the-new-fuse/ui-components/src/core/dialog';

interface ModalWrapperProps {
  /**
   * The DOM/JSX to render
   */
  children: ReactNode;

  /**
   * Option that renders the modal
   */
  isOpen: boolean;

  /**
   * Used for creating sub-DOM modals that need to be rendered as a child element instead of a modal placed at the root
   * Note: This can impact the bg-overlay presentation due to conflicting DOM positions so if using this property you should
   * double check it renders as desired.
   * @default false
   */
  noPortal?: boolean;
}

/**
 * ModalWrapper component that wraps the consolidated Modal component
 * This maintains backward compatibility with the old ModalWrapper API
 */
export function ModalWrapper({ children, isOpen, noPortal = false }: ModalWrapperProps) {
  if (!isOpen) return null;

  // For noPortal=true, we render a simple div with the children
  // This maintains backward compatibility with the old ModalWrapper
  if (noPortal) {
    return (
      <div className="bg-black/60 backdrop-blur-sm fixed top-0 left-0 outline-none w-screen h-screen flex items-center justify-center z-99">
        {children}
      </div>
    );
  }

  // For normal modal rendering, use the consolidated Modal component
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // ModalWrapper doesn't have an onClose prop, so we provide an empty function
      size="fullscreen"
      position="default"
      className="bg-transparent p-0 border-0 shadow-none"
    >
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>
    </Modal>
  );
}
