export const adaptNodeStyle = (type, status): any => {
    const baseStyle = getNodeStyleByType(type);
    const statusStyle = status ? getNodeStyleByStatus(status) : {};
    return Object.assign(Object.assign({}, baseStyle), statusStyle);
};
export const createNode = (id, label, type = 'default', data): any => {
    return {
        id,
        label,
        type,
        style: adaptNodeStyle(type),
        data
    };
};
export const createEdge = (source, target, label, type): any => {
    return {
        source,
        target,
        label,
        type,
        style: {
            color: '#999',
            borderColor: '#999',
            borderWidth: 1,
            borderStyle: 'solid'
        }
    };
};
export const updateNodeStyle = (node, status): any => {
    const statusStyle = getNodeStyleByStatus(status);
    return Object.assign(Object.assign({}, node), { style: Object.assign(Object.assign({}, node.style), statusStyle) });
};
export const getNodeColor = (type): any => {
    const style = getNodeStyleByType(type);
    return style.borderColor || '#999';
};
export const getNodeBackground = (type): any => {
    const style = getNodeStyleByType(type);
    return style.backgroundColor || '#fff';
};
//# sourceMappingURL=graph-adapters.js.map