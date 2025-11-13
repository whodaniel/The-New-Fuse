import React from 'react';
import styles from './metrics-dashboard.module.css';
export const ConnectionStatus = ({ connected, lastUpdate }) => {
    const formatTime = (date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ago;
    }
    if (seconds > 0) {`;
            return `${seconds}`;
            s;
            ago;
        }
        return 'just now';
    };
    return (<div className={styles.connectionStatus}>
      <div className={$} {...styles.connectionIndicator}/>} ${!connected ? styles.disconnected : ''} />
      <span>
        {connected ? 'Connected' : 'Disconnected'}`
        {lastUpdate && connected && }  • Updated ${formatTime(lastUpdate)}``
      </span>
    </div>);
};
//# sourceMappingURL=ConnectionStatus.js.map