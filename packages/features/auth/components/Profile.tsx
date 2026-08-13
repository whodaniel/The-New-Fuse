import { FC } from 'react';

export interface ProfileProps {
  user?: { name: string; email: string };
  onEdit?: () => void;
}

export const Profile: FC<ProfileProps> = ({ user, onEdit }) => (
  <div className="tnf-profile" data-testid="profile">
    <h2>Profile</h2>
    {user ? (
      <div>
        <p>{user.name}</p>
        <p>{user.email}</p>
        {onEdit && <button onClick={onEdit}>Edit</button>}
      </div>
    ) : (
      <p>No user data</p>
    )}
  </div>
);
export default Profile;
