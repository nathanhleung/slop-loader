import "./styles__prompt.css";

// @ts-expect-error slop-loader
import Background from "./components/Background__prompt";
// @ts-expect-error slop-loader
import Header from "./components/Header__prompt";
// @ts-expect-error slop-loader
import Pre from "./components/Pre__prompt";
// @ts-expect-error slop-loader
import LinkButton from "./components/LinkButton__prompt";
// @ts-expect-error slop-loader
import text from "./copy/text__prompt.txt";

export default function Home() {
  return (
    <>
      <Header brand="slop-loader" />
      <Background />
      <div className="flex w-screen items-center justify-center pt-36 pb-24">
        <div className="flex flex-col gap-8 max-w-1/2 text-black items-start">
          <h1 className="text-6xl">slop-loader</h1>
          <Pre className="text-sm">{text}</Pre>
          <video
            className="border border-gray-300"
            src="/slop-loader.mp4"
            autoPlay
            muted
            controls
          />
          <LinkButton href="https://github.com/nathanhleung/slop-loader">
            View on GitHub
          </LinkButton>
        </div>
      </div>
    </>
  );
}
