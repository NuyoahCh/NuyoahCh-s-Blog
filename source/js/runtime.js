// 网站运行时间计时器
function siteTime() {
  window.setTimeout("siteTime()", 1000);
  var seconds = 1000;
  var minutes = seconds * 60;
  var hours = minutes * 60;
  var days = hours * 24;
  var today = new Date();
  var startTime = new Date("2024-01-01");  // 替换为你的建站时间
  var elapsedTime = today.getTime() - startTime.getTime();
  var daysCount = Math.floor(elapsedTime / days);
  var hoursCount = Math.floor((elapsedTime % days) / hours);
  var minutesCount = Math.floor((elapsedTime % hours) / minutes);
  var secondsCount = Math.floor((elapsedTime % minutes) / seconds);
  
  if (document.getElementById("runtime_span")) {
    document.getElementById("runtime_span").innerHTML = daysCount + "天" + hoursCount + "时" + minutesCount + "分" + secondsCount + "秒";
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // 初始化运行时间
  if (document.getElementById("runtime_span")) {
    siteTime();
  }
}); 