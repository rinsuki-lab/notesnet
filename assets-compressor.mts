import {
    brotliCompress,
    constants
} from "node:zlib"
import { promisify } from "node:util"
import { readdir, readFile, writeFile } from "node:fs/promises"

const brotliCompressAsync = promisify(brotliCompress);

const ALLOWED_SUFFIXES = [".js", ".css", ".html"]

const files = await readdir("dist", {
    recursive: true,
}).then(r => r.filter(file => ALLOWED_SUFFIXES.some(suffix => file.endsWith(suffix))))

console.table(Object.fromEntries(await Promise.all(files.map(async file => {
    const raw = await readFile(`dist/${file}`)
    const compressed = await brotliCompressAsync(raw, {
        params: {
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        }
    })
    if (raw.length > compressed.length) {
        await writeFile(`dist/${file}.br`, compressed)
    }
    return [file, {
        raw: raw.length,
        br: compressed.length,
        ratio: compressed.length / raw.length
    }] as const
}))))