export var adaptNodeStyle = function (type, status) {
    var baseStyle = getNodeStyleByType(type);
    var statusStyle = status ? getNodeStyleByStatus(status) : {};
    return Object.assign(Object.assign({}, baseStyle), statusStyle);
};
export var createNode = function (id, label, type, data) {
    if (type === void 0) { type = 'default'; }
    return {
        id: id,
        label: label,
        type: type,
        style: adaptNodeStyle(type),
        data: data
    };
};
export var createEdge = function (source, target, label, type) {
    return {
        source: source,
        target: target,
        label: label,
        type: type,
        style: {
            color: '#999',
            borderColor: '#999',
            borderWidth: 1,
            borderStyle: 'solid'
        }
    };
};
export var updateNodeStyle = function (node, status) {
    var statusStyle = getNodeStyleByStatus(status);
    return Object.assign(Object.assign({}, node), { style: Object.assign(Object.assign({}, node.style), statusStyle) });
};
export var getNodeColor = function (type) {
    var style = getNodeStyleByType(type);
    return style.borderColor || '#999';
};
export var getNodeBackground = function (type) {
    var style = getNodeStyleByType(type);
    return style.backgroundColor || '#fff';
};
