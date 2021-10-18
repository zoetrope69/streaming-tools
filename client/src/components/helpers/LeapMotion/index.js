import Leap from "leapjs";
import { screenPosition } from "./screenPosition";
import throttle from "lodash.throttle";

const GENERIC_EVENTS = [
  "ready",
  // "blur",
  // "focus",
  "deviceStreaming",
  "deviceStopped",
  "connect",
  "disconnect",
];

function LeapMotion(socket) {
  function emit(data) {
    // eslint-disable-next-line no-console
    console.log("[Client] Leap Motion data sent to server", data);
    socket.emit("leap-motion", data);
  }

  const controller = new Leap.Controller({
    frameEventName: "animationFrame",
    background: true,
    loopWhileDisconnected: false,
  });

  Leap.Controller.plugin("screenPosition", screenPosition);
  controller.use("screenPosition");

  emit({ event: "connecting", data: true });
  emit({ event: "version", data: Leap.version });

  const eventListeners = GENERIC_EVENTS.map((event) => {
    const listener = (data) => {
      // eslint-disable-next-line no-console
      console.log(`[Client][Leap Motion] ${event}`, data);
      emit({ event, data });
    };

    controller.on(event, listener);

    return { event, listener };
  });

  const frameEventListener = (data) => {
    controller.emit("frame-throttled", data);
  };
  controller.on(
    "frame",
    throttle(frameEventListener, 16.66 /* 16.66 60FPS */)
  );

  // eslint-disable-next-line no-console
  console.log("[Client][Leap Motion] Connecting...");
  controller.connect();

  return {
    controller,
    disconnectController: () => {
      // eslint-disable-next-line no-console
      console.log("[Client][Leap Motion] Disconnecting...");
      eventListeners.forEach(({ event, listener }) => {
        if (event && listener) controller.off(event, listener);
      });
      controller.off("frame", frameEventListener);
      controller.disconnect();
    },
  };
}

export default LeapMotion;
