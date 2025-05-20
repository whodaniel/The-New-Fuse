"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDashboard = UserDashboard;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
function UserDashboard() {
    const [earnings, setEarnings] = (0, react_1.useState)(0);
    const mockApps = [
        { id: 1, name: 'Cool Chat App', downloads: 100, earnings: 50 },
        { id: 2, name: 'Awesome Todo List', downloads: 200, earnings: 100 },
    ];
    return (<div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Total Earnings</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <p className="text-4xl font-bold">${earnings}</p>
          </card_1.CardContent>
        </card_1.Card>
        {mockApps.map(app => (<card_1.Card key={app.id}>
            <card_1.CardHeader>
              <card_1.CardTitle>{app.name}</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p>Downloads: {app.downloads}</p>
              <p>Earnings: ${app.earnings}</p>
            </card_1.CardContent>
          </card_1.Card>))}
      </div>
    </div>);
}
export {};
//# sourceMappingURL=UserDashboard.js.map