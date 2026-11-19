// Called in the page for the app's opaque sRGB two-stop button gradients.
export function gradientContrast(element) {
  const style = getComputedStyle(element);
  const stops = style.backgroundImage.match(/rgb\([^)]+\)/g);
  if (!stops || stops.length !== 2) throw new Error("Expected two sRGB gradient stops: " + element.className);

  function luminance(color) {
    const channels = color.match(/[\d.]+/g).map(Number).map(channel => {
      const value = channel / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  }
  const text = luminance(style.color);
  return Math.min(...stops.map(stop => {
    const background = luminance(stop);
    return (Math.max(text, background) + .05) / (Math.min(text, background) + .05);
  }));
}
