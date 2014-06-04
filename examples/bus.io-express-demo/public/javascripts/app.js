$(function () {

  var socket = io(window.location.href);
  socket.on('post', function (who, what, to, when) {
    var ui = $('<div>');
    ui.append($('<span>').addClass('who').append(who));
    ui.append($('<span>').addClass('what').append(what));
    ui.append($('<span>').addClass('to').append(to));
    ui.append($('<span>').addClass('when').append(when));
    $('#messages').append(ui);
  });

});
