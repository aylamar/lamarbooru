// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import preprocess from "svelte-preprocess";

const config = {
    preprocess: preprocess({
        postcss: true,
    }),
    kit: {
        adapter: adapter({
            // default options are shown
            out: 'build/client',
            precompress: true,
            envPrefix: ''
        }),
        files: {
            assets: 'static',
            hooks: 'src/client/hooks',
            lib: 'src/client/lib',
            params: 'src/client/params',
            routes: 'src/client/routes',
            serviceWorker: 'src/client/service-worker',
            template: 'src/client/app.html'
        },
    },
};


export default config;
