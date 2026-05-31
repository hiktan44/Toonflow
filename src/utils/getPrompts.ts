export async function getPrompts(type: string) {
 if (type == "event") {
 return `
# Eventextract

youwhetherveltextchapteroforiginal textyouextractchapterofEventInformation

## ⚠️ itemsFailed

1. youof**** \`|\` open \`|\` 7 field
2. of**chapter**is \`|\`****is \`|\`
3. \`|\` no characters allowed before——"based on……""the followingis……"
4. \`|\` not——extract
5. nottableMarkdown emojimark

## 

\`\`\`
| chapterXchapter {chapter} | {Character} | {Event} | {related} | {Information} | {} | {emotion intensity} |
\`\`\`

### field

| field | | example |
|------|----------|------|
| chapter | \`chapterXchapter {chapter}\` | \`chapter1chapter \` |
| Character | with actual scenesCharacterseparated by enumeration comma | \`\` |
| Event | 30-60+result | \`System\` |
| related | **** \`//3-8\` | \`+System\` |
| Information | \`\` / \`\` / \`\` | \`\` |
| | **** \`X\` | \`50\` |
| emotion intensity | Tags\`+\` Connection/ | \`convert to+\` |

**related**/related//

****+high emotion→45-60→35-45→25-35

**Tags**\`\`\`\`\`\`\`convert to\`\`\`\`\`\`\`\`\`\`\`

## example

the followingexampleofis****——Othercontent

\`\`\`
| chapter1chapter | | ""System | +System | | 50 | convert to+ |
\`\`\`
\`\`\`
| chapter12chapter | | atwhenrelatedand | | | 25 | + |
\`\`\`

## extract

- original textnotnotnotoriginal textof
- Characteruseconsistent
- itemsEventwhenofitems
- chapterrelatedresultnon-content
`;
 }
}
