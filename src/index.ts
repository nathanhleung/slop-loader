import { LanguageModel } from "ai";
import crypto from "crypto";
import { existsSync } from "fs";
import { readdir, readFile, unlink, writeFile } from "fs/promises";
import { mkdirp } from "mkdirp";
import path from "path";
import { LoaderContext } from "webpack";
import generate, { type PromptContext } from "./generate";

export type SlopLoaderOptions = {
  model: LanguageModel;
  getPrompt?: (ctx: PromptContext) => string;
};

export default async function slopLoader(
  this: LoaderContext<SlopLoaderOptions>,
  sourcePrompt: string
) {
  // If we want to add sourcemaps later, we have to use `callback`
  const callback = this.async();
  const options = this.getOptions();

  if (!options.model) {
    throw new Error(
      "slop-loader requires the `model` option to be set to a Vercel AI SDK `LanguageModel`."
    );
  }

  // Remove `__prompt` suffix from the original filename
  const originalFilename = path.basename(this.resourcePath);
  const [, generatedFilenameWithoutExt, generatedFileExt] =
    originalFilename.match(/(.+)__prompt\.([0-9a-zA-Z]+)$/) ?? [];
  if (!generatedFilenameWithoutExt || !generatedFileExt) {
    throw new Error(
      `Filename ${originalFilename} does not match the pattern expected by \`slop-loader\`. Please use the filename pattern \`<filename>__prompt.<ext>\`.`
    );
  }
  const generatedFilename = `${generatedFilenameWithoutExt}.${generatedFileExt}`;

  const promptHash = `${options.model.modelId
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase()}__${crypto
    .createHash("sha256")
    .update(options.model.modelId)
    .update(sourcePrompt, "utf8")
    .update(options.getPrompt?.toString() ?? "")
    .digest("hex")
    .slice(0, 16)}`;
  const cacheFilename = originalFilename.replace(
    /(.+)__prompt\.([0-9a-zA-Z]+)$/,
    `$1__${promptHash}.$2`
  );

  // `slop-loader` manages caching independently of Webpack, using the `cacheDir`.
  this.cacheable(false);
  const cacheDir = path.resolve(this.rootContext, ".slop");
  const relativeContext = path.relative(this.rootContext, this.context);
  const cachedFileDir = path.resolve(cacheDir, relativeContext);
  const cachedFilePath = path.resolve(cachedFileDir, cacheFilename);

  const logger = this.getLogger("slop-loader");
  if (existsSync(cachedFilePath)) {
    logger.info(
      `Found cached generation for ${originalFilename} in ${cachedFilePath}, so skipping generation...`
    );
    const cachedFileContent = await readFile(cachedFilePath, "utf-8");
    if (cachedFileContent.trim() !== "") {
      callback(null, cachedFileContent);
      return;
    }
  }

  let previouslyGeneratedFilepath;
  if (existsSync(cachedFileDir)) {
    const cachedFileDirFiles = await readdir(cachedFileDir);
    const previouslyGeneratedFilename = cachedFileDirFiles.find((file) =>
      new RegExp(
        `^${generatedFilenameWithoutExt}__[a-zA-Z0-9-]+__[a-zA-Z0-9-]+\.${generatedFileExt}$`
      ).test(file)
    );
    previouslyGeneratedFilepath = previouslyGeneratedFilename
      ? path.resolve(cachedFileDir, previouslyGeneratedFilename)
      : undefined;
  }

  logger.info(`Sending ${originalFilename} to ${module.id} for generation...`);
  const { generatedText } = await generate(options.model, {
    currentDate: new Date(),
    filepath: path.join(relativeContext, generatedFilename),
    sourcePrompt,
    rootContext: this.rootContext,
    previousGeneration: previouslyGeneratedFilepath
      ? await readFile(previouslyGeneratedFilepath, "utf-8")
      : undefined,
  });

  await mkdirp(path.dirname(cachedFilePath));
  await writeFile(cachedFilePath, generatedText, "utf-8");
  if (previouslyGeneratedFilepath) {
    await unlink(previouslyGeneratedFilepath);
  }

  // Allows developer to edit the generated file directly and trigger hot reload.
  this.addDependency(cachedFilePath);

  callback(null, generatedText);
}
