module.exports = (g) ->

  g.loadNpmTasks 'grunt-jasmine-bundle'

  g.initConfig
    spec:
      unit:
        options:
          helpers: 'spec/helpers/**/*.{js,coffee}'
          specs: 'spec/**/*.{js,coffee}'

  g.registerTask 'default', ['spec:unit']
