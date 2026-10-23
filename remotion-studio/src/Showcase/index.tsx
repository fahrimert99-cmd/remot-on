import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { useVideoConfig } from "remotion";
import { CodeScene } from "./CodeScene";
import { DataScene } from "./DataScene";
import { GenerativeScene } from "./GenerativeScene";
import { Intro } from "./Intro";
import { Outro } from "./Outro";
import { ShapesScene } from "./ShapesScene";
import { ThreeScene } from "./ThreeScene";

export const SCENE = 150;
export const T = 20;
export const SHOWCASE_DURATION = SCENE * 7 - T * 6;

export const Showcase: React.FC = () => {
  const { width, height } = useVideoConfig();
  const timing = linearTiming({ durationInFrames: T });
  const sp = springTiming({ durationInFrames: T, config: { damping: 200 } });

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <ThreeScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={sp} />
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <DataScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-top-left" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <GenerativeScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={flip({ direction: "from-left" })} timing={sp} />
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <ShapesScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={clockWipe({ width, height })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <CodeScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={sp} />
      <TransitionSeries.Sequence durationInFrames={SCENE}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
