{
  "$schema": "./node_modules/@swayloop/ui-agent/schema/ui-agent.config.schema.json",
  "framework": "next",
  "designSystem": "shadcn",
  "paths": {
    "designSpec": "design/DESIGN.md",
    "skill": "design/SKILL.md",
    "tokens": "design/tokens.json",
    "componentsDir": "components/ui",
    "storiesDir": "components/stories",
    "manifest": "components/components.manifest.json",
    "outputRoot": "app"
  },
  "worker": {
    "agent": "claude",
    "parallelism": 4,
    "isolation": "worktree"
  },
  "figma": {
    "fileKey": null,
    "syncLibrary": false,
    "generateMockups": false
  },
  "qa": {
    "designLint": true,
    "a11y": true,
    "responsive": true,
    "visualDiff": false,
    "retryOnFail": 1
  }
}
