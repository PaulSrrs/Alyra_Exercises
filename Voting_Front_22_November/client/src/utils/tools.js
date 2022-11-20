export default function formatETHAddress(s, size = 4) {
    const first = s.slice(0, size + 1);
    const last = s.slice(-size);
    return first + "..." + last;
}
