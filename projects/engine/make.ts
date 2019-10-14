import { task, npm, inputFiles, shell, artifact } from 'ts-make'

const { npmInstall } = npm.register()

const sources = [
    'src/**/*.ts',
    'src/**/*.tsx'
]

const tests = [
    'test/**/*.ts'
]

const buildscripts = [
    'package.json',
    'tsconfig.json'
]

export const buildEngine = task('build', () => {
    npmInstall.run()
    inputFiles(...sources, ...buildscripts)
    shell('npm run tsc')
    return artifact('dist/**')
})

export const test = task('test', () => {
    npmInstall.run()
    inputFiles(...sources, ...tests, ...buildscripts, 'jest.config.js', 'babel.config.js')
    shell('npm run test')
    return artifact('')
})
