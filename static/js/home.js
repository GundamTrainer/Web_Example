function onAuthReady() {
  const loginBox = document.getElementById("loginBox");
  const welcomeBox = document.getElementById("welcomeBox");
  const hello = document.getElementById("hello");
  if (!loginBox || !welcomeBox) return;

  loginBox.hidden = Boolean(currentUser);
  welcomeBox.hidden = !currentUser;
  if (currentUser && hello) {
    hello.textContent = currentUser.email.split("@")[0] + "님, 환영합니다.";
  }
}
