export function useModal(): any {
    const [isOpen, setIsOpen] = useState(false);
    const openModal = (): any => setIsOpen(true);
    const closeModal = (): any => setIsOpen(false);
    return { isOpen, openModal, closeModal };
}
//# sourceMappingURL=useModal.js.map