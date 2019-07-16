import { task, npm, inputFiles, shell } from 'ts-make'
import { artifact } from 'ts-make/build/artifact';

const { npmInstall } = npm.register()

export const buildHexView = task('build', () => {
    npmInstall.run()
    inputFiles('src/**/*.ts', 'src/**/*.tsx', 'tsconfig.json')
    shell('npm run tsc')
    return artifact('dist/**')
})