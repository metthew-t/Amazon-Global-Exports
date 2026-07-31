import fs from 'fs';
import path from 'path';
import readline from 'readline';

const transcriptPath = 'C:\\Users\\Pc\\.gemini\\antigravity-ide\\brain\\0ceeece2-a685-4a04-9d0e-93a3183f31bb\\.system_generated\\logs\\transcript_full.jsonl';

async function recover() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const files = {};

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
        for (const tool of data.tool_calls) {
          if (tool.function === 'default_api:write_to_file') {
            const args = tool.arguments;
            files[args.TargetFile] = args.CodeContent;
          } else if (tool.function === 'default_api:replace_file_content' || tool.function === 'default_api:multi_replace_file_content') {
            // we will just track writes for now, or print what files were touched.
            // If we need replacements, it might be harder. Most page migrations were write_to_file.
          }
        }
      }
    } catch (e) {}
  }

  for (const [filepath, content] of Object.entries(files)) {
    // Only restore frontend files, avoid overriding anything in backend or random stuff
    if (filepath.includes('frontend\\src') || filepath.includes('frontend\\tailwind.config.js')) {
      console.log('Recovering:', filepath);
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      fs.writeFileSync(filepath, content);
    }
  }
}

recover().catch(console.error);
