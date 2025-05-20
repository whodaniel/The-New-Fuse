import { PfpContext } from '../PfpContext.js';
export default function usePfp(): any {
    const { pfp, setPfp } = useContext(PfpContext);
    return { pfp, setPfp };
}
//# sourceMappingURL=usePfp.js.map