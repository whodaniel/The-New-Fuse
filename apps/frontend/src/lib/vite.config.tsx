
export {}
/// <reference types="vitest" />
import vite_1 from 'vite';
import plugin_react_1 from '@vitejs/plugin-react';
import path_1 from 'path';
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
        },
    },
    define: {
        'process.env': {},
    },
    server: {
        port: 3000,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/setup.ts',
            ],
        },
    },
}); // Type assertion needed because Vite's types don't include test config
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZS5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2aXRlLmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdDQUFnQztBQUNoQywrQkFBb0M7QUFDcEMsdURBQXlDO0FBQ3pDLCtCQUF3QjtBQUV4Qiw2QkFBNkI7QUFDN0Isa0JBQWUsSUFBQSxtQkFBWSxFQUFDO0lBQzFCLE9BQU8sRUFBRSxDQUFDLElBQUEsc0JBQUssR0FBRSxDQUFDO0lBQ2xCLE9BQU8sRUFBRTtRQUNQLEtBQUssRUFBRTtZQUNMLEdBQUcsRUFBRSxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUM7U0FDdEM7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLGFBQWEsRUFBRSxFQUFFO0tBQ2xCO0lBQ0QsTUFBTSxFQUFFO1FBQ04sSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsSUFBSTtLQUNYO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsTUFBTSxFQUFFLE1BQU07UUFDZCxTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRSxJQUFJO1FBQ2IsV0FBVyxFQUFFLE9BQU87UUFDcEIsVUFBVSxFQUFFLENBQUMscUJBQXFCLENBQUM7UUFDbkMsT0FBTyxFQUFFLENBQUMsc0RBQXNELENBQUM7UUFDakUsUUFBUSxFQUFFO1lBQ1IsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7WUFDbEMsT0FBTyxFQUFFO2dCQUNQLGVBQWU7Z0JBQ2YsbUJBQW1CO2FBQ3BCO1NBQ0Y7S0FDRjtDQUNLLENBQUMsQ0FBQyxDQUFDLHVFQUF1RSIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidml0ZXN0XCIgLz5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgJ3Byb2Nlc3MuZW52Jzoge30sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogdHJ1ZSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvdGVzdC9zZXR1cC50cyddLFxuICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLG1qcyxjanMsdHMsbXRzLGN0cyxqc3gsdHN4fSddLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnbm9kZV9tb2R1bGVzLycsXG4gICAgICAgICdzcmMvdGVzdC9zZXR1cC50cycsXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG59IGFzIGFueSk7IC8vIFR5cGUgYXNzZXJ0aW9uIG5lZWRlZCBiZWNhdXNlIFZpdGUncyB0eXBlcyBkb24ndCBpbmNsdWRlIHRlc3QgY29uZmlnXG4iXX0=
export {};
