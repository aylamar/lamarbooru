interface apiCall {
    host: string,
    endpoint: string,
    method: string,
    body?: string,
    callback?: (data: any) => any,
}

export async function callAPI(args: apiCall) {
    // ts-ignore is needed for Base_URL
    // @ts-ignore
    let url = (import.meta.env.VITE_BASE_URL || args.host) + args.endpoint;
    // let url = (args.host) + args.endpoint;

    let res: Response;

    if (!args.body) {
        res = await fetch(url, {
            method: args.method, headers: {
                'Content-Type': 'application/json',
            },
        });
    } else {
        res = await fetch(url, {
            method: args.method, headers: {
                'Content-Type': 'application/json',
            }, body: args.body,
        });
    }

    if (res.ok && args.callback) return args.callback(res);
    if (res.ok) return res;
    throw new Error(`${ res.status }: ${ res.statusText }`);
}
