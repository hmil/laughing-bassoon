import { task, npm, inputFiles, shell, artifact } from 'ts-make'

const { npmInstall } = npm.register()

export const buildHexView = task('build', () => {
    npmInstall.run()
    shell(`rm -rf node_modules/@types/react-native`)
    inputFiles('src/**/*.ts', 'src/**/*.tsx', 'tsconfig.json')
    shell('npm run tsc')
    return artifact('dist/**')
})