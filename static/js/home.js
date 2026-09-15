function onAuthReady() {
  const stage = document.getElementById("arenaStage");
  const message = document.getElementById("battleMessage");
  const note = document.getElementById("tradeNote");
  if (!stage) return;

  document.getElementById("simulateButton").addEventListener("click", function () {
    stage.classList.toggle("event-up");
    message.textContent = stage.classList.contains("event-up")
      ? "매수세가 타워를 한 칸 올렸습니다"
      : "하락 신호! 상대 타워가 공격 중";
  });

  document.getElementById("dropBomb").addEventListener("click", function () {
    stage.classList.remove("event-up");
    stage.classList.add("event-bomb");
    message.textContent = "변동성 이벤트 발생, 방어선을 확인하세요";
    window.setTimeout(function () { stage.classList.remove("event-bomb"); }, 700);
  });

  ["buyButton", "sellButton"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function () {
      const quantity = Number(document.getElementById("quantity").value) || 1;
      const action = id === "buyButton" ? "매수" : "매도";
      note.textContent = quantity + "주 " + action + " 주문을 준비했습니다 (모의투자)";
      note.classList.add("confirmed");
    });
  });
}
