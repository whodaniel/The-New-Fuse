import fs from 'fs';
import path from 'path';
if (fs.existsSync('database.db')) {
    fs.unlinkSync('database.db');
}
const db = new Database('database.db');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);
const sampleApps = [
    {
        id: '1',
        name: 'Media Player Pro',
        creator: 'System',
        color: '#FF4444',
        description: 'Advanced media player with support for multiple formats',
        ownership: 25,
        token_balance: 10,
        modules: JSON.stringify(['Media Player', 'File Upload', 'Social Integration']),
        customization: JSON.stringify({
            theme: 'dark',
            primaryColor: '#FF4444',
            fontSize: 16,
            fontFamily: 'Inter',
            buttonStyle: 'rounded'
        })
    },
    {
        id: '2',
        name: 'Social Hub',
        creator: 'System',
        color: '#44FF44',
        description: 'Connect and share across multiple platforms',
        ownership: 30,
        token_balance: 15,
        modules: JSON.stringify(['Social Integration', 'Real-time Chat', 'Media Upload']),
        customization: JSON.stringify({
            theme: 'light',
            primaryColor: '#44FF44',
            fontSize: 14,
            fontFamily: 'Arial',
            buttonStyle: 'square'
        })
    },
    {
        id: '3',
        name: 'Creative Studio',
        creator: 'System',
        color: '#4444FF',
        description: 'Complete creative suite for digital artists',
        ownership: 20,
        token_balance: 20,
        modules: JSON.stringify(['Drawing Canvas', 'Image Gallery', 'File Storage']),
        customization: JSON.stringify({
            theme: 'light',
            primaryColor: '#4444FF',
            fontSize: 18,
            fontFamily: 'Helvetica',
            buttonStyle: 'rounded'
        })
    }
];
const insertAppStmt = db.prepare(`
  INSERT INTO apps (id, name, creator, color, description, ownership, token_balance, modules, customization)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const app of sampleApps) {
    try {
        insertAppStmt.run(app.id, app.name, app.creator, app.color, app.description, app.ownership, app.token_balance, app.modules, app.customization);
    }
    catch (error) {
        console.error('Error inserting sample app:', error);
    }
}
const sampleTokens = [
    {
        id: '1',
        owner_id: '1',
        amount: 5
    },
    {
        id: '2',
        owner_id: '2',
        amount: 7
    },
    {
        id: '3',
        owner_id: '3',
        amount: 10
    }
];
const insertTokenStmt = db.prepare(`
  INSERT INTO tokens (id, owner_id, amount)
  VALUES (?, ?, ?)
`);
for (const token of sampleTokens) {
    try {
        insertTokenStmt.run(token.id, token.owner_id, token.amount);
    }
    catch (error) {
        console.error('Error inserting sample token:', error);
    }
}
const sampleMediaAssets = [
    {
        id: '1',
        app_id: '1',
        file_url: '/uploads/sample-video.mp4',
        file_type: 'video/mp4',
        file_name: 'sample-video.mp4'
    },
    {
        id: '2',
        app_id: '2',
        file_url: '/uploads/profile-image.jpg',
        file_type: 'image/jpeg',
        file_name: 'profile-image.jpg'
    },
    {
        id: '3',
        app_id: '3',
        file_url: '/uploads/artwork.png',
        file_type: 'image/png',
        file_name: 'artwork.png'
    }
];
const insertMediaAssetStmt = db.prepare(`
  INSERT INTO app_media_assets (id, app_id, file_url, file_type, file_name)
  VALUES (?, ?, ?, ?, ?)
`);
for (const asset of sampleMediaAssets) {
    try {
        insertMediaAssetStmt.run(asset.id, asset.app_id, asset.file_url, asset.file_type, asset.file_name);
    }
    catch (error) {
        console.error('Error inserting sample media asset:', error);
    }
}
const sampleSocialLinks = [
    {
        id: '1',
        app_id: '1',
        platform: 'Twitter',
        url: 'https://twitter.com/mediaplayer'
    },
    {
        id: '2',
        app_id: '2',
        platform: 'Instagram',
        url: 'https://instagram.com/socialhub'
    },
    {
        id: '3',
        app_id: '3',
        platform: 'Behance',
        url: 'https://behance.net/creativestudio'
    }
];
const insertSocialLinkStmt = db.prepare(`
  INSERT INTO app_social_links (id, app_id, platform, url)
  VALUES (?, ?, ?, ?)
`);
for (const link of sampleSocialLinks) {
    try {
        insertSocialLinkStmt.run(link.id, link.app_id, link.platform, link.url);
    }
    catch (error) {
        console.error('Error inserting sample social link:', error);
    }
}
const sampleNestedRelationships = [
    {
        parent_app_id: '1',
        child_app_id: '2',
        position: 0
    },
    {
        parent_app_id: '1',
        child_app_id: '3',
        position: 1
    },
    {
        parent_app_id: '2',
        child_app_id: '3',
        position: 0
    }
];
const insertNestedRelationshipStmt = db.prepare(`
  INSERT INTO app_nested_relationships (parent_app_id, child_app_id, position)
  VALUES (?, ?, ?)
`);
for (const relationship of sampleNestedRelationships) {
    try {
        insertNestedRelationshipStmt.run(relationship.parent_app_id, relationship.child_app_id, relationship.position);
    }
    catch (error) {
        console.error('Error inserting sample nested relationship:', error);
    }
}

db.close();
export {};
//# sourceMappingURL=initDb.js.map