import * as YAML from "yaml";
function extractYoutubeVideoId(url) {
  let match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (match) {
    return match[1];
  }
  match = url.match(/youtu.be\/([^&]+)/);
  if (match) {
    return match[1];
  }
  return null;
}
export function embedWidget(bodyText) {
  try {
    const data = YAML.parse(bodyText);
    let url = data.url;
    const youtubeVideoId = extractYoutubeVideoId(url);
    if (youtubeVideoId) {
      url = `https://www.youtube.com/embed/${youtubeVideoId}`;
      data.width = data.width || 560;
      data.height = data.height || 315;
    }
    return {
      url,
      height: data.height,
      width: data.width
    };
  } catch (e) {
    return {
      html: `ERROR: Could not parse body as YAML: ${e.message}`,
      script: ""
    };
  }
}
