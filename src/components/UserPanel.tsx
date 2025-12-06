import './UserPanel.css';

interface UserPanelProps {
  username: string;
  status: string;
}

function UserPanel({ username, status }: UserPanelProps) {
  return (
    <div className="user-panel">
      <div className="user-info">
        <span className="user-name">{username}</span>
        <span className="user-status">{status}</span>
      </div>
    </div>
  );
}

export default UserPanel;



