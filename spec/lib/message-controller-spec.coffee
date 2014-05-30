
describe 'message controller', ->

  Given -> @Controller = requireSubject 'lib/message-controller', {}

  Given ->
    @message =
      data:
        actor: 'me'
        action: 'say'
        content: 'hello'
        target: 'you'
        created: new Date


  When -> @controller  = @Controller @message
  Then -> expect(@controller instanceof @Controller).toBe true
  And -> expect(@controller.message).toEqual @message

  describe '#consume', ->
    Given -> spyOn(@controller, ['emit'])
    When -> @controller.consume()
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'consume'


  describe '#respond', ->
    Given -> spyOn(@controller, ['emit'])
    When -> @controller.respond 'goodbye'
    Then -> expect(@controller.emit).toHaveBeenCalled()
    And -> expect(@controller.emit.mostRecentCall.args[0]).toBe 'respond'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.actor).toBe 'you'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.action).toBe 'say'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.content).toBe 'goodbye'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.target).toBe 'me'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.created instanceof Date).toBe true

  describe '#deliver', ->
    Given -> spyOn(@controller, ['emit'])
    When -> @controller.deliver 'people'
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'deliver', @message

