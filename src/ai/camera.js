export async function setupCamera(videoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });

  videoElement.srcObject = stream;
  await videoElement.play();

  return videoElement;
}
