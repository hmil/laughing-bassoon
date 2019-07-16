import { task, shell, npm, inputFiles } from "ts-make";
import { buildHexView } from '../hexview/make';
import { artifact } from 'ts-make/build/artifact';

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

task('start', () => {
    buildDependencies()
    shell('npm start')
})
