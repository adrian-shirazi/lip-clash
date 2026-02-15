(function () {
  const name = localStorage.getItem("name");

  if (!name) {
    window.location.href = "/join.html";
  } else {
    window.location.href = "/lobby.html";
  }
})();
