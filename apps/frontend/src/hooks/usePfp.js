import { PfpContext } from '../PfpContext';
export default function usePfp() {
    var _a = useContext(PfpContext), pfp = _a.pfp, setPfp = _a.setPfp;
    return { pfp: pfp, setPfp: setPfp };
}
