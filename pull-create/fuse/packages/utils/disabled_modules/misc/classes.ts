
export {}
exports.InheritMultiple = void 0;
function InheritMultiple(bases = []): any {
    class Bases {
        constructor() {
            bases.forEach(base => Object.assign(this, new base()));
        }
    }
    bases.forEach(base => {
        Object.getOwnPropertyNames(base.prototype)
            .filter(prop => prop !== 'constructor')
            .forEach(prop => (Bases.prototype[prop] = base.prototype[prop]));
    });
    return Bases;
}
exports.InheritMultiple = InheritMultiple;
//# sourceMappingURL=classes.js.mapexport {};
