import { PfpContext } from '../PfpContext.tsx';
export default function usePfp(): any {
    const { pfp, setPfp } = useContext(PfpContext);
    return { pfp, setPfp };
}
//# sourceMappingURL=usePfp.js.map