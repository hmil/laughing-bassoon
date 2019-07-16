import { task, npm } from 'ts-make'
import { buildHexView } from './projects/hexview/make';

const { npmInstall } = npm.register()

task('build', () => {
    npmInstall.run()
    buildHexView.run()
})
