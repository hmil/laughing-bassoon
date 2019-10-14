import { task, shell, npm, inputFiles, artifact } from "ts-make";
import { buildHexView } from '../hexview/make';

const { npmInstall } = npm.register();

function buildDependencies() {
    npmInstall.run()
    buildHexView.run()
}

task('build', () => {
    buildDependencies()
    inputFiles('src/**/*.ts', 'src/**/*.tsx', 'tsconfig.json')
    shell('npm run build')
    return artifact('dist/**')
})

export const start = task('start', () => {
    buildDependencies()
    shell('npm start')
})
