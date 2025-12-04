export function useModal() {
    var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
    var openModal = function () { return setIsOpen(true); };
    var closeModal = function () { return setIsOpen(false); };
    return { isOpen: isOpen, openModal: openModal, closeModal: closeModal };
}
