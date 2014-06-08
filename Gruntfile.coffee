module.exports = (g) ->

  g.loadNpmTasks 'grunt-jasmine-bundle'

  g.initConfig
    spec:
      unit:
        options:
          helpers: 'spec/helpers/**/*.{js,coffee}'
          specs: 'spec/**/*.{js,coffee}'
      e2e:
        options:
          helpers: 'spec-e2e/helpers/**/*.{js,coffee}'
          specs: 'spec-e2e/**/*.{js,coffee}'

  g.registerTask 'default', ['spec:unit', 'spec:e2e']
