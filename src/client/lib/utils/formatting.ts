function padStart(str: string, pad: string) {
    if (str.length === 1) return pad + str;
    return str;
}

export function formatDate(date: string) {
    let d = new Date(date);
    let year = d.getFullYear();
    let month = padStart((1 + d.getMonth()).toString(), '0');
    let day = padStart(d.getDate().toString(), '0');
    let hour = padStart(d.getHours().toString(), '0');
    let min = padStart(d.getMinutes().toString(), '0');
    return [year, month, day].join('/') + ' ' + [hour, min].join(':');
}
