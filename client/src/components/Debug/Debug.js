import DebugFace from "./DebugFace";
import DebugTrackingFingers from "./DebugTrackingFingers";

const Debug = ({ currentFaceDetection, motionTrackedPointables }) => {
  return (
    <div>
      <p
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          color: "red",
        }}
      >
        Debug Mode
      </p>
      <DebugFace currentFaceDetection={currentFaceDetection} />
      {motionTrackedPointables.map((pointable) => (
        <DebugTrackingFingers key={pointable.id} finger={pointable} />
      ))}
    </div>
  );
};

export default Debug;
