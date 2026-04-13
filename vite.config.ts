import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@directives': path.resolve(__dirname, 'src/directives'),
            '@images': path.resolve(__dirname, 'src/images'),
            '@layouts': path.resolve(__dirname, 'src/layouts'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@routes': path.resolve(__dirname, 'src/routes'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@stores': path.resolve(__dirname, 'src/stores'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@databases': path.resolve(__dirname, 'src/databases')
        }
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag === 'n'
                }
            }
        }),
        tailwindcss(),
    ],
});