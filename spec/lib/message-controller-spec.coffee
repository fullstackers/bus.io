Controller = require './../../lib/message-controller'

describe 'message controller', ->

  Given ->
    @message =
      data:
        actor: 'me'
        action: 'say'
        content: 'hello'
        target: 'you'


  When -> @controller  = Controller @message
  Then -> expect(@controller instanceof Controller).toBe true
  And -> expect(@controller.message).toEqual @message

  describe '#consume', ->
    Given -> spyOn(@controller, ['emit'])
    When -> @controller.consume()
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'consume'


  describe '#respond', ->
    Given -> spyOn(@controller, ['emit'])
    When -> @controller.consume()
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'respond'

  describe '#deliver', ->
    Given -> spyOn(@controller, ['emit'])
    When -> @controller.deliver 'people'
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'deliver'

