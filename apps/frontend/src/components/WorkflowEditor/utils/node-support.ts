export const N8N_NODE_CATEGORIES = {
    trigger: ['trigger'],
    input: ['input'],
    output: ['output'],
    action: ['action'],
    utility: ['utility'],
    advanced: ['advanced'],
    transform: ['transform'],
    integration: ['integration'],
    flow: ['flow']
};
export function getNodeCategoryFromMetadata(nodeTypeData): any {
    for (const categoryName in N8N_NODE_CATEGORIES) {
        if (nodeTypeData.categories.includes(categoryName)) {
            return categoryName;
        }
    }
    return 'common';
}
//# sourceMappingURL=node-support.js.map