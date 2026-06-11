# vhs demo/demo.tape  (run from the repo root; restore demo/Card.tsx after)
Output demo/demo.gif

Set FontSize 15
Set Width 1100
Set Height 560
Set Padding 18
Set TypingSpeed 35ms
Set Theme "Dracula"

Hide
Type "alias layoutlint='node packages/rules/dist/cli.js' && clear"
Enter
Sleep 1s
Show

Type "# the agent just wrote Card.tsx — does it actually fit on a phone?"
Enter
Sleep 600ms
Type "layoutlint check demo/Card.tsx"
Enter
Sleep 4.5s

Type `sed -i '' 's/w-96/w-full max-w-96/' demo/Card.tsx   # apply the suggested fix`
Enter
Sleep 1s
Type "layoutlint check demo/Card.tsx"
Enter
Sleep 3s

Type "# verified at 4 viewports in milliseconds — no browser, no screenshots"
Enter
Sleep 3.5s
