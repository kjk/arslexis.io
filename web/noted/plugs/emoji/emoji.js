import emojis from "./emoji.json" assert { type: "json" };
export function emojiCompleter({ linePrefix, pos }) {
  const match = /:([\w]+)$/.exec(linePrefix);
  if (!match) {
    return null;
  }
  const [fullMatch, emojiName] = match;
  const filteredEmoji = emojis.filter(
    ([_, shortcode]) => shortcode.includes(emojiName)
  );
  return {
    from: pos - fullMatch.length,
    filter: false,
    options: filteredEmoji.map(([emoji, shortcode]) => ({
      detail: shortcode,
      label: emoji,
      type: "emoji"
    }))
  };
}
