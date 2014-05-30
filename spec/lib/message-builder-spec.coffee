Builder = require './../../lib/message-builder'

describe 'message builder', ->

  Given -> @builder = Builder()
  
  describe '#actor', ->

    Given -> @p = 'you'
    When -> @builder.actor @p 
    Then -> expect(@builder.message.data.actor).toBe @p

  describe '#target', ->

    Given -> @p = 'you'
    When -> @builder.target @p
    Then -> expect(@builder.message.data.target).toBe @p

  describe '#content', ->

    Given -> @p = 'you'
    When -> @builder.content @p
    Then -> expect(@builder.message.data.content).toBe @p

  describe '#action', ->

    Given -> @p = 'you'
    When -> @builder.content @p
    Then -> expect(@builder.message.data.action).toBe @p

  dsecribe '#i', ->

    Given -> @p = 'you'
    When -> @builder.i @p
    Then -> expect(@builder.message.data.actor).toBe @p

  dsecribe '#did', ->

    Given -> @p = 'you'
    When -> @builder.did @p
    Then -> expect(@builder.message.data.action).toBe @p

  dsecribe '#what', ->

    Given -> @p = 'you'
    When -> @builder.what @p
    Then -> expect(@builder.message.data.content).toBe @p

  dsecribe '#to', ->

    Given -> spyOn(@builder, ['emit'])
    Given -> @p = 'you'
    When -> @builder.to @p
    Then -> expect(@builder.message.data.target).toBe @p
    And -> expect(@builder.emit).toHaveBeenCalledWith 'built', @builder.message

  describe '#deliver', ->

    context 'with params', ->

      Given -> spyOn(@builder, ['emit'])
      Given -> @p = 'you'
      When -> @builder.deliver @p
      Then -> expect(@builder.message.data.target).toBe @p
      And -> expect(@builder.emit).toHaveBeenCalledWith 'built', @builder.message

      # NOTE need to update this test
    context 'with multiple params', ->

      Given -> spyOn(@builder, ['emit'])
      Given -> @p = 'you'
      When -> @builder.deliver @p
      Then -> expect(@builder.message.data.target).toBe @p
      And -> expect(@builder.emit).toHaveBeenCalledWith 'built', @builder.message

    context 'with no params', ->

      Given -> spyOn(@builder, ['emit'])
      Given -> @p = 'you'
      Given -> @builder.target @p
      When -> @builder.deliver
      Then -> expect(@builder.message.data.target).toBe @p
      And -> expect(@builder.emit).toHaveBeenCalledWith 'built', @builder.message

