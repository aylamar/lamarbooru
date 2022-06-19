export function getStyle(rowNumber: number) {
    if (rowNumber % 2 === 0) {
        return 'bg-slate-800/50';
    }
    return 'bg-slate-800/25';
}

export function getStatusStyle(status: string) {
    switch (status) {
        case 'running':
            return 'p-1 text-xs uppercase text-green-700 bg-green-200 rounded-md';
        case 'paused':
            return 'p-1 text-xs uppercase text-slate-700 bg-slate-300 rounded-md';
        case 'waiting':
            return 'p-1 text-xs uppercase text-purple-700 bg-purple-200 rounded-md';
        case  'finished':
            return 'p-1 text-xs uppercase text-blue-700 bg-blue-200 rounded-md';
    }
}
