
describe 'message controller', ->

  Given ->
    id = 0
    @Message = class Message
      constructor: ->
        @data =
          actor: 'me'
          action: 'say'
          content: 'hello'
          target: 'you'
          created: new Date
          reference: null
        @id = ++id

      clone: ->
        return new Message

  Given -> @Controller = requireSubject 'lib/message-controller', {
    './message': @Message
  }

  Given -> @message = new @Message

  Given ->
    @controller = @Controller @message
    spyOn(@controller,'emit').andCallThrough()
  Then -> expect(@controller instanceof @Controller).toBe true
  And -> expect(@controller.message).toEqual @message

  describe '#consume', ->
    When -> @controller.consume()
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'consume', @message
    And -> expect(@message.consumed instanceof Date).toBe true


  describe '#respond', ->
    When -> @controller.respond 'goodbye'
    Then -> expect(@controller.emit).toHaveBeenCalled()
    And -> expect(@controller.emit.mostRecentCall.args[0]).toBe 'respond'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.actor).toBe 'you'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.action).toBe 'say'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.content).toBe 'goodbye'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.target).toBe 'me'
    And -> expect(@controller.emit.mostRecentCall.args[1].data.reference).toBe 1
    And -> expect(@controller.emit.mostRecentCall.args[1].id).toBe 2
    And -> expect(@controller.emit.mostRecentCall.args[1].data.created instanceof Date).toBe true

  describe '#deliver', ->
    When -> @controller.deliver 'people'
    Then -> expect(@controller.emit).toHaveBeenCalledWith 'deliver', @message

