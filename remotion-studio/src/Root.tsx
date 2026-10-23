import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Showcase, SHOWCASE_DURATION } from "./Showcase";
import { Realistic, REAL_DURATION } from "./Realistic";
import { PixarScene } from "./Pixar";
import { ElifTrailer, ELIF_LEN } from "./Elif";
import { PIXAR_LEN } from "./Pixar/anim";
import { City } from "./Realistic/City";
import { DAWN, Landscape, SUNSET } from "./Realistic/Landscape";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Elif" component={ElifTrailer} durationInFrames={ELIF_LEN} fps={30} width={1920} height={1080} />
      <Composition id="Pitir" component={PixarScene} durationInFrames={PIXAR_LEN} fps={30} width={1920} height={1080} />
      <Composition id="Gercekci" component={Realistic} durationInFrames={REAL_DURATION} fps={30} width={1920} height={1080} />
      <Folder name="Gercekci-Sahneler">
        <Composition id="Dag" component={Landscape} durationInFrames={270} fps={30} width={1920} height={1080}
          defaultProps={{ look: SUNSET, title: "Dağlarda Gün Batımı", sub: "Prosedürel arazi · 6.500 ağaç · gerçek zamanlı gölgeler" }} />
        <Composition id="Sehir" component={City} durationInFrames={270} fps={30} width={1920} height={1080} />
        <Composition id="Safak" component={Landscape} durationInFrames={270} fps={30} width={1920} height={1080}
          defaultProps={{ look: DAWN, title: "Şafakta Zirveler", sub: "Atmosferik saçılma ile fiziksel gökyüzü" }} />
      </Folder>
      <Composition
        id="Showcase"
        component={Showcase}
        durationInFrames={SHOWCASE_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

    </>
  );
};
