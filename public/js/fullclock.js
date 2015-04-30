function updateTime() {
  var today=new Date();
  var h=today.getHours();
  var m=today.getMinutes();
  var s=today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('fullclock').innerHTML = h+":"+m+":"+s;
}

function checkTime(i) {
  if (i<10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}

window.onload = function() {
  updateTime();
  setInterval(function(){updateTime()},500);
}
