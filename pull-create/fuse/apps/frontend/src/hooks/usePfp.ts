// @ts-nocheck
import { PfpContext } from '../PfpContext';
export default function usePfp(): any {
  const { pfp, setPfp } = useContext(PfpContext);
  return { pfp, setPfp };
}
