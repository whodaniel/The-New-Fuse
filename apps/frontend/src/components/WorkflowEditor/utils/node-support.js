export var N8N_NODE_CATEGORIES = {
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
export function getNodeCategoryFromMetadata(nodeTypeData) {
    for (var categoryName in N8N_NODE_CATEGORIES) {
        if (nodeTypeData.categories.includes(categoryName)) {
            return categoryName;
        }
    }
    return 'common';
}
