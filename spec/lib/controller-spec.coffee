
describe 'Controller', ->

  Given ->
    setGet = (n) ->
      (v) ->
        if typeof v != 'undefined'
          @data[n] = v
          return @
        else
          return @data[n]
    @Message = class Message
      constructor: ->
        @data =
          actor: 'me'
          action: 'say'
          content: 'hello'
          target: 'you'
          created: new Date
          reference: null
          id: 1
      actor: setGet 'actor' 
      action: setGet 'action'
      target: setGet 'target'
      content: setGet 'content'
      id: setGet 'id'
      created: setGet 'created'
      reference: setGet 'reference'
      published: setGet 'published'
      clone: ->
        return new Message

  Given -> @Controller = requireSubject 'lib/controller', {
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
    And -> expect(@controller.emit.mostRecentCall.args[1].data.created instanceof Date).toBe true

  describe '#deliver', ->

    context 'no args', ->

      When -> @controller.deliver()
      Then -> expect(@controller.emit).toHaveBeenCalledWith 'deliver', @message

    context 'new target', ->
      Given ->
        @m = @message.clone()
        @m.data.target = 'people'
      When -> @controller.deliver 'people'
      Then -> expect(@controller.emit).toHaveBeenCalledWith 'deliver', @m

  describe '#actor', ->

    Given -> @v = 'a'
    Then -> expect(@controller.actor(@v).actor()).toEqual @v
  
  describe '#action', ->

    Given -> @v = 'a'
    Then -> expect(@controller.action(@v).action()).toEqual @v

  describe '#target', ->

    Given -> @v = 'a'
    Then -> expect(@controller.target(@v).target()).toEqual @v

  describe '#content', ->

    context 'array', ->

      Given -> @v = ['a']
      Then -> expect(@controller.content(@v).content()).toEqual @v

    context 'object', ->

      Given -> @v = a: 1
      Then -> expect(@controller.content(@v).content()).toEqual @v

  describe '#id', ->

    When -> expect(@controller.id()).toEqual @controller.data.id

  describe '#created', ->

    When -> expect(@controller.created()).toEqual @controller.data.created

  describe '#reference', ->

    When -> expect(@controller.reference()).toEqual @controller.data.reference

  describe '#published', ->

    When -> expect(@controller.published()).toEqual @controller.data.published
