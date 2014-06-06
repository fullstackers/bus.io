describe.only 'Point', ->

  Given -> @Point = requireSubject 'lib/point', {}

  describe '#(index:Number=0, fn:Function, action:String="say")', ->

    Given -> @index = 0
    Given -> @fn = ->
    Given -> @action = 'say'
    When -> @point = @Point @index, @fn, @action
    Then -> expect(@point instanceof @Point).toBe true
    And -> expect(@point.action).toEqual @action
    And -> expect(@point.fn).toEqual @fn
    And -> expect(@point.index).toEqual @index

  describe '#(index:Number=0, fn:Function)', ->

    Given -> @index = 0
    Given -> @fn = ->
    When -> @point = @Point @index, @fn
    Then -> expect(@point instanceof @Point).toBe true
    And -> expect(@point.action).toEqual '*'
    And -> expect(@point.fn).toEqual @fn
    And -> expect(@point.index).toEqual @index

  describe '#(index:Number=0, fn:Null)', ->

    Given -> @index = 0
    Given -> @fn = null
    Given -> @test = => @Point @action, @fn
    Then -> expect(@test).toThrow  new Error('fn must be a function')
