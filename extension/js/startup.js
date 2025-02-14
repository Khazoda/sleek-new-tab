// Prevents jumpy styles loading - disabled for now
function showDOM() {
  // Wait for all images to load before showing content
  Promise.all(
    Array.from(document.images)
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise((resolve) => {
            img.onload = img.onerror = resolve;
          })
      )
  ).then(() => {
    const elements = document.getElementsByClassName("unloaded");
    console.log("All images loaded, showing elements:", elements.length);

    for (let element of elements) {
      element.classList.remove("unloaded");
      element.classList.add("loaded");
    }
  });
}

window.onload = function () {
  showDOM();

  // Run Time check instantly
  var now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  minutes = minutes < 10 ? "0" + minutes : minutes;
  hours = hours < 10 ? "0" + hours : hours;
  document.getElementById("time-display").innerHTML = hours + ":" + minutes;
  // Then run it every 2 seconds
  setInterval(() => {
    var now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    minutes = minutes < 10 ? "0" + minutes : minutes;
    hours = hours < 10 ? "0" + hours : hours;
    document.getElementById("time-display").innerHTML = hours + ":" + minutes;
  }, 2000);
};

let searchbar = document.getElementById("autosizable");
