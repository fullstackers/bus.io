sm = require 'sandboxed-module'
global.requireSubject = (a,b) ->
  sm.require "./../../#{a}", {b}
