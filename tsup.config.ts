import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/container.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
});