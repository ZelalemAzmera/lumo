import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/lumo.min.js',
      format: 'iife',
      name: 'Lumo',
      sourcemap: true
    },
    {
      file: 'dist/lumo.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist/types'
    }),
    terser({
      format: {
        comments: false
      },
      compress: {
        drop_console: false, // Keep warnings/errors
        drop_debugger: true
      }
    })
  ]
};
