$(function () {
  var me = null,
    socket = io.connect();

  function share() {
    var status = $.trim($('#status').val()),
        target = $('#target').val();

    // Nothing to share
    if(status === '') {
      return;
    }

    // When messaging an individual user, update the target to be the user
    // that is being messaged.
    if(target === 'user') {
      target = $('#target_user').val();
    }

    // Dispatch the message to the server.
    socket.emit('post', status, target);

    // Clear the status input for the next message.
    $('#status').val('');
  }

  socket.on('connect', function () {
    $('#connection').removeClass('disconnected').addClass('connected').html('connected').show();
    $('#update').hide();
    $('#login').show();
  });

  socket.on('disconnect', function () {
    $('#connection').removeClass('connected').addClass('disconnected').html('disconnected').show();
  });

  socket.on('set name', function (who, what) {
    console.log('who', who, 'what', what);
    me = what;
    $('#error').hide();
    $('#login').hide();
    $('#update').show();
  });

  socket.on('post', function (who, what, to, when) {
    if (to === me) {
      to = 'you';
    }
    $('#messages').prepend(
      $('<li>')
        .append($('<span>').addClass('who').append(who))
        .append(' shared ')
        .append($('<span>').addClass('what').append(what))
        .append(' with ')
        .append($('<span>').addClass('to').append(to))
        .append(' at ')
        .append($('<span>').addClass('when').append(when))
    );
  });

  $('#go').click(function () {
    socket.emit('set name', $('#name').val());
  });

  $('#share').click(share);
  $('#status').keypress(function(e) {
    if(e.keyCode === 13) {
      share();
    }
  });

  $('#target').change(function () {
    if ($(this).val() === 'user') {
      $('#target_user').show();
    }
    else {
      $('#target_user').hide();
    }
  });
});
