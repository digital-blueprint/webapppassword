module.exports = {
    input: [
        'src/*.js',
    ],
    output: './',
    options: {
        debug: false,
        removeUnusedKeys: true,
        lngs: ['en','de'],
        resource: {
            loadPath: 'src/i18n/{{lng}}/{{ns}}.json',
            savePath: 'src/i18n/{{lng}}/{{ns}}.json'
        },
    },
}
