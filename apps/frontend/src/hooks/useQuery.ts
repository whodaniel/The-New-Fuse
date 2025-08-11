export default function useQuery(): any {
    return new URLSearchParams(window.location.search);
}
