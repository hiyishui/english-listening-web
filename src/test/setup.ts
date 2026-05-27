import "@testing-library/jest-dom/vitest";

HTMLMediaElement.prototype.play = function play() {
  return Promise.resolve();
};

HTMLMediaElement.prototype.pause = function pause() {};
