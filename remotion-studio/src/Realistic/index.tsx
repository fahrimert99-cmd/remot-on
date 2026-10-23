import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio, staticFile } from "remotion";
import { City } from "./City";
import { DAWN, Landscape, SUNSET } from "./Landscape";

import { SCENE_LEN } from "./util";

export const REAL_SCENE = SCENE_LEN;
const T = 25;
export const REAL_DURATION = REAL_SCENE * 3 - T * 2;

export const Realistic: React.FC = () => {
  const timing = linearTiming({ durationInFrames: T });
  return (
    <>
      <Audio src={staticFile("soundtrack.wav")} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={REAL_SCENE}>
          <Landscape
            look={SUNSET}
            title="Dağlarda Gün Batımı"
            sub="Prosedürel arazi · 6.500 ağaç · gerçek zamanlı gölgeler"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={REAL_SCENE}>
          <City />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={REAL_SCENE}>
          <Landscape
            look={DAWN}
            title="Şafakta Zirveler"
            sub="Atmosferik saçılma ile fiziksel gökyüzü"
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
