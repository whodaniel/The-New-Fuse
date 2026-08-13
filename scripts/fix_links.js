const fs = require('fs');

function replaceFileContent(filePath, searchValue, replaceValue) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.split(searchValue).join(replaceValue);
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

replaceFileContent('apps/frontend/src/components/SiteFooter.tsx', 'to="/community"', 'to="/docs"');
replaceFileContent('apps/frontend/src/components/SmartNavigation.tsx', 'to="/billing"', 'to="/pricing"');
replaceFileContent('apps/frontend/src/components/layout/LandingFooter.tsx', 'to="/support"', 'to="/docs"');
replaceFileContent('apps/frontend/src/layouts/HelpLayout.tsx', 'to="/support"', 'to="/docs"');
replaceFileContent('apps/frontend/src/pages/Docs.tsx', 'to="/community"', 'to="/docs"');
replaceFileContent('apps/frontend/src/pages/Home.tsx', 'to="/community"', 'to="/docs"');
replaceFileContent('apps/frontend/src/pages/Membership.tsx', 'to="/support"', 'to="/docs"');

