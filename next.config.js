// Use the SentryWebpack plugin to upload the source maps during build step
const WorkerPlugin = require('worker-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withWorkbox = require('next-with-workbox');

const {
    NEXT_PUBLIC_SENTRY_DSN: SENTRY_DSN,
    GITHUB_COMMIT_SHA: COMMIT_SHA,
} = process.env;

process.env.SENTRY_DSN = SENTRY_DSN;

module.exports = withWorkbox(withBundleAnalyzer({
    target: 'serverless',
    productionBrowserSourceMaps: true,
    env: {
        // Make the COMMIT_SHA available to the client so that Sentry events can be
        // marked for the release they belong to. It may be undefined if running
        // outside of Vercel
        NEXT_PUBLIC_COMMIT_SHA: COMMIT_SHA,
    },
    workbox: {
        swSrc: 'src/serviceWorker.js',
    },
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.plugins.push(
                new WorkerPlugin({
                    // use "self" as the global object when receiving hot updates.
                    globalObject: 'self',
                }),
            );
            config.resolve.alias['@sentry/node'] = '@sentry/browser';
        }
        // Define an environment variable so source code can check whether or not
        // it's running on the server so we can correctly initialize Sentry
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.NEXT_IS_SERVER': JSON.stringify(
                    isServer.toString(),
                ),
            }),
        );
        // if (
        //     SENTRY_DSN &&
        //     SENTRY_ORG &&
        //     SENTRY_PROJECT &&
        //     SENTRY_AUTH_TOKEN &&
        //     NODE_ENV === 'production'
        // ) {
        //     config.plugins.push(
        //         new SentryWebpackPlugin({
        //             include: '.next',
        //             ignore: ['node_modules'],
        //             stripPrefix: ['webpack://_N_E/'],
        //             urlPrefix: `~${basePath}/_next`,
        //         }),
        //     );
        // }
        return config;
    },
    headers: async ()=>{
        return [{
            source: '/:any', headers: [
                {
                    key: 'Cross-Origin-Opener-Policy', value: 'same-origin',
                },
                {
                    key: 'Cross-Origin-Embedder-Policy', value: 'require-corp',
                },
                {
                    key: 'Cross-Origin-Resource-Policy', value: 'cross-origin',
                },
            ],
        },
        {
            source: '/_next/static/chunks/:any', headers: [
                {
                    key: 'Cross-Origin-Opener-Policy', value: 'same-origin',
                },
                {
                    key: 'Cross-Origin-Embedder-Policy', value: 'require-corp',
                },
                {
                    key: 'Cross-Origin-Resource-Policy', value: 'cross-origin',
                },
            ],
        }];
    },
}));
