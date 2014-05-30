sm = require 'sandboxed-module'
global.requireSubject = (path,requires) ->
  sm.require "./../../#{path}", {requires}
