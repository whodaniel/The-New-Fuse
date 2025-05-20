"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterDetails = void 0;
import react_1 from 'react';
import react_chartjs_2_1 from 'react-chartjs-2';
const ClusterDetails = ({ cluster, onClose }) => {
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const filteredItems = cluster.items.filter(item => typeof item.content === 'string'
        ? item.content.toLowerCase().includes(searchTerm.toLowerCase())
        : JSON.stringify(item.content).toLowerCase().includes(searchTerm.toLowerCase()));
    const coherenceData = {
        labels: ['Coherence'],
        datasets: [
            {
                label: 'Coherence',
                data: [cluster.coherence],
                backgroundColor: ['#36A2EB']
            }
        ]
    };
    return (<div className="cluster-details">
            <div className="header">
                <h3>Cluster Details</h3>
                <button onClick={onClose}>&times;</button>
            </div>
            <div className="content">
                <p><strong>Label:</strong> {cluster.label}</p>
                <p><strong>Size:</strong> {cluster.items.length} items</p>
                <p><strong>Coherence:</strong> {cluster.coherence.toFixed(2)}</p>
                <p><strong>Radius:</strong> {cluster.radius.toFixed(2)}</p>
                <p><strong>Centroid:</strong> {Array.from(cluster.centroid).slice(0, 5).join(', ')}...</p>
                <react_chartjs_2_1.Bar data={coherenceData} options={{ responsive: true, maintainAspectRatio: false }}/>
            </div>
            <div className="search-bar">
                <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
            <div className="items-list">
                <h4>Items</h4>
                <ul>
                    {filteredItems.map((item, index) => (<li key={index}>
                            <span>{typeof item.content === 'string' ? item.content : JSON.stringify(item.content)}</span>
                        </li>))}
                </ul>
            </div>
            <style jsx>{`
                .cluster-details {
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    max-width: 400px;
                    margin: 0 auto;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                }

                .header h3 {
                    margin: 0;
                    color: #333;
                }

                .header button {
                    background: none;
                    border: none;
                    font-size: 1.5em;
                    color: #999;
                    cursor: pointer;
                }

                .content p {
                    margin: 5px 0;
                    color: #555;
                }

                .search-bar {
                    margin: 10px 0;
                }

                .search-bar input {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }

                .items-list {
                    margin-top: 20px;
                }

                .items-list h4 {
                    margin-bottom: 10px;
                    color: #333;
                }

                .items-list ul {
                    list-style: none;
                    padding: 0;
                }

                .items-list li {
                    padding: 5px 0;
                    border-bottom: 1px solid #eee;
                    color: #666;
                }
            `}</style>
        </div>);
};
exports.ClusterDetails = ClusterDetails;
export {};
//# sourceMappingURL=ClusterDetails.js.map