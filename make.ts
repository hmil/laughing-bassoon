import { task, npm } from 'ts-make'
import { buildHexView } from './projects/hexview/make';
import { buildEngine } from './projects/engine/make';
import { start } from './projects/forge/make';

const { npmInstall } = npm.register()

task('build', () => {
    npmInstall.run()
    buildHexView.run()
    buildEngine.run()
})

task('start', () => {
    start.run()
})
