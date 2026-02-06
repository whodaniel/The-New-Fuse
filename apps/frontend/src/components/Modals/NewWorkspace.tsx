import { useState } from 'react';

export const useNewWorkspaceModal = () => {
  const [showing, setShowing] = useState(false);

  const showModal = () => setShowing(true);
  const hideModal = () => setShowing(false);

  return { showing, showModal, hideModal };
};

const NewWorkspaceModal = ({ hideModal }: { hideModal: () => void }) => {
  return (
    <div className="new-workspace-modal">
      <h1>New Workspace Modal</h1>
      <p>This is a placeholder component.</p>
      <button onClick={hideModal}>Close</button>
    </div>
  );
};

export default NewWorkspaceModal;
