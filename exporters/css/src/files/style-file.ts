import { FileHelper } from "@supernovaio/export-helpers"
import { OutputTextFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from ".."
import { convertedToken } from "../content/token"

export function styleOutputFile(type: TokenType, tokens: Array<Token>, tokenGroups: Array<TokenGroup>): OutputTextFile[] | null {
  // Filter tokens by top level type
  const tokensOfType = tokens.filter((token) => token.tokenType === type)

  // Filter out files where there are no tokens, if enabled
  if (!exportConfiguration.generateEmptyFiles && tokensOfType.length === 0) {
    return null
  }

  // Convert all tokens to CSS variables
  const mappedTokens = new Map(tokens.map((token) => [token.id, token]))
  const cssVariables = tokensOfType.map((token) => convertedToken(token, mappedTokens, tokenGroups));
  const tailwind = cssVariables.map((css) => {
    const [key] = css.split(": ");
    const indentString = " ".repeat(exportConfiguration.indent)
    const name = key.trim().replace('--', '');
    return `${indentString}'${name}': 'var(--${name})',`
  }).join('\n')

  // Create file content
  let content = `:root {\n${cssVariables.join('\n')}\n\n${exportConfiguration.baseStyleFilePath}}`
  if (exportConfiguration.showGeneratedFileDisclaimer) {
    // Add disclaimer to every file if enabled
    content = `/* ${exportConfiguration.disclaimer} */\n${content}\n${exportConfiguration.baseStyleFilePath}`
  }

  //create tailwind file content
  let tailwindContent = `module.exports = {\n${tailwind}\n11111}`

  // Retrieve content as file which content will be directly written to the output
  return [FileHelper.createTextFile({
    relativePath: exportConfiguration.baseStyleFilePath,
    fileName: exportConfiguration.styleFileNames[type],
    content: content,
  }),FileHelper.createTextFile({
    relativePath: exportConfiguration.baseStyleFilePath,
    fileName: `${exportConfiguration.styleFileNames[type].replace('.css', '')}-tailwind.cjs`,
    content: tailwindContent,
  })
      ]
}
