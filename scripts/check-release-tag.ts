import { env } from "node:process";
import pkg from "../packages/react-visual-novel/package.json" with { type: "json" };

const expectedTag = `v${pkg.version}`;
const releaseTag = env["RELEASE_TAG"];
if (releaseTag !== expectedTag) {
  throw new Error(
    `Release tag ${JSON.stringify(releaseTag)} does not match ${expectedTag}`,
  );
}
