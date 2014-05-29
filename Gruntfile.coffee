module.exports = (g) ->
  g.initConfig
    spec:
      unit:
        options:
          helpers: 'spec/helpers/**/*.{js,coffee}'
          specs: 'spec/**/*.{js,coffee}'

  g.loadNpmTasks 'grunt-jasmine-bundle'
  g.registerTask 'default', ['spec:unit']
